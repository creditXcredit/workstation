# Quick Start Guide - 5 Minute Setup

Get stackBrowserAgent running with GitHub-native deployment.

## Option 1: GitHub Actions Deployment (Recommended)

### Automatic Build & Publish

GitHub Actions automatically builds and publishes on every push:

1. **Backend Docker Image**
   - Built and published to GitHub Container Registry (GHCR)
   - Available at: `ghcr.io/stackconsult/stackbrowseragent/backend:latest`

2. **Chrome Extension**
   - Built and packaged automatically
   - Published to GitHub Releases
   - Download from: [Releases](https://github.com/stackconsult/stackBrowserAgent/releases/latest)

**Time**: Automatic (3-5 minutes after push)

---

## Option 2: Deploy Backend

### Step 1: Run Backend Docker Container (2 minutes)

```bash
# Pull from GitHub Container Registry
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Run with environment variables
docker run -d -p 8000:8000 \
  -e JWT_SECRET_KEY=$(openssl rand -hex 32) \
  -e DATABASE_URL=sqlite:///./data/app.db \
  --name browser-agent-backend \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Or with PostgreSQL using Docker Compose
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  backend:
    image: ghcr.io/stackconsult/stackbrowseragent/backend:latest
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DATABASE_URL=postgresql://postgres:password@db:5432/browseragent
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=browseragent
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
EOF

# Generate JWT secret
export JWT_SECRET_KEY=$(openssl rand -hex 32)

# Start services
docker-compose up -d
```

### Step 2: Install Extension (2 minutes)

```bash
# Download from GitHub Releases
# Visit: https://github.com/stackconsult/stackBrowserAgent/releases/latest
# Download: stackbrowseragent-extension.zip

# Extract and load in Chrome
unzip stackbrowseragent-extension.zip
# 1. Open chrome://extensions
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select extracted folder
```

### Step 3: Configure Backend URL (1 minute)

If using local backend, no configuration needed (defaults to localhost:8000).

For remote backend, edit `src/config/backend.ts`:
```typescript
export const BACKEND_URL = 'http://your-server:8000';
```

### Step 4: Test (1 minute)

```bash
# Test backend
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","username":"test"}'
```

**Time**: ~5 minutes

---

## Option 3: Local Development

### Quick Local Setup

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload

# Extension (in new terminal)
npm install
npm run dev
```

Load extension from `dist/` folder in Chrome.

**Time**: ~3 minutes

---

## Verification Checklist

- [ ] Backend health check passes: `curl [URL]/health`
- [ ] Database connected (in health check response)
- [ ] Extension loaded in Chrome
- [ ] Extension shows "Backend Connected" status
- [ ] User registration works
- [ ] Login works
- [ ] Task creation works

---

## What You Get

### Backend (Docker Container)
- ✅ FastAPI server with 20 concurrent workers
- ✅ PostgreSQL/SQLite database
- ✅ JWT authentication
- ✅ RAG with vector database
- ✅ Workflow engine
- ✅ Auto-build via GitHub Actions

### Chrome Extension
- ✅ 6 specialized AI agents
- ✅ Browser automation
- ✅ Workflow execution
- ✅ Multi-LLM support
- ✅ Backend integration

### Infrastructure
- ✅ Docker containerization
- ✅ CI/CD with GitHub Actions
- ✅ Automated testing
- ✅ Health monitoring
- ✅ Production-ready

---

## Costs

**Free Deployment Options:**
- GitHub Container Registry: Free (public repositories)
- Extension: Free to use
- Docker hosting on VPS: From $5/month (DigitalOcean, Linode)
- **Total**: $5-10/month for small-medium usage

**Production Scale:**
- Managed Kubernetes (GKE/EKS/AKS): From $70/month
- Container Platform (Render/Fly.io): From $7-20/month
- Database (Managed PostgreSQL): From $15/month
- **Total**: ~$30-100/month for production

---

## Troubleshooting

### Backend won't start
```bash
docker logs browser-agent-backend  # Check error logs
docker restart browser-agent-backend  # Restart service
```

### Extension can't connect
1. Check backend URL is correct
2. Verify backend is running: `curl [URL]/health`
3. Check browser console for errors

### Database issues
```bash
# Check database connection
curl http://localhost:8000/health | jq .database

# Restart with fresh database
docker-compose down -v
docker-compose up -d
```

---

## Next Steps

After successful deployment:

1. **Invite Beta Users**
   - Share extension package from GitHub Releases
   - Provide backend URL (your server IP/domain)
   - Collect feedback

2. **Monitor Usage**
   - Check Docker logs: `docker logs browser-agent-backend`
   - View metrics at backend:/metrics endpoint
   - Set up monitoring (Prometheus/Grafana)

3. **Iterate**
   - Fix reported issues
   - Add requested features
   - Auto-builds on git push via GitHub Actions

---

## Support

- **Deployment Issues**: See [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md)
- **Extension Issues**: See [INSTALLATION.md](INSTALLATION.md)
- **API Documentation**: Visit `http://localhost:8000/docs` or your backend URL + `/docs`
- **GitHub Issues**: https://github.com/stackconsult/stackBrowserAgent/issues

---

**Status**: ✅ Production-Ready
**Deployment Time**: 10 minutes
**Cost**: Free tier available
**Support**: Comprehensive documentation included
