# stackBrowserAgent Railway Template

This template deploys a secure Browser Agent with JWT authentication on Railway.

## Features

- 🔐 JWT Authentication with secure token generation
- 🚀 Express API Server with TypeScript
- 🛡️ Rate limiting and security headers (Helmet)
- 📝 Production-ready with security validations
- 🐳 Docker Ready

## Deployment Steps

### 1. Click "Deploy on Railway"

Railway will:
- Clone the repository
- Install dependencies
- Build the TypeScript application
- Auto-generate a secure JWT_SECRET (or use yours if provided)
- Deploy to a public HTTPS URL

### 2. Verify Environment Variables

After deployment, check your Railway project settings to ensure:

- **JWT_SECRET** (required): Railway automatically generates a secure secret using the `secret` generator
  - To use your own: Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
  - Update in Railway dashboard: Settings → Variables
  
- **JWT_EXPIRATION** (optional): Token lifetime (default: "24h")
  - Recommended values: "1h", "24h", "7d", "30d"
  
- **PORT** (auto-configured): Railway automatically sets this
- **NODE_ENV** (auto-configured): Set to "production" by Railway

### 3. Test Your Deployment

Once deployed, your app will be available at: `https://your-app.railway.app`

Test the endpoints:

```bash
# Health check
curl https://your-app.railway.app/health

# Get a demo JWT token
curl https://your-app.railway.app/auth/demo-token

# Use the token to access protected routes
curl -H "Authorization: Bearer YOUR_TOKEN" https://your-app.railway.app/api/protected
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes | Auto-generated | Secret key for JWT signing (32+ character random string) |
| `JWT_EXPIRATION` | No | `24h` | Token expiration time (e.g., "1h", "7d") |
| `PORT` | No | Auto-set | Application port (Railway manages this) |
| `NODE_ENV` | No | `production` | Environment mode |

## API Endpoints

All endpoints support HTTPS and include security headers.

### Public Endpoints

- `GET /health` - Health check (no auth required)
- `GET /auth/demo-token` - Get demo JWT token (rate limited: 10 req/15min)
- `POST /auth/token` - Generate custom token (rate limited: 10 req/15min)
  ```json
  POST /auth/token
  Content-Type: application/json
  
  {
    "userId": "user123",
    "role": "admin"
  }
  ```

### Protected Endpoints (JWT Required)

Add token to Authorization header: `Bearer <your-token>`

- `GET /api/protected` - Protected route example
- `GET /api/agent/status` - Agent status with user info

## Security Features

✅ JWT Authentication with configurable expiration
✅ Rate limiting (100 req/15min general, 10 req/15min auth)
✅ Security headers via Helmet middleware
✅ Production JWT_SECRET validation
✅ HTTPS enforced by Railway
✅ Zero vulnerabilities (npm audit clean)

## Troubleshooting

### JWT_SECRET Not Set Error

If you see "FATAL ERROR: JWT_SECRET not set in production", ensure:
1. Railway has generated a JWT_SECRET (check Settings → Variables)
2. The variable is marked as "Active"
3. Redeploy the application

### Authentication Failures

Check logs in Railway dashboard:
- Invalid tokens will show "JWT verification failed"
- Missing tokens will show "No token provided"
- Rate limit hits will show 429 errors

## Production Best Practices

1. **Monitor your JWT_SECRET**: Never expose it in logs or client code
2. **Adjust rate limits**: Modify in `src/index.ts` based on your traffic
3. **Set appropriate token expiration**: Balance security vs. user experience
4. **Review security logs**: Check Railway logs for authentication failures
5. **Keep dependencies updated**: Run `npm audit` regularly

## Documentation

For comprehensive documentation, see:
- [README.md](README.md) - Complete setup and usage guide
- [SECURITY.md](SECURITY.md) - Detailed security information
- [CONTRIBUTING.md](CONTRIBUTING.md) - Development guidelines

## Support

For issues or questions:
- GitHub Issues: https://github.com/stackconsult/stackBrowserAgent/issues
- Security issues: See SECURITY.md for vulnerability reporting

