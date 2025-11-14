# Security Policy

## Overview

stackBrowserAgent implements multiple layers of security to protect your application and data.

## Security Features

### 1. JWT Authentication

All protected endpoints require valid JWT tokens for access:

- **Token Generation**: Tokens are signed using HS256 algorithm with a secret key
- **Token Expiration**: Configurable expiration time (default: 24h)
- **Token Verification**: All tokens are verified before granting access to protected resources

#### Best Practices:

- **Always use a strong JWT_SECRET in production**
- Never commit secrets to version control
- Rotate JWT_SECRET regularly
- Use short expiration times for sensitive operations

Generate a secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Rate Limiting

Protection against brute force and DoS attacks:

- **General Endpoints**: 100 requests per 15 minutes per IP
- **Authentication Endpoints**: 10 requests per 15 minutes per IP

Configure in `src/index.ts` if needed for your use case.

### 3. Security Headers (Helmet)

Helmet middleware sets various HTTP headers to protect against common vulnerabilities:

- **X-Content-Type-Options**: Prevents MIME type sniffing
- **X-Frame-Options**: Prevents clickjacking
- **X-XSS-Protection**: Enables XSS filter in older browsers
- **Strict-Transport-Security**: Enforces HTTPS
- **Content-Security-Policy**: Controls resource loading

### 4. Input Validation

- Request body size limits via Express
- JSON parsing with built-in Express middleware
- JWT payload validation

### 5. Error Handling

- No sensitive information leaked in error messages
- Detailed errors logged server-side only
- Generic error messages returned to clients

## Production Deployment Checklist

### Required Environment Variables

```env
# REQUIRED: Set a strong secret key
JWT_SECRET=<use 'node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"'>

# OPTIONAL: Configure token expiration (default: 24h)
JWT_EXPIRATION=24h

# OPTIONAL: Set to production
NODE_ENV=production
```

### Deployment Steps

1. **Generate JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Set Environment Variables**:
   - Railway: Configure in project settings
   - Docker: Pass via `-e` flags or env file
   - Local: Create `.env` file from `.env.example`

3. **Verify Security**:
   ```bash
   # Check for vulnerabilities
   npm audit
   
   # Build the application
   npm run build
   
   # Run tests
   ./test.sh
   ```

4. **Monitor Logs**: Watch for authentication failures and rate limit hits

### Railway Deployment

Railway automatically:
- Generates a secure JWT_SECRET if not provided
- Sets NODE_ENV to production
- Enables HTTPS by default

To deploy:

1. Click "Deploy on Railway" button in README
2. Verify JWT_SECRET is set in environment variables
3. Access your deployed application

## Vulnerability Reporting

If you discover a security vulnerability, please email security@stackconsult.com (or open a private security advisory on GitHub).

**Please do not open public issues for security vulnerabilities.**

## Security Testing

### Run Security Audit

```bash
# Check for dependency vulnerabilities
npm audit

# Run linter
npm run lint

# Run tests
./test.sh
```

### Test Authentication

```bash
# Get a demo token
curl http://localhost:3000/auth/demo-token

# Try accessing protected route without token (should fail)
curl http://localhost:3000/api/protected

# Try accessing protected route with token (should succeed)
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/protected
```

## Compliance

### OWASP Top 10 Coverage

- **A01: Broken Access Control**: JWT authentication on all protected routes
- **A02: Cryptographic Failures**: Strong JWT secret required, HTTPS enforced
- **A03: Injection**: Input validation and parameterized JWT claims
- **A04: Insecure Design**: Rate limiting and security headers
- **A05: Security Misconfiguration**: Production validation checks
- **A06: Vulnerable Components**: Regular npm audit, zero vulnerabilities
- **A07: Authentication Failures**: Rate limiting on auth endpoints
- **A08: Software and Data Integrity Failures**: All dependencies are installed from trusted sources and verified via npm. No dynamic code loading or unsigned plugins are used. CI/CD pipelines are protected and only signed code is deployed.
- **A09: Security Logging**: Authentication failures logged
- **A10: SSRF**: No external requests from user input

## Updates and Maintenance

- Dependencies are regularly updated
- Security patches are applied promptly
- npm audit is run before each release
- CodeQL security scanning is enabled

## Additional Resources

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Helmet Documentation](https://helmetjs.github.io/)
- [Rate Limiting Best Practices](https://www.npmjs.com/package/express-rate-limit)

## License

See [LICENSE](LICENSE) file for details.
