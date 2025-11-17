# Production Deployment Checklist

Complete guide to deploy the Workstation application from repository to live beta app.

## Pre-Deployment Requirements

### 1. Environment Setup
- [ ] Node.js v18+ installed
- [ ] npm or yarn package manager
- [ ] Git configured
- [ ] Railway account (for one-click deployment) OR Docker installed

### 2. Repository Preparation
```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation

# Install dependencies
npm install

# Run linting and tests
npm run lint
npm test

# Build the application
npm run build
```

### 3. Environment Configuration

Create a `.env` file with the following required variables:

```env
# JWT Configuration (REQUIRED)
# Generate secure secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=<your-64-character-secure-secret>
JWT_EXPIRATION=24h

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration (CRITICAL for production)
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Logging
LOG_LEVEL=info
```

**Security Note**: Never commit `.env` files. Use `.env.example` as a template.

## Deployment Options

### Option 1: Railway (Recommended - One-Click)

Railway provides the easiest deployment path with automatic builds and hosting.

#### Steps:
1. **Click Deploy Button** (if available) or:
2. **Manual Railway Deployment**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize project
   railway init
   
   # Deploy
   railway up
   ```

3. **Configure Environment Variables** in Railway dashboard:
   - `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - `JWT_EXPIRATION` - Default: `24h`
   - `NODE_ENV` - Set to: `production`
   - `ALLOWED_ORIGINS` - Your production domain(s)

4. **Verify Deployment**:
   - Railway will provide a URL (e.g., `https://your-app.railway.app`)
   - Test health endpoint: `https://your-app.railway.app/health`
   - Access UI: `https://your-app.railway.app/workstation-control-center.html`

#### Railway Configuration
The project includes `railway.json` with optimized settings:
- Auto-build: `npm install && npm run build`
- Start command: `npm start`
- Auto-restart on failure (max 10 retries)

### Option 2: Docker Deployment

Docker provides consistent deployment across any platform.

#### Steps:
1. **Build Docker Image**:
   ```bash
   docker build -t workstation:latest .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e JWT_SECRET="your-secure-secret-here" \
     -e JWT_EXPIRATION="24h" \
     -e NODE_ENV="production" \
     -e ALLOWED_ORIGINS="https://yourdomain.com" \
     --name workstation \
     workstation:latest
   ```

3. **Verify Container**:
   ```bash
   # Check container status
   docker ps
   
   # View logs
   docker logs workstation
   
   # Test health
   curl http://localhost:3000/health
   ```

4. **Use Docker Compose** (recommended for production):
   ```bash
   docker-compose up -d
   ```

### Option 3: Manual VPS Deployment

Deploy to any Linux server (AWS, DigitalOcean, Linode, etc.).

#### Steps:
1. **Server Setup**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

2. **Deploy Application**:
   ```bash
   # Clone repository
   git clone https://github.com/creditXcredit/workstation.git
   cd workstation
   
   # Install and build
   npm install
   npm run build
   
   # Create .env file
   nano .env
   # (Add your configuration)
   
   # Start with PM2
   pm2 start dist/index.js --name workstation
   pm2 save
   pm2 startup
   ```

3. **Setup Nginx Reverse Proxy**:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Post-Deployment Verification

### 1. Health Checks
```bash
# Basic health
curl https://your-domain.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-11-17T12:00:00.000Z",
  "uptime": 123.456,
  "memory": {
    "used": 45,
    "total": 512,
    "percentage": 9
  },
  "version": "1.0.0",
  "database": {
    "status": "connected"
  }
}
```

### 2. API Endpoints
```bash
# Get demo token
curl https://your-domain.com/auth/demo-token

# Test protected endpoint
TOKEN="<your-token>"
curl -H "Authorization: Bearer $TOKEN" https://your-domain.com/api/protected
```

### 3. UI Access
- Main Dashboard: `https://your-domain.com/index.html`
- Control Center: `https://your-domain.com/workstation-control-center.html`

### 4. Database Check
```bash
# Health endpoint includes database status
curl https://your-domain.com/health | jq '.database'
```

## Production Monitoring

### 1. Application Logs
```bash
# Railway: View in dashboard
# Docker: docker logs workstation
# PM2: pm2 logs workstation
```

### 2. Health Monitoring
Set up automated health checks:
```bash
# Example cron job for uptime monitoring
*/5 * * * * curl -f https://your-domain.com/health || echo "Service down!" | mail -s "Alert" admin@yourdomain.com
```

### 3. Performance Metrics
Monitor these key metrics:
- Response time (should be < 100ms for health endpoint)
- Memory usage (should stay under 80%)
- Database connection status
- Error rate in logs

