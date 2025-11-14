# Deployment Guide

## GitHub-Native Deployment (Recommended)

The system uses GitHub Actions for CI/CD and GitHub Container Registry (GHCR) for Docker images.

### Automated Deployment

**Every push to the repository automatically:**
- Builds Docker image for backend
- Publishes to `ghcr.io/stackconsult/stackbrowseragent/backend`
- Builds Chrome extension
- Creates GitHub Release with downloadable ZIP

### Pull and Deploy Backend

```bash
# Pull latest Docker image from GHCR
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Run backend
docker run -d -p 8000:8000 \
  -e JWT_SECRET_KEY=$(openssl rand -hex 32) \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  --name browser-agent-backend \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Check health
curl http://localhost:8000/health
```

### With Docker Compose

```yaml
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
```

Run with: `docker-compose up -d`

## Local Development with Docker Compose

1. **Create `.env` file**:
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys
```

2. **Start services**:
```bash
docker-compose up -d
```

3. **Check health**:
```bash
curl http://localhost:8000/health
```

4. **View logs**:
```bash
docker-compose logs -f backend
```

5. **Stop services**:
```bash
docker-compose down
```

## Deployment to Various Platforms

### Option 1: Any VPS (DigitalOcean, AWS, Linode, etc.)

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Pull image from GHCR
docker pull ghcr.io/stackconsult/stackbrowseragent/backend:latest

# Run with environment variables
docker run -d -p 8000:8000 \
  -e JWT_SECRET_KEY=your-secret-key \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  --restart always \
  --name browser-agent \
  ghcr.io/stackconsult/stackbrowseragent/backend:latest
```

### Option 2: Kubernetes (GKE, EKS, AKS)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: browser-agent-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: browser-agent
  template:
    metadata:
      labels:
        app: browser-agent
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
```

Apply with: `kubectl apply -f deployment.yaml`

### Option 3: Container Platforms (Render, Fly.io, etc.)

Most container platforms can deploy directly from GHCR:
1. Connect your GitHub repository
2. Point to `ghcr.io/stackconsult/stackbrowseragent/backend:latest`
3. Set environment variables
4. Deploy

## Chrome Extension Deployment

### Load Unpacked (Development)

1. Build extension:
```bash
npm run build
```

2. Open Chrome: `chrome://extensions`

3. Enable "Developer mode"

4. Click "Load unpacked"

5. Select `dist/` folder

### Chrome Web Store (Production)

1. Create developer account at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)

2. Build extension:
```bash
npm run build
```

3. Create ZIP:
```bash
cd dist
zip -r ../stackbrowseragent.zip *
```

4. Upload ZIP to Chrome Web Store

5. Fill in listing details and submit for review

## Environment Variables

### Backend Required Variables:
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
OPENAI_API_KEY=sk-...
```

### Backend Optional Variables:
```env
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AI...
GROQ_API_KEY=gsk_...
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX_NAME=stackbrowseragent
DEBUG=false
LOG_LEVEL=INFO
```

## Health Monitoring

### Endpoints
- Health: `GET /health`
- Status: `GET /api/status`
- Docs: `GET /docs`

### Docker Health Checks
```bash
docker inspect stackbrowseragent-backend | grep -A 10 Health
```

## Backup & Recovery

### Database Backup
```bash
docker exec stackbrowseragent-db pg_dump -U postgres stackbrowseragent > backup.sql
```

### Database Restore
```bash
docker exec -i stackbrowseragent-db psql -U postgres stackbrowseragent < backup.sql
```

## Troubleshooting

### Backend won't start
1. Check logs: `docker-compose logs backend`
2. Verify DATABASE_URL is correct
3. Ensure ports are not in use

### Extension can't connect to backend
1. Check backend URL in extension settings
2. Verify CORS is enabled
3. Check backend is running: `curl http://localhost:8000/health`

### Database connection issues
1. Check postgres is running: `docker-compose ps`
2. Verify credentials in .env
3. Check postgres logs: `docker-compose logs postgres`
