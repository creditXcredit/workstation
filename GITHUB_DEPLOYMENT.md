# GitHub-Native Deployment Guide

## 🚀 Complete Automated Deployment Using GitHub Ecosystem

This guide provides **seamless, production-ready deployment** using only GitHub's native tools and services. No external platforms required.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Automated Deployment Flow](#automated-deployment-flow)
4. [Backend Deployment (Docker + GHCR)](#backend-deployment)
5. [Extension Deployment (GitHub Releases)](#extension-deployment)
6. [Documentation Hosting (GitHub Pages)](#documentation-hosting)
7. [Running the Deployed System](#running-the-deployed-system)
8. [CI/CD Pipeline Details](#cicd-pipeline-details)
9. [Environment Configuration](#environment-configuration)
10. [Monitoring and Logs](#monitoring-and-logs)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What Gets Deployed

✅ **Backend API** → Docker image in GitHub Container Registry (GHCR)  
✅ **Chrome Extension** → Packaged ZIP in GitHub Releases  
✅ **Documentation** → Static site on GitHub Pages

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    GitHub Repository                     │
│                stackconsult/stackBrowserAgent            │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ Push to main/copilot/** branches
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌───────────────┐   ┌──────────────────┐
│ GitHub Actions│   │  GitHub Actions  │
│  Backend CI   │   │  Extension CI    │
└───────┬───────┘   └────────┬─────────┘
        │                    │
        │ Build & Test       │ Build & Package
        │                    │
        ▼                    ▼
┌───────────────┐   ┌──────────────────┐
│     GHCR      │   │ GitHub Releases  │
│ Docker Image  │   │  Extension ZIP   │
└───────────────┘   └──────────────────┘
        │                    │
        │                    │
        └─────────┬──────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Your Platform  │
        │  (Cloud/Local)  │
        └─────────────────┘
```

---

## Prerequisites

### Required Permissions

1. **GitHub Repository Access**
   - Write access to the repository
   - Actions enabled for the repository

2. **GitHub Packages (GHCR)**
   - Automatically enabled with GitHub Actions
   - No additional configuration needed

3. **GitHub Pages (Optional)**
   - Enable in repository settings for documentation

### Local Development Tools (Optional)

```bash
# Only needed for local development, not deployment
- Docker Desktop
- Node.js 20+
- Python 3.9+
```

---

## Automated Deployment Flow

### 🎯 Zero-Configuration Deployment

Every push to `main` or `copilot/**` branches automatically triggers:

1. **Code Quality Checks** (linting, type checking, tests)
2. **Security Scanning** (Trivy, npm audit)
3. **Docker Image Build** (multi-platform)
4. **Image Push to GHCR** (versioned + latest)
5. **Extension Packaging** (ZIP creation)
6. **GitHub Release Creation** (with downloadable assets)

**No manual steps required** ✨

---

## Backend Deployment

### Step 1: Automatic Build & Publish

The backend is automatically built and published as a Docker image to GitHub Container Registry on every commit.

#### What Happens Automatically

```yaml
Workflow: .github/workflows/deploy-backend.yml

Triggers:
  - Push to main or copilot/** branches
  - Changes to backend/ directory
  - Manual dispatch

Actions:
  1. Checkout code
  2. Login to GHCR (GitHub Container Registry)
  3. Build Docker image (multi-platform: amd64, arm64)
  4. Push image with tags:
     - latest
     - branch name
     - commit SHA
     - semantic version
```

#### Image Location

```
ghcr.io/stackconsult/stackbrowseragent/backend:latest
```

### Step 2: Pull & Run the Image

Once the automated workflow completes, anyone can deploy the backend:

#### Option A: Docker Run (Simple)

```bash
# Pull the latest image
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Run with SQLite (development)
docker run -d \
  --name stackbrowseragent-backend \
  -p 8000:8000 \
  -e DATABASE_URL="sqlite:///app.db" \
  -e JWT_SECRET_KEY="your-secret-key-here" \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Run with PostgreSQL (production)
docker run -d \
  --name stackbrowseragent-backend \
  -p 8000:8000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e JWT_SECRET_KEY="your-secret-key-here" \
  -e PINECONE_API_KEY="your-pinecone-key" \
  -e OPENAI_API_KEY="your-openai-key" \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest
```

#### Option B: Docker Compose (Recommended)

```bash
# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: ghcr.io/stackconsult/stackbrowseragent/backend:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/stackbrowser
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - PINECONE_API_KEY=${PINECONE_API_KEY:-}
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=stackbrowser
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f backend
```

#### Option C: Deploy to Cloud Platforms

**Any Docker-compatible platform:**

- **Google Cloud Run:** `gcloud run deploy --image ghcr.io/stackconsult/stackbrowseragent/backend:latest`
- **AWS ECS:** Use the GHCR image URL in your task definition
- **Azure Container Instances:** Deploy from GHCR
- **DigitalOcean App Platform:** Connect to GHCR
- **Fly.io:** Use `flyctl deploy` with the image
- **Render:** Deploy from GHCR URL

### Step 3: Verify Deployment

```bash
# Health check
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","version":"1.0.0"}

# API documentation
open http://localhost:8000/docs
```

---

## Extension Deployment

### Step 1: Automatic Build & Release

The Chrome extension is automatically built and published to GitHub Releases.

#### What Happens Automatically

```yaml
Workflow: .github/workflows/deploy-extension.yml

Triggers:
  - Push to main or copilot/** branches
  - Changes to src/ or public/ directories
  - Manual dispatch

Actions:
  1. Checkout code
  2. Install dependencies
  3. Build extension (npm run build)
  4. Package as ZIP
  5. Create GitHub Release
  6. Upload ZIP as release asset
  7. Store artifacts for 30 days
```

### Step 2: Download & Install

#### Download the Extension

1. Go to [Releases](https://github.com/stackconsult/stackBrowserAgent/releases)
2. Download `stackbrowseragent-extension.zip` from the latest release

#### Install in Chrome

```bash
# Method 1: Extract and Load
1. Extract the ZIP file
2. Open Chrome: chrome://extensions/
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the extracted folder

# Method 2: Automated Script (Mac/Linux)
curl -L https://github.com/stackconsult/stackBrowserAgent/releases/latest/download/stackbrowseragent-extension.zip -o extension.zip
unzip extension.zip -d stackbrowseragent-extension
# Then load unpacked in Chrome
```

#### Verify Installation

1. Look for the extension icon in Chrome toolbar
2. Click the icon to open the sidepanel
3. Extension should show "Backend: Disconnected" initially
4. Configure backend URL in settings

---

## Documentation Hosting

### Automatic GitHub Pages Deployment

Documentation is automatically deployed to GitHub Pages.

#### Setup (One-Time)

1. Go to repository Settings → Pages
2. Source: Deploy from a branch
3. Branch: Select `gh-pages` or use GitHub Actions
4. Click Save

The workflow `.github/workflows/deploy-docs.yml` handles the rest automatically.

#### Access Documentation

```
https://stackconsult.github.io/stackBrowserAgent/
```

---

## Running the Deployed System

### Complete Setup (5 Minutes)

#### 1. Start Backend

```bash
# Quick start with Docker
docker run -d -p 8000:8000 \
  -e DATABASE_URL="sqlite:///app.db" \
  -e JWT_SECRET_KEY=$(openssl rand -hex 32) \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Verify
curl http://localhost:8000/health
```

#### 2. Install Extension

```bash
# Download latest release
curl -L $(curl -s https://api.github.com/repos/stackconsult/stackBrowserAgent/releases/latest | grep browser_download_url | grep extension.zip | cut -d '"' -f 4) -o extension.zip

# Extract
unzip extension.zip -d extension

# Load in Chrome (chrome://extensions/)
```

#### 3. Configure Connection

1. Open extension (click icon)
2. Go to Settings
3. Set Backend URL: `http://localhost:8000`
4. Click "Test Connection"
5. Should show "Connected ✓"

#### 4. Create Account

```bash
# Register via API
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "secure-password",
    "username": "myusername"
  }'

# Login in extension with these credentials
```

### System Architecture in Production

```
┌──────────────┐
│   Browser    │
│  (Extension) │
└──────┬───────┘
       │ HTTP/WebSocket
       ▼
┌──────────────┐
│   Backend    │
│  (FastAPI)   │
├──────────────┤
│  Container   │
│   from GHCR  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  / SQLite    │
└──────────────┘
```

---

## CI/CD Pipeline Details

### Automated Workflows

#### 1. Backend CI (`backend-ci.yml`)

**Runs on:** Every push/PR affecting backend

**Jobs:**
- **Test:** Python 3.9, 3.10, 3.11 matrix
- **Docker:** Build and test image
- **Security:** Trivy vulnerability scan

**Duration:** ~5 minutes

#### 2. Extension CI (`extension-ci.yml`)

**Runs on:** Every push/PR affecting extension

**Jobs:**
- **Build:** Compile TypeScript, bundle React
- **Test:** Run test suite
- **Security:** npm audit

**Duration:** ~3 minutes

#### 3. Backend Deployment (`deploy-backend.yml`)

**Runs on:** Push to main/copilot branches

**Jobs:**
- **Build-and-push:** Create and publish Docker image to GHCR
- **Deploy-status:** Report success

**Duration:** ~8 minutes

**Outputs:**
- Docker image at `ghcr.io/stackconsult/stackbrowseragent/backend:latest`
- Tagged images (branch, SHA, version)

#### 4. Extension Deployment (`deploy-extension.yml`)

**Runs on:** Push to main/copilot branches

**Jobs:**
- **Build-and-release:** Package and publish to GitHub Releases

**Duration:** ~4 minutes

**Outputs:**
- GitHub Release with version tag
- Downloadable extension ZIP
- Build artifacts stored for 30 days

### Workflow Triggers

```yaml
# Automatic triggers
on:
  push:
    branches: [main, 'copilot/**']
  pull_request:
    branches: [main]
  
# Manual trigger
  workflow_dispatch:
```

### Status Badges

Add to your README:

```markdown
![Backend CI](https://github.com/stackconsult/stackBrowserAgent/workflows/Backend%20CI/badge.svg)
![Extension CI](https://github.com/stackconsult/stackBrowserAgent/workflows/Extension%20CI/badge.svg)
![Deploy Backend](https://github.com/stackconsult/stackBrowserAgent/workflows/Deploy%20Backend%20to%20GitHub%20Container%20Registry/badge.svg)
```

---

## Environment Configuration

### Required Environment Variables

#### Backend (Minimum)

```bash
JWT_SECRET_KEY=your-secret-key-here  # Required: Generate with openssl rand -hex 32
DATABASE_URL=postgresql://user:pass@host:5432/db  # Required: Database connection
```

#### Backend (Optional - Enhanced Features)

```bash
# LLM Providers
OPENAI_API_KEY=sk-...           # OpenAI GPT models
ANTHROPIC_API_KEY=sk-...        # Claude models
GROQ_API_KEY=gsk_...            # Groq models

# Vector Databases
PINECONE_API_KEY=...            # Pinecone for RAG
PINECONE_ENVIRONMENT=...        # us-west1-gcp, etc.
CHROMADB_HOST=localhost         # ChromaDB (alternative)
CHROMADB_PORT=8001

# Monitoring
PROMETHEUS_ENABLED=true         # Metrics export
LOG_LEVEL=info                  # debug, info, warning, error
```

### Configuration Methods

#### Option 1: Docker Environment

```bash
docker run -d \
  -e JWT_SECRET_KEY="..." \
  -e DATABASE_URL="..." \
  -e OPENAI_API_KEY="..." \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest
```

#### Option 2: Docker Compose

```yaml
services:
  backend:
    image: ghcr.io/stackconsult/stackbrowseragent/backend:latest
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
    env_file:
      - .env  # Load from file
```

#### Option 3: Cloud Platform Secrets

Most platforms support secure secret injection:

```bash
# Google Cloud Run
gcloud run deploy --set-env-vars JWT_SECRET_KEY=...

# AWS ECS
# Define in task definition as secrets

# Azure
# Store in Key Vault and reference
```

---

## Monitoring and Logs

### Accessing Logs

#### Docker Logs

```bash
# View logs
docker logs stackbrowseragent-backend

# Follow logs
docker logs -f stackbrowseragent-backend

# Last 100 lines
docker logs --tail 100 stackbrowseragent-backend
```

#### Docker Compose

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Metrics Endpoint

```bash
# Prometheus-compatible metrics
curl http://localhost:8000/metrics

# Example metrics:
# - http_requests_total
# - http_request_duration_seconds
# - active_agents_count
# - workflow_executions_total
```

### Health Monitoring

```bash
# Basic health check
curl http://localhost:8000/health

# Detailed status (requires auth)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/status
```

### GitHub Actions Monitoring

1. Go to **Actions** tab in repository
2. View workflow runs
3. Check job logs for any failures
4. Monitor deployment status in real-time

---

## Troubleshooting

### Common Issues

#### 1. Docker Image Pull Failed

**Error:** `Error response from daemon: unauthorized`

**Solution:**
```bash
# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull image
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest
```

#### 2. Backend Won't Start

**Error:** `Database connection failed`

**Solution:**
```bash
# Check DATABASE_URL format
# PostgreSQL: postgresql://user:pass@host:5432/dbname
# SQLite: sqlite:///app.db

# Verify database is accessible
docker run --rm postgres:15 psql $DATABASE_URL -c "SELECT 1"
```

#### 3. Extension Not Connecting

**Error:** `Backend: Disconnected`

**Solution:**
```bash
# Check backend is running
curl http://localhost:8000/health

# Check CORS settings
# Backend allows all origins in development
# Configure allowed origins for production

# Check extension settings
# Open extension → Settings → Backend URL
# Ensure URL is correct (include http/https)
```

#### 4. Build Failed in GitHub Actions

**Error:** Various CI failures

**Solution:**
```bash
# Check workflow logs in Actions tab
# Common fixes:
# - Ensure all tests pass locally
# - Check Python/Node versions match
# - Verify all dependencies in requirements.txt / package.json
```

### Getting Help

1. **Check Logs:** Always start with `docker logs` or Actions logs
2. **Verify Configuration:** Double-check environment variables
3. **Test Locally:** Run `docker run` locally before deploying
4. **Review Documentation:** Check API docs at `/docs`
5. **GitHub Issues:** Open an issue with logs and configuration

---

## Advanced Deployment Scenarios

### Multi-Environment Setup

```yaml
# Production
ghcr.io/stackconsult/stackbrowseragent/backend:v1.0.0

# Staging
ghcr.io/stackconsult/stackbrowseragent/backend:develop

# Feature branches
ghcr.io/stackconsult/stackbrowseragent/backend:feature-xyz
```

### Custom Domain Setup

```bash
# With reverse proxy (nginx)
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL/TLS Configuration

```bash
# Using Caddy (automatic HTTPS)
cat > Caddyfile << 'EOF'
api.yourdomain.com {
    reverse_proxy localhost:8000
}
EOF

caddy run
```

### Scaling Horizontally

```yaml
# docker-compose.yml with load balancing
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend1
      - backend2

  backend1:
    image: ghcr.io/stackconsult/stackbrowseragent/backend:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}

  backend2:
    image: ghcr.io/stackconsult/stackbrowseragent/backend:latest
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=stackbrowser
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Security Best Practices

### 1. Secret Management

```bash
# ❌ Never hardcode secrets
JWT_SECRET_KEY="my-secret-123"

# ✅ Use environment variables
JWT_SECRET_KEY=${JWT_SECRET_KEY}

# ✅ Use cloud secret managers
# AWS Secrets Manager
# Google Secret Manager  
# Azure Key Vault
```

### 2. Database Security

```bash
# ✅ Use strong passwords
# ✅ Enable SSL connections
# ✅ Restrict network access
# ✅ Regular backups
# ✅ Least privilege access
```

### 3. API Security

```bash
# ✅ HTTPS only in production
# ✅ Rate limiting enabled
# ✅ JWT token expiration
# ✅ CORS configured correctly
# ✅ Input validation
```

### 4. Container Security

```bash
# Pull image signatures
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest@sha256:...

# Scan for vulnerabilities
trivy image ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Run as non-root
USER nonroot  # Already configured in Dockerfile
```

---

## Cost Estimation

### GitHub Resources (Free)

- **Actions Minutes:** 2,000 minutes/month (free tier)
- **Package Storage:** 500 MB (free tier)
- **Release Storage:** Unlimited
- **Pages Bandwidth:** 100 GB/month (free tier)

### Infrastructure Costs

**Option 1: Self-Hosted (VPS)**
- $5-10/month for small VPS
- Full control
- Manual maintenance

**Option 2: Container Platform**
- Google Cloud Run: $0 - $20/month (pay per use)
- AWS Fargate: $10 - $50/month
- Azure Container Instances: $10 - $40/month
- DigitalOcean: $12 - $48/month

**Database:**
- Self-hosted PostgreSQL: Included in VPS
- Managed PostgreSQL: $15 - $50/month

**Total Estimated Cost:** $5 - $100/month depending on usage

---

## Summary

### ✅ What You Get

- **Automated CI/CD:** Every push triggers build and deployment
- **Docker Images:** Multi-platform, versioned, cached
- **GitHub Releases:** Downloadable extension packages
- **GitHub Pages:** Hosted documentation
- **Zero Configuration:** Works out of the box
- **Enterprise Ready:** Security scanning, monitoring, logging

### 🎯 Next Steps

1. **Verify Workflows:** Check Actions tab to ensure workflows run
2. **Deploy Backend:** Pull Docker image and run with your configuration
3. **Install Extension:** Download from Releases and load in Chrome
4. **Configure & Test:** Connect extension to backend
5. **Monitor:** Watch logs and metrics

### 📚 Additional Resources

- [Backend API Documentation](http://localhost:8000/docs)
- [INSTALLATION.md](./INSTALLATION.md) - Local development setup
- [USAGE.md](./USAGE.md) - Feature guides
- [EXAMPLES.md](./EXAMPLES.md) - Code examples
- [AUTHENTICATION.md](./backend/AUTHENTICATION.md) - Auth guide
- [MONITORING.md](./backend/MONITORING.md) - Observability

---

## Support

**Issues:** https://github.com/stackconsult/stackBrowserAgent/issues  
**Discussions:** https://github.com/stackconsult/stackBrowserAgent/discussions

---

**Last Updated:** November 2024  
**Version:** 1.0.0  
**License:** MIT
