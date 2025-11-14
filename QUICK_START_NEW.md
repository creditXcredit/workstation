# Quick Start Guide

Get the Stack Browser Agent running in minutes using GitHub-native deployment.

## Prerequisites

- Docker and Docker Compose installed
- Chrome browser
- GitHub account (to download releases)

---

## 1. Deploy Backend with Docker

The backend Docker image is automatically built and published to GitHub Container Registry (GHCR) on every commit.

### Pull and Run Backend

```bash
# Pull latest backend image from GitHub Container Registry
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Generate a secure JWT secret
export JWT_SECRET_KEY=$(openssl rand -hex 32)

# Option A: Run with SQLite (simplest, for testing)
docker run -d -p 8000:8000 \
  -e JWT_SECRET_KEY=$JWT_SECRET_KEY \
  -e DATABASE_URL=sqlite:///./data/app.db \
  -v $(pwd)/data:/app/data \
  --name browser-agent-backend \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Option B: Run with Docker Compose + PostgreSQL (production)
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  backend:
    image: ghcr.io/stackconsult/stackbrowseragent/backend:latest
    restart: always
    ports:
      - "8000:8000"
    environment:
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - DATABASE_URL=postgresql://postgres:password@db:5432/browseragent
    depends_on:
      - db
  
  db:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_DB=browseragent
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
EOF

# Set JWT secret and start
export JWT_SECRET_KEY=$(openssl rand -hex 32)
docker-compose up -d
```

### Verify Backend is Running

```bash
# Check health endpoint
curl http://localhost:8000/health
# Should return: {"status":"healthy"}

# View backend logs
docker logs browser-agent-backend
# Or with Docker Compose:
docker-compose logs backend

# Check API documentation
open http://localhost:8000/docs
```

---

## 2. Install Chrome Extension

The Chrome extension is automatically built and packaged on every commit.

### Download from GitHub Releases

1. **Download Extension**
   ```bash
   # Go to releases page
   open https://github.com/stackconsult/stackBrowserAgent/releases/latest
   
   # Or download with curl
   curl -L -o stackbrowseragent-extension.zip \
     $(curl -s https://api.github.com/repos/stackconsult/stackBrowserAgent/releases/latest \
     | grep "browser_download_url.*zip" | cut -d '"' -f 4)
   
   # Extract
   unzip stackbrowseragent-extension.zip -d stackbrowseragent-extension
   ```

2. **Load in Chrome**
   - Open Chrome
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `stackbrowseragent-extension` folder

### Configure Extension

1. **Open Sidepanel**
   - Click extension icon in toolbar
   - Or open sidepanel from Chrome menu

2. **Set Backend URL**
   - Go to Settings
   - Set Backend URL: `http://localhost:8000`
   - Click Save

3. **Register User**
   ```bash
   # Register a user via API
   curl -X POST http://localhost:8000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "secure_password_123",
       "username": "admin"
     }'
   ```

4. **Login in Extension**
   - Enter email: `admin@example.com`
   - Enter password: `secure_password_123`
   - Click Login

---

## 3. Verify Full Stack

### Test Backend API

```bash
# Health check
curl http://localhost:8000/health

# Get authentication token
TOKEN=$(curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"secure_password_123"}' \
  | jq -r '.access_token')

# Test authenticated endpoint
curl http://localhost:8000/api/tasks \
  -H "Authorization: Bearer $TOKEN"
```

### Test Extension Features

1. **Browser Automation**
   - Open any webpage
   - Use extension to extract data
   - Test navigation commands

2. **Workflow Execution**
   - Create a new workflow
   - Test execution
   - View results in sidepanel

3. **Backend Integration**
   - Verify tasks sync to backend
   - Check workflow execution history
   - View Prometheus metrics at http://localhost:8000/metrics

---

## 4. Deploy to Production

### Deploy to Cloud VPS

