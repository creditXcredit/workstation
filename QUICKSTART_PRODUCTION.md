# 🚀 Quick Start: Repo to Production in 5 Minutes

This guide will take you from cloning the repository to having a live, fully functional beta application running in production.

## Prerequisites
- [ ] Node.js v18+ installed
- [ ] Railway account (free tier works) OR Docker installed
- [ ] 5 minutes of time

## Step 1: Clone and Setup (1 minute)

```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm install

# Generate secure JWT secret and create .env file
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" > .env
echo "JWT_EXPIRATION=24h" >> .env
echo "PORT=3000" >> .env
echo "NODE_ENV=production" >> .env
echo "ALLOWED_ORIGINS=https://yourdomain.com" >> .env
```

## Step 2: Build and Test Locally (1 minute)

```bash
# Build the application
npm run build

# Start the server
npm start &

# Wait a few seconds, then verify
sleep 5
npm run verify
```

Expected output:
```
✅ All Systems Operational
🎉 Workstation is ready for production use!
```

## Step 3: Deploy to Production (3 minutes)

### Option A: Railway (Easiest - 1 Click)

1. Click the deploy button:
   [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/creditXcredit/workstation)

2. Railway automatically:
   - Builds your application
   - Generates a secure JWT_SECRET
   - Deploys to a public URL
   - Provides SSL/HTTPS

3. Access your app at: `https://your-app.railway.app`

### Option B: Docker (For Any Cloud)

```bash
# Build image
docker build -t workstation:latest .

# Run container
docker run -d \
  -p 3000:3000 \
  -e JWT_SECRET="your-64-char-secret-here" \
  -e JWT_EXPIRATION="24h" \
  -e NODE_ENV="production" \
  -e ALLOWED_ORIGINS="https://yourdomain.com" \
  --name workstation \
  --restart unless-stopped \
  workstation:latest

# Verify it's running
docker logs workstation
```

### Option C: VPS Deployment

```bash
# On your server (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# Clone and setup
git clone https://github.com/creditXcredit/workstation.git
cd workstation
npm install
npm run build

# Create .env file (use your values)
nano .env

# Start with PM2
pm2 start dist/index.js --name workstation
pm2 save
pm2 startup
```

## Step 4: Verify Production Deployment (30 seconds)

Once deployed, test your production instance:

```bash
# Replace YOUR_URL with your actual deployment URL
export PROD_URL="https://your-app.railway.app"

# Test health endpoint
curl $PROD_URL/health

# Expected response:
# {
#   "status": "ok",
#   "database": { "status": "connected" },
#   "memory": { ... }
# }

# Get a demo token
curl $PROD_URL/auth/demo-token

# Access the UI
open $PROD_URL/workstation-control-center.html
```

## Step 5: Start Using Your Beta App

Your application is now live with:

### 🌐 User Interfaces
- **Control Center**: `https://your-url.com/workstation-control-center.html`
- **Main Dashboard**: `https://your-url.com/index.html`

### 🔌 API Endpoints
- Health Check: `GET /health`
- Demo Token: `GET /auth/demo-token`
- Create Token: `POST /auth/token`
- Protected Route: `GET /api/protected` (requires auth)
- Workflows: `GET /api/v2/workflows` (requires auth)

### 🔐 Authentication
```bash
# Get a token
TOKEN=$(curl -s $PROD_URL/auth/demo-token | jq -r '.token')

# Use it in requests
curl -H "Authorization: Bearer $TOKEN" $PROD_URL/api/protected
```

## What You Now Have Running

✅ **Full Stack Application**
- Express.js REST API
- JWT authentication
- SQLite database (auto-created)
- Browser automation (Playwright)
- Workflow orchestration engine

✅ **Production Features**
- Rate limiting (100 req/15min)
- CORS protection
- Security headers (Helmet)
- Input validation (Joi)
- Structured logging (Winston)
- Health monitoring

✅ **User Interfaces**
- Professional control center
- Main dashboard
- Real-time system monitoring
- Workflow management

✅ **Security**
- HTTPS (on Railway/with proper setup)
- JWT token authentication
- Secure headers
- CORS configuration
- Rate limiting

## Common First Actions

### 1. Generate a Custom Token
```bash
curl -X POST $PROD_URL/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin@yourcompany.com",
    "role": "admin"
  }'
```

### 2. Create a Workflow
```bash
TOKEN="your-token-here"
curl -X POST $PROD_URL/api/v2/workflows \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Workflow",
    "description": "Test workflow",
    "steps": [
      {
        "action": "navigate",
        "params": {
          "url": "https://example.com"
        }
      }
    ]
  }'
```

### 3. Open the Control Center
Navigate to: `https://your-url.com/workstation-control-center.html`

This gives you a visual interface to:
- Monitor system health
- View all agents
- Manage workflows
- See real-time metrics

## Troubleshooting

### Server Won't Start
```bash
# Check logs
npm start

# Common fixes:
# - Ensure .env file exists
# - Check JWT_SECRET is set
# - Verify port is not in use
```

### Database Errors
```bash
# Rebuild to ensure schema.sql is copied
npm run build

# Database will auto-create on first run
```

### Can't Access UI
```bash
# Ensure docs/ folder exists
ls docs/

# Check server is serving static files
curl -I $PROD_URL/index.html
```

## Need More Help?

- **Full Deployment Guide**: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **API Documentation**: [API.md](./API.md)
- **Architecture Details**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Security Policy**: [SECURITY.md](./SECURITY.md)
- **Production Status**: [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)

## Success! 🎉

You now have a fully functional, production-ready application running with:
- ✅ RESTful API with authentication
- ✅ Browser automation capabilities
- ✅ Workflow orchestration
- ✅ Professional UI
- ✅ Production security features
- ✅ Real-time monitoring

**Time elapsed**: ~5 minutes  
**Lines of code you wrote**: ~10  
**Lines of code working for you**: ~10,000+

Welcome to your new automation platform! 🚀
