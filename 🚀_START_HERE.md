# 🚀 START HERE - How to Run Workstation

## What This Is
A complete browser automation platform with:
- ✅ Chrome extension with visual UI
- ✅ 32 pre-built workflow templates
- ✅ Visual drag-and-drop workflow builder
- ✅ Backend API server (Node.js/Express)
- ✅ 25+ AI agents for automation

---

## STEP 1: Build the Chrome Extension

```bash
bash ./scripts/build-enterprise-chrome-extension.sh
```

**Output:** `dist/workstation-ai-agent-enterprise-v2.1.0.zip`

**⚡ SHORTCUT:** Production ZIPs are already built! Skip to STEP 2.

---

## STEP 2: Install in Chrome

```bash
cd dist
unzip workstation-ai-agent-enterprise-v2.1.0.zip -d chrome-extension-unpacked
```

Then in Chrome:
1. Go to `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select `dist/chrome-extension-unpacked/`
5. Pin the extension (click puzzle icon → pin the Workstation icon)

---

## STEP 3: Start the Backend Server

### Create .env file

```bash
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-here
SESSION_SECRET=different-session-secret-minimum-32-characters
ENCRYPTION_KEY=encryption-key-exactly-32-characters
DATABASE_URL=postgresql://user:password@localhost:5432/workstation
EOF
```

**🔐 SECURITY NOTE:** For production, generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Install, build, and start

```bash
npm install
npm run build
npm start
```

**Server runs at:** `http://localhost:3000`

**✅ Verify it's running:**
```bash
curl http://localhost:3000/health/live
```

---

## STEP 4: Use the Extension

### Option A: Extension Popup UI
1. Click the extension icon in Chrome toolbar
2. You get 5 tabs:
   - **Execute:** Record actions, type workflows, execute
   - **Builder:** Opens visual workflow builder
   - **Templates:** Browse 32 ready-made workflows
   - **History:** View past executions
   - **Settings:** Configure backend URL

### Option B: Visual Workflow Builder
1. Click extension → "Builder" tab → "Open Builder"
2. OR navigate to: `http://localhost:3000/workflow-builder.html`
3. Drag-and-drop workflow nodes
4. Save and execute

### Option C: Use Templates
1. Extension → "Templates" tab
2. Click any template (Web Scraping, Form Automation, etc.)
3. Template opens in builder
4. Execute immediately or customize

---

## What Each Part Does

| Component | Purpose | Location |
|-----------|---------|----------|
| **Chrome Extension** | UI, browser automation | `chrome-extension/` |
| **Backend Server** | API, workflow execution, agents | `src/` |
| **Workflow Builder** | Visual editor | `public/workflow-builder.html` |
| **Templates** | 32 pre-built workflows | `src/workflow-templates/` |
| **Playwright Features** | Auto-wait, self-healing | `chrome-extension/playwright/` |

---

## Troubleshooting

### Extension shows "Backend offline"
- Make sure backend is running: `npm start`
- Check server: `curl http://localhost:3000/health`
- In extension Settings tab, verify Backend URL is `http://localhost:3000`

### "File does not exist" error
- You're missing `.env` file - see STEP 3 above
- Copy from template: `cp .env.example .env` then edit values

### Templates not loading
- Backend must be running
- Check console: F12 → Console tab
- Verify: `curl http://localhost:3000/api/workflow-templates`

### Build script fails
- Install ImageMagick: `brew install imagemagick` (Mac) or `apt-get install imagemagick` (Linux)
- Or use pre-built ZIP files in `dist/` (skip build step)

### Port 3000 already in use
- Change PORT in `.env` file
- Update Backend URL in extension Settings tab

### Database connection error
- For quick start, comment out DATABASE_URL in `.env`
- App uses SQLite by default (no setup needed)
- For PostgreSQL, ensure database exists and credentials correct

---

## Additional Documentation

- **Chrome Extension:** `chrome-extension/README.md` or `🚀_START_HERE_CHROME_EXTENSION.md`
- **Workflow Templates:** `WORKFLOW_TEMPLATES.md`
- **API Endpoints:** `docs/API_DOCUMENTATION.md` or `API.md`
- **Architecture:** `ARCHITECTURE.md`
- **Getting Started Guide:** `GETTING_STARTED.md`
- **Quick Run:** `QUICK_RUN.md`

---

## Architecture Overview

```
┌─────────────────────┐
│  Chrome Extension   │  ← You click here
│  (Browser UI)       │
└──────────┬──────────┘
           │
           │ WebSocket/REST API
           │
┌──────────▼──────────┐
│  Backend Server     │  ← npm start
│  (Port 3000)        │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
┌────▼────┐ ┌───▼────┐
│Workflow │ │Browser │
│Builder  │ │Agent   │
└─────────┘ └────────┘
```

---

## Quick Commands Reference

```bash
# Backend Server
npm install              # Install dependencies
npm run build           # Compile TypeScript
npm start               # Start server (production)
npm run dev             # Start server (development)
npm test                # Run tests
npm run lint            # Check code quality

# Chrome Extension
bash ./scripts/build-enterprise-chrome-extension.sh  # Build ZIP
bash ./scripts/build-chrome-extension.sh             # Build simple version
npm run build:chrome:enterprise                      # Build via npm

# All-in-One
npm run start:all       # Shows complete setup instructions
```

---

## Next Steps

### Learn More
- Browse the 32 workflow templates in the extension
- Read the [Workflow Templates Guide](WORKFLOW_TEMPLATES.md)
- Check out [example workflows](examples/workflows/)

### Build Your First Workflow
1. Open the Visual Workflow Builder
2. Drag "Navigate" node onto canvas
3. Drag "Extract Data" node onto canvas
4. Connect them together
5. Configure each node
6. Click "Execute"

### Deploy to Production
- See: [Deployment Guide](docs/guides/DEPLOYMENT.md)
- Railway: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/stackbrowseragent)
- Docker: `docker-compose up -d`
- Kubernetes: `kubectl apply -f k8s/`

---

## Need Help?

- 📖 [Complete Documentation Index](docs/DOCUMENTATION_INDEX.md)
- 🐛 [Report Issues](https://github.com/creditXcredit/workstation/issues)
- 💬 [Ask Questions](https://github.com/creditXcredit/workstation/discussions)
- 📧 Check the comprehensive [Getting Started Guide](GETTING_STARTED.md)

---

**NOW GO BUILD SOME WORKFLOWS!** 🚀
