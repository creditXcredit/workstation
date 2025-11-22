# Troubleshooting Guide - stackBrowserAgent Workstation

Common issues and solutions for the Click-Deploy system and stackBrowserAgent platform.

## Table of Contents

1. [Download Issues](#download-issues)
2. [Chrome Extension Problems](#chrome-extension-problems)
3. [Server Issues](#server-issues)
4. [Build Failures](#build-failures)
5. [Connection Problems](#connection-problems)
6. [Browser Compatibility](#browser-compatibility)
7. [Performance Issues](#performance-issues)
8. [Auto-Updater Issues](#auto-updater-issues)

---

## Download Issues

### Downloads Not Working

**Symptoms**: 
- Clicking download button does nothing
- "Package not available" error
- 404 Not Found errors

**Solutions**:

1. **Verify packages were built**:
```bash
# Check if ZIP files exist
ls -la public/downloads/

# Expected output:
# chrome-extension.zip (~72KB)
# workflow-builder.zip (~14KB)
```

2. **Rebuild packages**:
```bash
npm run build:chrome
npm run build:workflow
```

3. **Check server is running**:
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test manifest
curl http://localhost:3000/downloads/manifest.json
```

4. **Verify download routes are registered**:
```bash
# Check server logs for:
# "Downloads routes registered"
```

### Corrupted Download

**Symptoms**:
- ZIP file won't extract
- "Archive is corrupted" error
- Extension won't load

**Solutions**:

1. **Re-download the package**:
   - Clear browser cache
   - Try download again
   - Use different browser if issue persists

2. **Rebuild from source**:
```bash
# Clean and rebuild
rm -rf build/ public/downloads/*.zip
npm run build
```

3. **Verify file integrity**:
```bash
# Check file size matches expected
ls -lh public/downloads/chrome-extension.zip

# Should be approximately 72KB
```

### Download Hangs/Times Out

**Symptoms**:
- Download starts but never completes
- Browser shows "Waiting for localhost..."
- Connection timeout errors

**Solutions**:

1. **Check server resources**:
```bash
# Check CPU and memory
top -l 1 | grep -E "^CPU|^Phys"

# Restart server if needed
npm start
```

2. **Increase timeout**:
   - Try download again
   - Check browser network tab for errors
   - Verify no firewall blocking

3. **Use direct URL**:
```bash
# Download via curl instead
curl -O http://localhost:3000/downloads/chrome-extension.zip
```

---

## Chrome Extension Problems

### Extension Won't Load

**Symptoms**:
- "Failed to load extension" error in Chrome
- "Manifest file is missing or unreadable"
- Extension not appearing in list

**Solutions**:

1. **Verify folder contents**:
```bash
cd chrome-extension/
ls -la

# Must have:
# manifest.json
# background.js
# content.js
# popup.html
```

2. **Check manifest.json validity**:
```bash
# Validate JSON syntax
cat chrome-extension/manifest.json | python -m json.tool
```

3. **Ensure Chrome is up-to-date**:
   - Extension requires Chrome 90+
   - Update Chrome if needed
   - Try Chromium or Edge as alternative

4. **Use correct loading method**:
   - Extract ZIP completely first
   - Load the extracted *folder*, not the ZIP file
   - Enable "Developer mode" in chrome://extensions/

### Extension Shows "Connection Failed"

**Symptoms**:
- Extension popup shows disconnected
- "Cannot connect to server" message
- API calls failing

**Solutions**:

1. **Verify server is running**:
```bash
# Check if server is up
curl http://localhost:3000/health

# Expected: {"status":"healthy"}
```

2. **Check extension configuration**:
   - Open extension popup
   - Verify API URL is `http://localhost:3000`
   - Click "Reconnect" if available

3. **Review CORS settings**:
```bash
# Check server logs for CORS errors
# Extension origin should be allowed
```

4. **Restart both server and extension**:
```bash
# Restart server
npm start

# In Chrome:
# 1. Go to chrome://extensions/
# 2. Click reload icon on extension
```

### Extension Commands Not Working

**Symptoms**:
- Commands typed but nothing happens
- "Unknown command" errors
- No response from automation

**Solutions**:

1. **Check authentication**:
   - Extension needs valid JWT token
   - Get new demo token from server
   - Update token in extension settings

2. **Verify command syntax**:
```javascript
// Correct format:
"Navigate to google.com"
"Click button.submit"
"Type hello into input#search"

// Not:
"go to google" // ❌ Too vague
"click" // ❌ Missing selector
```

3. **Check browser console**:
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for failed requests

---

## Server Issues

### Server Won't Start

**Symptoms**:
- "Port already in use" error
- "JWT_SECRET not configured" error
- Immediate crash on start

**Solutions**:

1. **Port conflict**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

2. **Missing JWT_SECRET**:
```bash
# Check .env file exists
cat .env

# Set JWT_SECRET
echo 'JWT_SECRET=your-secure-secret-here' >> .env
```

3. **Missing dependencies**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

4. **Database issues**:
```bash
# Remove and reinitialize database
rm -f workstation.db
npm start
```

### Server Crashes Intermittently

**Symptoms**:
- Server stops unexpectedly
- "ECONNRESET" errors
- Memory errors

**Solutions**:

1. **Check logs**:
```bash
# View server logs
npm start 2>&1 | tee server.log

# Look for error patterns
```

2. **Increase memory limit**:
```bash
# Start with more memory
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

3. **Monitor resources**:
```bash
# Install monitoring
npm install -g pm2

# Run with pm2
pm2 start "npm start" --name workstation
pm2 monit
```

### API Endpoints Return 500 Errors

**Symptoms**:
- Internal Server Error on API calls
- 500 status codes
- "Something went wrong" messages

**Solutions**:

1. **Check server logs**:
   - Look for stack traces
   - Identify failing route
   - Check database connectivity

2. **Verify JWT token**:
```bash
# Get fresh token
curl http://localhost:3000/auth/demo-token

# Test with token
curl -H "Authorization: Bearer <token>" \
     http://localhost:3000/api/protected
```

3. **Database integrity**:
```bash
# Check database file
ls -lh workstation.db

# Rebuild if corrupted
rm workstation.db
npm start
```

---

## Build Failures

### TypeScript Compilation Errors

**Symptoms**:
- `npm run build` fails
- Type errors in console
- "Cannot find module" errors

**Solutions**:

1. **Clean build**:
```bash
# Remove old builds
rm -rf dist/ build/

# Rebuild
npm run build
```

2. **Update dependencies**:
```bash
# Update TypeScript and types
npm update typescript @types/node @types/express
```

3. **Check tsconfig.json**:
```bash
# Verify configuration is valid
cat tsconfig.json | python -m json.tool
```

### ZIP Creation Fails

**Symptoms**:
- Build succeeds but no ZIP files
- "archiver" errors
- Permission denied errors

**Solutions**:

1. **Check archiver installation**:
```bash
# Verify archiver is installed
npm list archiver

# Reinstall if missing
npm install --save archiver
```

2. **Check permissions**:
```bash
# Ensure write permissions
chmod -R u+w public/downloads/

# Create directory if missing
mkdir -p public/downloads
```

3. **Manual ZIP creation**:
```bash
# Create zips manually
cd build/chrome-extension
zip -r ../../public/downloads/chrome-extension.zip *
```

---

## Connection Problems

### Cannot Access Dashboard

**Symptoms**:
- Browser can't reach localhost:3000
- "This site can't be reached"
- Connection refused

**Solutions**:

1. **Verify server is running**:
```bash
ps aux | grep node

# Should show node process
```

2. **Test from command line**:
```bash
curl http://localhost:3000

# If this works but browser doesn't,
# check browser proxy settings
```

3. **Try different address**:
```
http://127.0.0.1:3000
http://[::1]:3000
```

4. **Check firewall**:
   - Disable firewall temporarily
   - Add exception for Node.js
   - Check antivirus isn't blocking

### CORS Errors in Browser

**Symptoms**:
- Console shows CORS policy errors
- "Access-Control-Allow-Origin" errors
- Extension can't make API calls

**Solutions**:

1. **Check server CORS configuration**:
```typescript
// Should allow extension origin
app.use(cors({
  origin: 'chrome-extension://*'
}));
```

2. **Restart server** after configuration changes

3. **Use proxy** if CORS can't be configured

---

## Browser Compatibility

### Safari Not Working

**Issue**: Safari may have limitations

**Solutions**:
- Use Chrome, Edge, or Chromium
- Safari support coming in future releases

### Firefox Extension

**Issue**: Extension is Chrome-only (Manifest V3)

**Solutions**:
- Use Firefox for workflow builder (web UI)
- Chrome/Edge required for extension

---

## Performance Issues

### Slow Downloads

**Solutions**:
1. Check server CPU/memory usage
2. Restart server
3. Clear browser cache
4. Use wired connection instead of WiFi

### High Memory Usage

**Solutions**:
```bash
# Monitor memory
top -l 1 | grep node

# Restart server periodically
pm2 restart workstation

# Reduce concurrent workflows
```

---

## Auto-Updater Issues

### Status Not Updating

**Symptoms**:
- Agent status shows old data
- Auto-update script not running
- No commits from github-actions bot

**Solutions**:

1. **Run manually**:
```bash
npm run update:agents
```

2. **Check GitHub Actions**:
   - Go to Actions tab
   - Find "Agent Status Auto-Update" workflow
   - Check run history and logs

3. **Verify markers in files**:
```bash
# README should have:
grep "AGENT_STATUS_START" README.md
grep "AGENT_STATUS_END" README.md
```

4. **Check permissions**:
   - GitHub Actions needs write permissions
   - Verify `GITHUB_TOKEN` has access

### Workflow Not Running

**Solutions**:

1. **Check cron schedule**:
   - Workflow runs at 9 PM UTC
   - Convert to your timezone

2. **Manual trigger**:
   - GitHub → Actions → Agent Status Auto-Update
   - Click "Run workflow"

3. **Check workflow syntax**:
```bash
# Validate YAML
cat .github/workflows/agent-status-cron.yml
```

---

## Getting Additional Help

### Quick Diagnostics Script

```bash
#!/bin/bash
echo "🔍 stackBrowserAgent Diagnostics"
echo "================================"

echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Server running: $(curl -s http://localhost:3000/health | grep -q healthy && echo 'Yes' || echo 'No')"
echo "Chrome extension ZIP: $([ -f public/downloads/chrome-extension.zip ] && echo 'Exists' || echo 'Missing')"
echo "Workflow ZIP: $([ -f public/downloads/workflow-builder.zip ] && echo 'Exists' || echo 'Missing')"
```

### Enable Debug Logging

```bash
# Set debug environment variable
DEBUG=* npm start

# More specific debugging
DEBUG=express:*,workstation:* npm start
```

### Collect Support Information

When reporting issues, include:

1. **System info**:
   - OS and version
   - Node.js version
   - npm version

2. **Error details**:
   - Full error message
   - Stack trace
   - Server logs

3. **Steps to reproduce**:
   - What you did
   - What you expected
   - What actually happened

### Support Channels

- 📖 [Documentation](../../README.md)
- 💬 [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)
- 🐛 [Report Bug](https://github.com/creditXcredit/workstation/issues/new)
- 📧 Email: support@stackbrowseragent.com

---

**Last Updated**: 2024-11-22  
**Version**: 1.0.0