```bash
# Example: DigitalOcean, Linode, AWS EC2
ssh user@your-server

# Install Docker
curl -fsSL https://get.docker.com | sh

# Pull and run
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest

docker run -d -p 80:8000 \
  -e JWT_SECRET_KEY=$(openssl rand -hex 32) \
  -e DATABASE_URL=postgresql://user:pass@localhost:5432/db \
  --name browser-agent-backend \
  --restart always \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest
```

### Deploy to Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: browser-agent-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: browser-agent-backend
  template:
    metadata:
      labels:
        app: browser-agent-backend
    spec:
      containers:
      - name: backend
        image: ghcr.io/stackconsult/stackbrowseragent/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: JWT_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: browser-agent-secrets
              key: jwt-secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: browser-agent-secrets
              key: database-url
---
apiVersion: v1
kind: Service
metadata:
  name: browser-agent-backend
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8000
  selector:
    app: browser-agent-backend
```

Apply with:
```bash
kubectl apply -f k8s-deployment.yaml
```

---

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker logs browser-agent-backend

# Common issues:
# 1. Port already in use
docker stop $(docker ps -q --filter ancestor=ghcr.io/stackconsult/stackbrowseragent/backend)

# 2. Database connection failed
# Verify DATABASE_URL is correct

# 3. Missing JWT_SECRET_KEY
docker run ... -e JWT_SECRET_KEY=$(openssl rand -hex 32) ...
```

### Extension Not Connecting

1. **Check Backend URL**
   - Ensure `http://localhost:8000` is accessible
   - Try: `curl http://localhost:8000/health`

2. **CORS Issues**
   - Backend allows all origins by default
   - Check browser console for errors

3. **Authentication Failed**
   - Verify user exists: `docker exec browser-agent-backend cat /app/data/app.db`
   - Re-register user with API

### Database Issues

```bash
# SQLite: Check database file
docker exec browser-agent-backend ls -la /app/data/

# PostgreSQL: Connect and verify
docker exec -it <postgres-container> psql -U postgres -d browseragent
\dt  # List tables
```

---

## Next Steps

- **Read Full Documentation**: [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md)
- **API Documentation**: http://localhost:8000/docs
- **Monitoring**: http://localhost:8000/metrics (Prometheus format)
- **Examples**: See [EXAMPLES.md](EXAMPLES.md)
- **Advanced Usage**: See [USAGE.md](USAGE.md)

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│ GitHub Repository                       │
│ stackconsult/stackBrowserAgent          │
└──────────────┬──────────────────────────┘
               │
               │ Push triggers CI/CD
               ↓
┌──────────────────────────────────────────┐
│ GitHub Actions                           │
├──────────────────────────────────────────┤
│ • Build Docker Image                     │
│ • Publish to ghcr.io                     │
│ • Build Extension                        │
│ • Create GitHub Release                  │
└────────┬──────────────────┬──────────────┘
         │                  │
         ↓                  ↓
┌────────────────┐  ┌──────────────────────┐
│ Docker Image   │  │ Extension ZIP        │
│ ghcr.io/...    │  │ GitHub Releases      │
└────────┬───────┘  └────────┬─────────────┘
         │                   │
         │ Pull              │ Download
         ↓                   ↓
┌────────────────┐  ┌──────────────────────┐
│ Backend        │  │ Chrome Browser       │
│ FastAPI :8000  │←─┤ Extension UI         │
│ + PostgreSQL   │  │ React Sidepanel      │
└────────────────┘  └──────────────────────┘
```

---

## Summary

**Total Setup Time**: 10 minutes
- Backend deployment: 2 minutes
- Extension installation: 3 minutes
- Configuration & testing: 5 minutes

**Cost**: $0 (using Docker locally) or ~$5-10/month (cloud VPS)

**What You Get**:
- ✅ Enterprise browser automation
- ✅ Python FastAPI backend with authentication
- ✅ Chrome extension with React UI
- ✅ PostgreSQL database
- ✅ RAG with ChromaDB/Pinecone
- ✅ Workflow DAG engine
- ✅ Prometheus monitoring
- ✅ Full API documentation
