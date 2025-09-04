# Contributing to Segfault

Thank you for your interest in contributing to the Segfault! This document provides guidelines and information for contributors to help maintain code quality and project consistency.

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful, constructive, and collaborative in all interactions.

### Our Standards
- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

### Prerequisites
- Python 3.9 or higher
- Git knowledge
- Discord development experience (helpful but not required)
- Familiarity with async/await patterns

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/segfault.git
   cd segfault
   ```

2. **Set up Virtual Environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # Development dependencies
   ```

4. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your test bot configuration
   ```

5. **Run Tests**
   ```bash
   python -m pytest
   ```

## 📋 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- **🐛 Bug Fixes**: Fix issues and improve stability
- **✨ New Features**: Implement features from the roadmap
- **📚 Documentation**: Improve docs, add examples, fix typos
- **🧪 Testing**: Add tests, improve test coverage
- **🎨 UI/UX**: Improve Discord embed formatting and user experience
- **⚡ Performance**: Optimize code and reduce resource usage
- **🔧 Tooling**: Improve development tools and processes

### Contribution Process

1. **Check Existing Issues**
   - Look for existing issues or feature requests
   - Comment on issues you'd like to work on
   - Ask questions if requirements are unclear

2. **Create an Issue** (for new features/bugs)
   - Use appropriate issue templates
   - Provide detailed descriptions and examples
   - Include steps to reproduce for bugs

3. **Development Workflow**
   ```bash
   # Create a feature branch
   git checkout -b feature/your-feature-name
   
   # Make your changes
   # ... code, test, commit ...
   
   # Push to your fork
   git push origin feature/your-feature-name
   ```

4. **Submit a Pull Request**
   - Use the PR template
   - Link related issues
   - Provide clear description of changes
   - Include screenshots for UI changes

## 🏗️ Development Guidelines

### Code Style

We follow PEP 8 with some project-specific conventions:

```python
# Use type hints
async def fetch_jobs(query: str, limit: int = 25) -> List[Job]:
    pass

# Use descriptive variable names
announcement_channel_id = int(os.getenv("ANNOUNCEMENTS_CHANNEL_ID"))

# Use docstrings for public functions
async def publish_announcement(message_id: int) -> PublishResult:
    """
    Publish a Discord message to the website.
    
    Args:
        message_id: The Discord message ID to publish
        
    Returns:
        PublishResult containing success status and details
        
    Raises:
        ChannelNotFoundError: If the message channel is invalid
        PermissionError: If user lacks publish permissions
    """
```

### Project Structure

```
segfault/
├── src/                    # Main application code
│   ├── main.py            # Bot entry point
│   ├── config.py          # Configuration management
│   └── logging_config.py  # Logging setup
├── announcements/         # Announcements feature
│   ├── __init__.py
│   └── cog.py            # Discord cog implementation
├── jobs/                  # Jobs feature
│   ├── __init__.py
│   ├── cog.py            # Discord cog implementation
│   └── simplify.py       # Simplify API integration
├── resume_review/         # Resume review feature
│   ├── __init__.py
│   └── cog.py            # Discord cog implementation
├── common/                # Shared utilities
│   ├── __init__.py
│   ├── checks.py         # Permission and channel checks
│   └── embeds.py         # Discord embed utilities
└── tests/                 # Test files
    ├── test_announcements.py
    ├── test_jobs.py
    └── test_resume_review.py
```

### Coding Standards

#### Discord.py Best Practices
```python
# Use application commands (slash commands)
@app_commands.command(name="publish", description="Publish announcement to website")
async def publish(self, interaction: discord.Interaction, message_id: str = None):
    pass

# Always defer for operations > 3 seconds
await interaction.response.defer(ephemeral=True)

# Use ephemeral responses for feedback
await interaction.followup.send("✅ Published successfully!", ephemeral=True)

# Handle errors gracefully
try:
    result = await self.api_call()
except APIError as e:
    await interaction.followup.send(f"❌ Error: {e.message}", ephemeral=True)
```

#### Async/Await Patterns
```python
# Use async context managers
async with httpx.AsyncClient() as client:
    response = await client.post(url, json=data)

# Batch async operations when possible
tasks = [fetch_job(job_id) for job_id in job_ids]
results = await asyncio.gather(*tasks, return_exceptions=True)
```

#### Error Handling
```python
# Create custom exceptions
class SegFaultError(Exception):
    """Base exception for SegFault bot errors."""
    pass

class PublishError(SegFaultError):
    """Error occurred during announcement publishing."""
    pass