## Troubleshooting

### Server Won't Start
```bash
# Check logs for errors
npm start # Look for error messages

# Common issues:
# 1. Missing .env file → Create from .env.example
# 2. Port already in use → Change PORT in .env
# 3. Database init failed → Check schema.sql exists in dist/automation/db/
```

### Database Errors
```bash
# Verify schema file
ls dist/automation/db/schema.sql

# If missing, rebuild:
npm run build

# Manual database reset:
rm workstation.db
npm start # Will recreate database
```

### CORS Issues
```bash
# Check ALLOWED_ORIGINS in .env
# Must include your frontend domain

# For testing, temporarily allow all (NOT for production):
ALLOWED_ORIGINS=*
```

### Memory Leaks
```bash
# Monitor memory usage
curl https://your-domain.com/health | jq '.memory'

# If memory grows continuously:
# 1. Check for leaked database connections
# 2. Review workflow executions
# 3. Restart service: pm2 restart workstation
```

## Rollback Procedure

If deployment fails:

### Railway
```bash
# In Railway dashboard, select previous deployment
railway rollback <deployment-id>
```

### Docker
```bash
# Use previous image version
docker pull ghcr.io/creditxcredit/workstation:main-<previous-commit>
docker stop workstation
docker rm workstation
docker run -d ... workstation:<previous-version>
```

### Manual/PM2
```bash
# Revert to previous commit
git checkout <previous-commit>
npm install
npm run build
pm2 restart workstation
```

## Security Hardening

### 1. Environment Variables
- [ ] JWT_SECRET is 64+ characters random string
- [ ] NODE_ENV is set to "production"
- [ ] ALLOWED_ORIGINS is restricted to your domains only
- [ ] No secrets in code or git history

### 2. Network Security
- [ ] HTTPS enabled (SSL/TLS certificate)
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Rate limiting enabled (built-in)
- [ ] Security headers configured (built-in via Helmet)

### 3. Access Control
- [ ] JWT tokens expire after 24 hours (or less)
- [ ] Strong authentication required for all protected endpoints
- [ ] Database access restricted to application only

### 4. Monitoring & Alerts
- [ ] Log aggregation configured
- [ ] Error alerting enabled
- [ ] Uptime monitoring active
- [ ] Security scanning scheduled

## Production Readiness Verification

Complete this checklist before going live:

### Core Functionality
- [ ] Server starts without errors
- [ ] Health check returns status "ok"
- [ ] Database connection successful
- [ ] All tests passing (114/114)
- [ ] Build completes without errors
- [ ] Linting passes

### API Endpoints
- [ ] GET /health - Returns system status
- [ ] GET /auth/demo-token - Generates test token
- [ ] POST /auth/token - Creates custom tokens
- [ ] GET /api/protected - Requires valid JWT
- [ ] GET /api/v2/workflows - Lists workflows (authenticated)

### UI Access
- [ ] Static files served correctly
- [ ] Control Center UI loads
- [ ] Dashboard UI functional
- [ ] Assets load (CSS, JS)

### Security
- [ ] JWT_SECRET is strong and unique
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Security headers present

### Performance
- [ ] Response time < 100ms (health check)
- [ ] Memory usage stable
- [ ] Database queries optimized
- [ ] Static files cached

### Documentation
- [ ] README.md updated
- [ ] API.md reflects all endpoints
- [ ] This deployment guide reviewed
- [ ] Environment variables documented

## Success Criteria

Your deployment is successful when:
1. ✅ Health endpoint returns `{"status": "ok", "database": {"status": "connected"}}`
2. ✅ UI is accessible and functional
3. ✅ Authentication works (can generate and validate tokens)
4. ✅ Protected endpoints require valid JWT
5. ✅ Database operations succeed
6. ✅ No errors in logs
7. ✅ Performance meets benchmarks

## Support & Resources

- **Issues**: https://github.com/creditXcredit/workstation/issues
- **Documentation**: See README.md, API.md, ARCHITECTURE.md
- **Production Readiness**: See PRODUCTION_READINESS.md
- **Security**: See SECURITY.md

## Continuous Deployment

For automated deployments:

### GitHub Actions
The repository includes CI/CD workflows:
- `.github/workflows/ci.yml` - Test on every push
- `.github/workflows/deploy-with-rollback.yml` - Deploy to Railway

Configure secrets in GitHub:
- `RAILWAY_TOKEN` - For automated Railway deployments

---

**Last Updated**: 2025-11-17  
**Version**: 1.0.0  
**Status**: Production Ready ✅
