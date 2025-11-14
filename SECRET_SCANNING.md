# Secret Scanning Guide

## Overview

This repository uses automated secret scanning to prevent accidental exposure of sensitive credentials, API keys, tokens, and other secrets. Our secret scanning solution uses **Gitleaks**, a free and open-source tool that integrates seamlessly with GitHub.

## Why Secret Scanning?

Exposed secrets in code repositories are a major security risk:
- **API Keys** can be used to access paid services, resulting in unexpected bills
- **Database Credentials** can lead to data breaches
- **Private Keys** can compromise entire systems
- **OAuth Tokens** can provide unauthorized access to user accounts

**Statistics:**
- Over 6 million secrets are exposed on GitHub annually
- Automated bots scan for secrets within minutes of exposure
- 80% of breaches involve compromised credentials

## Our Secret Scanning Solution

### Technology: Gitleaks

We use [Gitleaks](https://github.com/gitleaks/gitleaks) for automated secret detection.

**Why Gitleaks?**
- ✅ **Free**: MIT License, no cost for any usage
- ✅ **High Quality**: 16,000+ GitHub stars, actively maintained
- ✅ **Fast**: Scans entire repository in seconds
- ✅ **Accurate**: Low false positive rate with 140+ secret patterns
- ✅ **Integrated**: Reports directly to GitHub Security tab
- ✅ **Comprehensive**: Scans commits, diffs, and entire repository history

**License**: MIT (permissive, free for commercial use)

### How It Works

1. **Automatic Scanning**: Runs on every push and pull request
2. **Pattern Matching**: Detects 140+ types of secrets including:
   - AWS Keys (Access Key ID, Secret Access Key)
   - GitHub Tokens (Personal Access Tokens, OAuth tokens)
   - Database URLs (MySQL, PostgreSQL, MongoDB)
   - API Keys (Stripe, Twilio, SendGrid, etc.)
   - Private SSH Keys
   - JWT Secrets
   - Generic secrets (high entropy strings)

3. **SARIF Reporting**: Findings appear in GitHub Security tab
4. **PR Blocking**: Pull requests with secrets are automatically failed
5. **Daily Scans**: Scheduled scans ensure no secrets slip through

### Workflow Integration

The secret scanning workflow (`.github/workflows/secret-scan.yml`) runs:

- **On Push**: Every commit to `main` or `develop` branches
- **On Pull Request**: Before code can be merged
- **On Schedule**: Daily at 2 AM UTC
- **Manual**: Via workflow dispatch for on-demand scans

## What Gets Scanned

### Included Files
- All source code files (`.js`, `.ts`, `.py`, etc.)
- Configuration files (`.json`, `.yml`, `.yaml`, `.env.example`)
- Documentation (`.md`)
- Scripts (`.sh`, `.bash`)
- Infrastructure code (Dockerfiles, terraform files)

### Excluded Files
- `node_modules/` directory
- `dist/` and build directories
- `.git/` directory
- Binary files
- Lock files (`package-lock.json`, `yarn.lock`)

## Detected Secret Types

Gitleaks detects 140+ secret patterns. Common examples:

| Secret Type | Example Pattern | Risk Level |
|-------------|----------------|------------|
| AWS Access Key | `AKIA[0-9A-Z]{16}` | Critical |
| GitHub Token | `ghp_[a-zA-Z0-9]{36}` | High |
| Private SSH Key | `-----BEGIN RSA PRIVATE KEY-----` | Critical |
| Generic API Key | `api[_-]?key[_-]?=.{20,}` | High |
| Database URL | `postgres://user:pass@host:5432/db` | Critical |
| JWT Secret | High entropy strings in JWT configs | High |
| Slack Token | `xox[baprs]-[0-9]{10,13}-[a-zA-Z0-9-]{24,}` | Medium |

## When Secrets Are Detected

### In Pull Requests

1. **Workflow Fails**: The secret scan job will fail
2. **PR Comment**: Automated comment explains the issue
3. **Security Tab**: Findings appear in repository Security tab
4. **Merge Blocked**: PR cannot be merged until secrets are removed

**Example PR Comment:**
```
🔒 Secret Scanning Alert

Gitleaks has detected potential secrets in this pull request.

Action Required:
1. Review the detected secrets in the workflow logs
2. Remove any exposed credentials from the code
3. Rotate any compromised credentials immediately
4. Update your code to use environment variables
```

### In Committed Code

1. **Alert Created**: GitHub Security alert is created
2. **Team Notified**: Repository maintainers receive notification
3. **Action Required**: Follow remediation steps below

## How to Fix Detected Secrets

### Step 1: Identify the Secret

1. Go to the workflow run that detected the secret
2. Review the Gitleaks output to see:
   - File containing the secret
   - Line number
   - Secret type
   - Partial secret value (redacted)

### Step 2: Remove from Current Code

```bash
# Edit the file and remove the secret
vim path/to/file.js

# Use environment variables instead
const apiKey = process.env.API_KEY;

# Commit the fix
git add path/to/file.js
git commit -m "fix: Remove exposed API key, use environment variable"
```

### Step 3: Remove from Git History

**Warning**: This rewrites history and requires force push.

```bash
# Option 1: Use BFG Repo-Cleaner (recommended)
# Install: https://rtyley.github.io/bfg-repo-cleaner/
bfg --replace-text secrets.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# Option 2: Use git filter-branch
git filter-branch --tree-filter 'git rm --ignore-unmatch path/to/file.js' HEAD
git push --force

# Option 3: Use interactive rebase for recent commits
git rebase -i HEAD~5  # For last 5 commits
# Mark commits as 'edit', remove secrets, continue
git push --force
```

**Alternative**: If history rewrite is too risky:
1. Rotate the exposed secret immediately
2. Document the rotation in security logs
3. Leave history intact with a new commit removing the secret

### Step 4: Rotate Compromised Credentials

**Critical**: Always assume exposed secrets are compromised.

1. **API Keys**: Generate new key in service dashboard
2. **Database Passwords**: Change password immediately
3. **OAuth Tokens**: Revoke and regenerate
4. **SSH Keys**: Generate new keypair, update authorized_keys
5. **JWT Secrets**: Rotate secret, invalidate existing tokens

### Step 5: Update Configuration

```bash
# Add to .env (not committed)
echo "API_KEY=your-new-key" >> .env

# Update .env.example (committed, without real values)
echo "API_KEY=your-api-key-here" >> .env.example

# Ensure .env is in .gitignore
echo ".env" >> .gitignore
```

### Step 6: Use Secret Management

**For Local Development:**
- Use `.env` files with `dotenv` package
- Keep `.env` in `.gitignore`
- Provide `.env.example` with dummy values

**For Production:**
- **GitHub Secrets**: For GitHub Actions workflows
- **Railway/Heroku**: Use platform environment variables
- **AWS Secrets Manager**: For AWS deployments
- **HashiCorp Vault**: For enterprise secret management
- **Azure Key Vault**: For Azure deployments

## Best Practices

### Prevention (Don't Commit Secrets)

1. **Use Environment Variables**
   ```javascript
   // ❌ Bad
   const apiKey = "sk_live_abc123xyz";
   
   // ✅ Good
   const apiKey = process.env.STRIPE_API_KEY;
   ```

2. **Use .gitignore**
   ```
   # .gitignore
   .env
   .env.local
   .env.*.local
   secrets.yml
   credentials.json
   *.pem
   *.key
   ```

3. **Review Before Committing**
   ```bash
   # Review what you're committing
   git diff --cached
   
   # Use git hooks (see below)
   ```

4. **Use Template Files**
   ```bash
   # Keep example file in repo
   .env.example
   
   # Actual file is ignored
   .env
   ```

### Git Hooks (Pre-commit Protection)

Install pre-commit hook to catch secrets before they're committed:

```bash
# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
# Run Gitleaks on staged files
gitleaks protect --staged --verbose
EOF

chmod +x .git/hooks/pre-commit
```

Or use [pre-commit framework](https://pre-commit.com/):

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks
```

### Code Review Checklist

- [ ] No hardcoded credentials
- [ ] All secrets use environment variables
- [ ] `.env` file is in `.gitignore`
- [ ] `.env.example` provided with dummy values
- [ ] Documentation updated with required environment variables
- [ ] Gitleaks scan passed

## Common False Positives

Gitleaks is accurate but may occasionally flag false positives:

### Example Values
```javascript
// This might trigger false positive
const exampleKey = "AKIAIOSFODNN7EXAMPLE";  // AWS documentation example
```

**Solution**: Add to `.gitleaksignore` file:
```
# .gitleaksignore
# AWS documentation examples
AKIAIOSFODNN7EXAMPLE
```

### Test Credentials
```javascript
// Test data might look like secrets
const testApiKey = "test_sk_12345678901234567890";
```

**Solution**: Use obvious test prefixes:
```javascript
const testApiKey = "test_fake_key_for_testing_only";
```

### High Entropy Strings
```javascript
// Random strings for testing might trigger
const randomHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b";
```

**Solution**: Add comments:
```javascript
// gitleaks:allow - This is a test hash, not a secret
const randomHash = "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b";
```

## Configuration

### Custom Gitleaks Config

Create `.gitleaks.toml` in repository root to customize:

```toml
title = "Gitleaks Config for stackBrowserAgent"

[extend]
# Extend default config
useDefault = true

[[rules]]
description = "Custom JWT Secret Pattern"
id = "jwt-secret-custom"
regex = '''(?i)jwt[_-]?secret\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{32,})['"]?'''
tags = ["jwt", "secret"]

[allowlist]
description = "Allowlist for false positives"
paths = [
  '''\.env\.example$''',  # Example files
  '''^tests/fixtures/''',  # Test fixtures
]
regexes = [
  '''test[_-]?secret[_-]?for[_-]?testing''',  # Test secrets
]
```

### Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Private keys, database credentials | Immediate rotation required |
| **High** | API keys, OAuth tokens | Rotation within 24 hours |
| **Medium** | Generic secrets, high entropy | Review and rotate if needed |
| **Low** | Possible secrets, borderline | Manual review |

## Monitoring and Alerts

### GitHub Security Tab

View all secret scanning alerts:
1. Go to repository **Security** tab
2. Click **Secret scanning**
3. Review open alerts
4. Click alert for details and remediation

### Notifications

Configure notifications:
1. Go to repository **Settings** → **Notifications**
2. Enable **Security alerts**
3. Choose notification method (Email, Web, Mobile)

### Metrics

Track secret scanning effectiveness:
- **Detection Rate**: Secrets caught per month
- **Response Time**: Time to remediate detected secrets
- **False Positive Rate**: Percentage of false alerts
- **Coverage**: Percentage of repository scanned

## Frequently Asked Questions

### Q: Does this scan my entire Git history?
**A:** Yes, Gitleaks scans all commits with `fetch-depth: 0` to detect secrets in historical commits.

### Q: What if I accidentally committed a secret?
**A:** Follow the "How to Fix Detected Secrets" section above. Remove from current code AND from Git history, then rotate the credential.

### Q: Can I allowlist certain files?
**A:** Yes, use `.gitleaksignore` or configure in `.gitleaks.toml` to exclude specific patterns.

### Q: Does this work with private repositories?
**A:** Yes, Gitleaks is free for both public and private repositories.

### Q: How often does the scan run?
**A:** On every push, every pull request, and daily at 2 AM UTC. You can also trigger manually.

### Q: Will this block my deployments?
**A:** It will block pull requests but not direct pushes to protected branches. Configure branch protection rules to enforce.

### Q: Can I use this locally?
**A:** Yes! Install Gitleaks CLI:
```bash
brew install gitleaks  # macOS
# or
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
tar -xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/

# Run scan
gitleaks detect --source . --verbose
```

### Q: What about secrets in dependencies?
**A:** Gitleaks scans your code, not dependencies. Use `npm audit` for dependency vulnerabilities (already in our CI/CD).

### Q: Is my code sent to external services?
**A:** No, Gitleaks runs entirely within GitHub Actions. No code leaves GitHub's infrastructure.

## Additional Resources

### Official Documentation
- [Gitleaks GitHub Repository](https://github.com/gitleaks/gitleaks)
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks#readme)
- [GitHub Secret Scanning Docs](https://docs.github.com/en/code-security/secret-scanning)

### Security Best Practices
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetsproject.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security/getting-started/securing-your-repository)
- [12 Factor App - Config](https://12factor.net/config)

### Tools
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/) - Remove secrets from history
- [git-filter-repo](https://github.com/newren/git-filter-repo) - Advanced history rewriting
- [pre-commit](https://pre-commit.com/) - Git hook framework

## Support

If you have questions about secret scanning:
1. Check this guide first
2. Review the [Security Policy](SECURITY.md)
3. Check [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)
4. Open an issue with the `security` label

## Contributing

Help improve our secret scanning:
- Report false positives as issues
- Suggest new secret patterns
- Contribute to documentation
- Share best practices

---

**Remember**: The best defense is prevention. Never commit secrets in the first place!