# Log errors with context
logger.error(
    "Failed to publish announcement",
    extra={
        "message_id": message_id,
        "user_id": interaction.user.id,
        "error": str(e)
    }
)
```

### Testing Guidelines

#### Test Structure
```python
import pytest
from unittest.mock import AsyncMock, patch
from announcements.cog import AnnouncementsCog

class TestAnnouncementsCog:
    @pytest.fixture
    async def cog(self):
        bot = AsyncMock()
        return AnnouncementsCog(bot)
    
    @pytest.mark.asyncio
    async def test_publish_success(self, cog):
        # Test implementation
        pass
    
    @pytest.mark.asyncio
    async def test_publish_permission_denied(self, cog):
        # Test implementation
        pass
```

#### Test Coverage Requirements
- **Unit Tests**: All public methods must have tests
- **Integration Tests**: API interactions should be mocked
- **Error Cases**: Test error handling and edge cases
- **Minimum Coverage**: 80% code coverage required

### Documentation Standards

#### Code Documentation
```python
class JobsCog(commands.Cog):
    """
    Discord cog for managing job opportunity postings.
    
    This cog integrates with the Simplify API to fetch job postings
    and automatically posts them to designated Discord channels.
    """
    
    async def fetch_jobs(self, query: str = None) -> List[Job]:
        """
        Fetch job postings from Simplify API.
        
        Args:
            query: Optional search query to filter jobs
            
        Returns:
            List of Job objects matching the criteria
            
        Raises:
            SimplifyAPIError: If the API request fails
            RateLimitError: If rate limit is exceeded
        """
```

#### Commit Messages
Follow conventional commit format:
```
type(scope): description

feat(jobs): add remote-only job filtering
fix(announcements): handle missing message permissions
docs(readme): update installation instructions
test(resume): add unit tests for file validation
```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
python -m pytest

# Run with coverage
python -m pytest --cov=src --cov-report=html

# Run specific test file
python -m pytest tests/test_announcements.py

# Run tests with verbose output
python -m pytest -v
```

### Test Categories

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test component interactions
3. **API Tests**: Test external API integrations (mocked)
4. **Discord Tests**: Test Discord interaction handling

### Writing Good Tests
```python
# Test naming convention
def test_publish_announcement_success():
    """Test successful announcement publishing."""
    pass

def test_publish_announcement_invalid_permissions():
    """Test publishing fails with insufficient permissions."""
    pass

# Use descriptive assertions
assert result.success is True
assert result.published_url == expected_url
assert len(result.errors) == 0

# Mock external dependencies
@patch('announcements.cog.httpx.AsyncClient')
async def test_api_integration(mock_client):
    mock_client.return_value.__aenter__.return_value.post.return_value.status_code = 201
    # Test implementation
```

## 📝 Pull Request Guidelines

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional format
- [ ] No merge conflicts
- [ ] PR description is clear and complete

### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Related Issues
Closes #123
Related to #456

## Screenshots (if applicable)
Add screenshots for UI changes.
```

### Review Process
1. **Automated Checks**: CI/CD pipeline runs tests and linting
2. **Code Review**: Maintainers review code quality and design
3. **Testing**: Manual testing of new features
4. **Approval**: At least one maintainer approval required
5. **Merge**: Squash and merge to main branch

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Describe the Bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Run command '...'
2. With parameters '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g., Ubuntu 20.04]
- Python Version: [e.g., 3.9.7]
- Bot Version: [e.g., 0.1.0]

**Additional Context**
Any other context about the problem.
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🏷️ Issue Labels

We use labels to categorize issues:

- **Type**: `bug`, `enhancement`, `documentation`, `question`
- **Priority**: `high`, `medium`, `low`
- **Difficulty**: `good-first-issue`, `help-wanted`, `advanced`
- **Component**: `announcements`, `jobs`, `resume-review`, `core`
- **Status**: `in-progress`, `blocked`, `needs-review`

## 🎯 Good First Issues

New contributors should look for issues labeled `good-first-issue`. These are:
- Well-defined and scoped
- Don't require deep system knowledge
- Have clear acceptance criteria
- Include helpful context and guidance

## 📞 Getting Help

If you need help:

1. **Check Documentation**: README, design doc, and code comments
2. **Search Issues**: Look for similar questions or problems
3. **Ask Questions**: Create an issue with the `question` label
4. **Join Discussions**: Participate in GitHub Discussions
5. **Contact Maintainers**: Reach out via Discord or email

## 🙏 Recognition

Contributors are recognized in:
- **README**: Contributors section
- **Release Notes**: Feature attribution
- **Discord**: Contributor role and recognition
- **GitHub**: Contributor graphs and statistics

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to Segfault! 🚀**

Your contributions help make this project better for everyone in the community.

---

<p align="center">
  Made with ❤️ by the CS Club Community
</p>