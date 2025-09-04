# Discord Bot – Feature Design Docs
Single bot · Stateless-first · Channel‑gated features

**Features:**
- **Announcements** → publish posts from `#announcements` to the website.
- **Jobs** → fetch recent postings from Simplify, dedupe, post to `#opportunities-internship` and `#opportunities-newgrad`, and (optionally) upsert to website.
- **Resume Review** → two slash commands `/roast` and `/score` that call your external AI endpoints.

**Principles:**
- Prefer **stateless**. Any dedupe or persistence is delegated to the Platform API (website) or short‑lived in‑memory caches.
- **Channel‑guarded** commands. All actions must be invoked from the correct channels.
- **Least privileges** (role checks for officer‑only operations like publishing).
- **Clear user feedback** (ephemeral responses on success/failure).

**Env/Config (excerpt):**
```
DISCORD_TOKEN=...
GUILD_ID=...
ANNOUNCEMENTS_CHANNEL_ID=...
RESUME_CHANNEL_ID=...
JOBS_INTERNSHIP_CHANNEL_ID=...
JOBS_NEWGRAD_CHANNEL_ID=...
SIMPLIFY_API_BASE=https://api.simplify.jobs
SIMPLIFY_API_KEY=... (optional)
RESUME_ROAST_URL=https://api.example.com/resume/roast
RESUME_SCORE_URL=https://api.example.com/resume/score
PLATFORM_API_BASE=https://platform.example.com/api
PLATFORM_API_KEY=...
TIMEZONE=America/Chicago
```

---

## 1) Announcements
### Goal
Push messages posted in **`#announcements`** to the website via Platform API.

### Slash Commands
- **`/publish [message_id]`**
  - `message_id` default: **"last message"** → resolves to the most recent non‑bot message in `#announcements`.
- **`/batch_publish <message_ids...>`**
  - Publish multiple specific messages in one call (up to 10 per invocation suggested).

### Permissions & Guards
- Must be invoked **in `#announcements`**.
- Caller must have **Officer** role (configurable role ID list).
- Ephemeral confirmations; post a public ✅ reaction on the source message on success.

### Flow
1. Resolve target message(s): fetch by ID(s) or last message.
2. Extract:
   - `content` (text), `embeds`, `attachments` (image URLs), `author`, `message_url`, `created_at`.
3. Normalize to a **Publish DTO** and call Platform API.
4. Handle **409 Already Exists** as success-with-note (idempotent publish).
5. Reply ephemeral with per‑message status and surface any validation errors.

### Publish DTO → Platform API
**Request** `POST /announcements/ingest`
```json
{
  "source": "discord",
  "source_id": "<message_id>",
  "source_url": "https://discord.com/channels/<guild>/<channel>/<message>",
  "title": "<first line or derived>",
  "body_markdown": "<message content as markdown>",
  "images": [{"url": "..."}],
  "embeds": [{"title": "...", "description": "...", "url": "..."}],
  "author": {"id": "<user_id>", "name": "<display_name>"},
  "posted_at": "2025-09-04T17:31:00Z",
  "dedupe_key": "discord:announcements:<message_id>"
}
```
**Response** `201 Created`
```json
{
  "id": "anc_123",
  "slug": "fall-kickoff-pizza",
  "published_url": "https://club.site/announcements/fall-kickoff-pizza"
}
```
**Error cases**
- `409 Conflict` → already ingested (treat as success; return existing `id/slug`).
- `422` → validation error (present first few issues to user).

### UX Details
- When the source has no explicit title, use first 80 chars of content as title.
- If there are images, attach first image as **hero** on the website (rest as gallery).
- Add a ✅ reaction to the Discord message once published (helps quick scanning).

### Testing
- Unit: message extraction → DTO mapping.
- Integration (mocked HTTP): 201 path, 409 path, 422 path.

---

## 2) Jobs (Simplify)
### Goal
Fetch recent postings from **Simplify**, dedupe, and post new items to:
- `#opportunities-internship` for internships
- `#opportunities-newgrad` for full‑time

### Triggers
- **Manual**: `/jobs fetch_now query:<str?> location:<str?> remote_only:<bool>` (officer‑only, in either jobs channel).
- **Scheduled**: in‑memory scheduler (APScheduler) interval (e.g., every 2–6 hours).
  - Stateless‑friendly: on restart, schedule re‑initializes; Platform/API does the durable dedupe.

### Dedupe Strategy
1. Prefer a **provider ID** if Simplify returns one (e.g., `simplify_id`).
2. Else compute **fingerprint**: `sha256(lower(title)|lower(company)|canonical_url)`.
3. Check against Platform API: `HEAD /opportunities/exists?provider=simplify&id=<id>` or `?fingerprint=...`.
   - If **exists** → skip.
   - If **not exists** → **post to Discord** and **ingest** to Platform.
4. Optional local safety net: an in‑memory LRU set of the last 500 IDs this process saw (reduces churn between runs).

