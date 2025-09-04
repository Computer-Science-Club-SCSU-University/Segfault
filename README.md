# Segfault

The official discord bot for the Computer Science Club at St. Cloud State University.

## 🚀 Features

### 📢 Announcements
- **Publish to Website**: Automatically push Discord announcements to the website
- **Batch Publishing**: Publish multiple messages at once with `/batch_publish`
- **Smart Defaults**: Use `/publish` without parameters to publish the latest message
- **Role-Based Access**: Officer permissions required for publishing

### 💼 Job Opportunities
- **Automated Job Fetching**: Integrates with Simplify API to fetch recent job postings
- **Smart Categorization**: Automatically routes internships and new-grad positions to appropriate channels
- **Deduplication**: Prevents duplicate job postings using provider IDs and content fingerprinting
- **Scheduled Updates**: Configurable automatic job fetching (every 2-6 hours)
- **Manual Triggers**: On-demand job fetching with custom filters

### 📄 Resume Review
- **AI-Powered Roasting**: Get candid, recruiter-perspective feedback with `/roast`
- **ATS Scoring**: Analyze resume compatibility with job postings using `/score`
- **Detailed Reports**: Receive actionable feedback with specific improvement suggestions
- **Privacy-First**: All responses are ephemeral (private) by default

## 🏗️ Architecture

**Design Principles:**
- **Stateless-First**: Minimal state management, delegating persistence to external APIs
- **Channel-Gated**: All features are restricted to specific channels for organization
- **Least Privileges**: Role-based access control for sensitive operations
- **Clear Feedback**: Comprehensive user feedback with ephemeral responses

**Tech Stack:**
- **Framework**: discord.py with application commands
- **HTTP Client**: httpx for async API calls
- **Scheduling**: APScheduler for automated tasks
- **Configuration**: Environment-based configuration management

## 📋 Prerequisites

- Python 3.9+
- Discord Bot Token with appropriate permissions
- Access to external APIs (Platform API, Resume API, Simplify API)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd segfault
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run the bot**
   ```bash
   python src/main.py
   ```

## ⚙️ Configuration

Create a `.env` file with the following variables:

```env
# Discord Configuration
DISCORD_TOKEN=your_discord_bot_token
GUILD_ID=your_discord_server_id

# Channel IDs
ANNOUNCEMENTS_CHANNEL_ID=channel_id_for_announcements
RESUME_CHANNEL_ID=channel_id_for_resume_review
JOBS_INTERNSHIP_CHANNEL_ID=channel_id_for_internship_posts
JOBS_NEWGRAD_CHANNEL_ID=channel_id_for_newgrad_posts

# External APIs
SIMPLIFY_API_BASE=https://api.simplify.jobs
SIMPLIFY_API_KEY=your_simplify_api_key_optional
RESUME_ROAST_URL=https://api.example.com/resume/roast
RESUME_SCORE_URL=https://api.example.com/resume/score
PLATFORM_API_BASE=https://platform.example.com/api
PLATFORM_API_KEY=your_platform_api_key

# Other Settings
TIMEZONE=America/Chicago
```

## 📖 Usage

### Announcement Commands
- `/publish [message_id]` - Publish a message to the website (defaults to latest message)
- `/batch_publish <message_ids...>` - Publish multiple messages at once

### Job Commands
- `/jobs fetch_now [query] [location] [remote_only]` - Manually fetch job postings

### Resume Review Commands
- `/roast <resume.pdf>` - Get candid feedback on your resume
- `/score <resume.pdf> <job_link>` - Get ATS compatibility score for a specific job

## 🔒 Permissions

### Channel Restrictions
- **Announcements**: Commands must be used in the designated announcements channel
- **Resume Review**: Commands must be used in the designated resume review channel
- **Jobs**: Commands must be used in internship or new-grad opportunity channels

### Role Requirements
- **Publishing**: Requires Officer/Moderator role
- **Job Fetching**: Requires Officer/Moderator role
- **Resume Review**: Available to all users in the correct channel

## 🧪 Testing

Run the test suite:
```bash
python -m pytest tests/
```

**Test Coverage:**
- Unit tests for message extraction and DTO mapping
- Integration tests with mocked HTTP responses
- End-to-end workflow testing

## 📊 API Integration

### Platform API
- **Announcements**: `POST /announcements/ingest`
- **Job Opportunities**: `POST /opportunities/ingest`
- **Deduplication**: `HEAD /opportunities/exists`

### Resume API
- **Roasting**: `POST /resume/roast`
- **Scoring**: `POST /resume/score`

### Simplify API
- **Job Fetching**: Paginated job listing retrieval
- **Rate Limiting**: Automatic backoff and retry logic

## 🚦 Deployment

### Development
```bash
python src/main.py
```

### Production
1. Set up environment variables
2. Deploy to your preferred hosting platform
3. Run `/sync` to register slash commands
4. Test each feature in staging before production use

## 📈 Monitoring

- **Structured Logging**: Correlation IDs for external API calls
- **Error Handling**: Graceful degradation with user feedback
- **Rate Limiting**: Per-user cooldowns on heavy operations

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## 📋 Roadmap

See [ROADMAP.md](ROADMAP.md) for planned features and development milestones.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Contact the development team
- Check the documentation in the `design_doc.md` file

---

<p align="center">
  Made with ❤️ by the CS Club Community
</p>