### Mapping (Normalize Simplify → Opportunity)
```json
{
  "title": "Software Engineer Intern, Graphics",
  "company": "Qualcomm",
  "url": "https://...",
  "location": "San Diego, CA (Hybrid)",
  "type": "internship" | "newgrad",
  "posted_at": "2025-09-01T00:00:00Z",
  "source": {
    "provider": "simplify",
    "id": "simp_abc123",
    "fingerprint": "sha256:..."
  }
}
```

### Discord Posting Format
- One embed per job (compact): title links to `url`; fields for company, location, posted date.
- Batch results in a single message with multiple embeds (max 10 embeds/message).
- Tag channel with a brief header: `Found 5 new internships · query:"ml"`.

### Platform API (optional) – Upsert
`POST /opportunities/ingest` → accepts the normalized object + dedupe key.
- `201` new; `409` exists (OK to ignore); `422` validation errors.

### Rate Limits & Backoff
- Page through Simplify with `limit=25` (configurable); cap to 100 per fetch.
- Respect per‑provider rate limits; exponential backoff on `429`.

### Testing
- Unit: mapping + fingerprint; channel routing (intern vs newgrad).
- Integration: fetch mock, post mock, ingest mock.

### Future (optional persistence)
- If we need faster local dedupe: lightweight SQLite file mounted via Docker volume storing `(provider,id,fingerprint)` (still simple to operate).

---

## 3) Resume Review
### Commands
- **`/roast <resume: pdf_file>`**
  - Output: terse, candid critique oriented to **university recruiter** perspective.
  - Strictness 8/10.
- **`/score <resume: pdf_file> <job_link: str>`**
  - Output: ATS‑style match notes + **score 0–10** with rationale.
  - Strictness 8/10.

### Permissions & Guards
- Must be invoked in **`#resume-review`** (configured ID).
- Responses are **ephemeral** to the requester by default.

### Request Flow
1. Validate file extension: `.pdf` (allow `.docx` if desired).
2. `await attachment.read()` → bytes → multipart upload to API.
3. POST to **Resume API** with `strictness=8` and optional `job_link`.
4. Render formatted reply: headline verdict + key bullets; include a “download full report” link if API returns one.

### Resume API Contracts (proposed)
**`POST /resume/roast`**
- multipart: `file` (resume), JSON fields: `{ "strictness": 8 }`
- Response:
```json
{
  "summary": "Punchy one‑paragraph verdict.",
  "bullets": [
    {"section":"Experience","issue":"No quantified impact","fix":"Add metrics (%, $, time) to 3 bullets."},
    {"section":"Formatting","issue":"Dense paragraphs","fix":"Convert to scannable bullets; 14px headers."}
  ],
  "links": {"full_report": "https://..."}
}
```

**`POST /resume/score`**
- multipart: `file` + JSON `{ "job_link": "...", "strictness": 8 }`
- Response:
```json
{
  "score": 7.2,
  "summary": "Likely to pass ATS for SWE new‑grad; skills alignment good, projects thin.",
  "ats_findings": {
    "must_haves_missing": ["Kubernetes"],
    "keyword_coverage": {"Python": true, "PyTorch": true, "CUDA": false}
  },
  "bullets": [
    {"section":"Projects","issue":"Lacking scale details","fix":"State dataset sizes and metrics."}
  ],
  "links": {"full_report": "https://..."}
}
```

### UX Details
- Responses are concise by default (summary + 4–6 bullets + score). If a `full_report` link is provided, include it.
- If processing > 10s, keep using deferred `followup` messages to avoid timeouts.

### Errors
- Invalid file type → ephemeral guidance.
- API 4xx → show first issue; 5xx → generic retry later.
- Large files → fail fast with size limit message (e.g., 5MB).

### Testing
- Unit: file validation; response rendering.
- Integration: mock API responses; long‑running defer/timeout.

---

## Security, Observability, Ops
- **AuthN/AuthZ**: role checks for publish; channel guards elsewhere. No secrets in messages.
- **Rate limiting**: per‑user cool‑downs on heavy commands (`/batch_publish`, `/jobs fetch_now`).
- **Logging**: structured logs (no PII); log correlation IDs from external APIs.
- **Metrics** (optional): counts of published announcements, jobs posted, reviews generated.
- **Error surfacing**: officer‑only log thread (or a private channel) for failures.

---

## Implementation Notes & Stubs
- Each feature is a **Cog** with `@app_commands.command` methods.
- Reuse `channel_guard(CHANNEL_ID)` check.
- Use `httpx.AsyncClient` with 30–60s timeouts.
- For announcements, use `message.to_reference().jump_url` for canonical links.
- For jobs embeds, keep ≤10 embeds/message; chunk if needed.

---

## Rollout Plan
1. Configure channel IDs and API URLs in `.env`.
2. Deploy bot to staging guild; run `/sync`.
3. Smoke test:
   - `/publish` on a fresh message → 201 path
   - `/publish` again → 409 idempotency path
   - `/jobs fetch_now query:"intern"` → posts to internship channel
   - `/roast` and `/score` with a dummy PDF
4. Promote to prod guild; pin a short help message in each channel.

