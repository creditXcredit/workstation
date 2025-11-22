# Installation Guide - stackBrowserAgent Workstation

This comprehensive guide walks you through installing the stackBrowserAgent Workstation system and its components.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Install (Recommended)](#quick-install-recommended)
3. [Server Installation](#server-installation)
4. [Chrome Extension Installation](#chrome-extension-installation)
5. [Workflow Builder Setup](#workflow-builder-setup)
6. [Configuration](#configuration)
7. [Verification](#verification)
8. [Next Steps](#next-steps)

---

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **Node.js**: v18.0.0 or higher
- **RAM**: 2GB available
- **Disk Space**: 500MB
- **Browser**: Chrome/Chromium 90+ or Edge 90+

### Recommended Requirements
- **Node.js**: v20.x
- **RAM**: 4GB available
- **Disk Space**: 1GB
- **Internet**: Required for initial setup and package downloads

### Required Software
```bash
# Check Node.js version
node --version  # Should be v18.0.0 or higher

# Check npm version
npm --version   # Should be 8.0.0 or higher

# Check git
git --version   # Should be 2.0.0 or higher
```

---

## Quick Install (Recommended)

The fastest way to get started with pre-built packages:

### Option 1: Download from Dashboard

1. **Clone and start the server**:
```bash
git clone https://github.com/creditXcredit/workstation.git
cd workstation
npm install
npm run build
npm start
```

2. **Open the dashboard**:
- Navigate to `http://localhost:3000/dashboard.html`
- Scroll to the "Quick Downloads" section
- Click download buttons for each component

3. **Install downloaded packages**:
- Follow installation instructions below for each component

### Option 2: Direct Download Links

Once the server is running:

- **Chrome Extension**: [Download](http://localhost:3000/downloads/chrome-extension.zip)
- **Workflow Builder**: [Download](http://localhost:3000/downloads/workflow-builder.zip)

---

## Server Installation

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/creditXcredit/workstation.git
cd workstation
```

### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install

# This may take 2-5 minutes depending on your internet speed
```

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
```

Required environment variables:
```env
# REQUIRED: Set a secure JWT secret (minimum 32 characters)
JWT_SECRET=your-super-secure-secret-key-here-change-this

# OPTIONAL: Customize these if needed
JWT_EXPIRATION=24h
PORT=3000
NODE_ENV=production
```

### Step 4: Build the Application

```bash
# Compile TypeScript and build packages
npm run build

# This creates:
# - dist/ - Compiled TypeScript
# - public/downloads/chrome-extension.zip
# - public/downloads/workflow-builder.zip
```

### Step 5: Start the Server

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

**Expected Output**:
```
✓ Database initialized
✓ Context-Memory Intelligence Layer initialized
Server is running on http://localhost:3000
🚀 Press Ctrl+C to stop
```

### Step 6: Verify Server

```bash
# In a new terminal
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"..."}
```

---

## Chrome Extension Installation

### Method 1: One-Click Download (Recommended)

1. **Download the extension**:
   - Open `http://localhost:3000/dashboard.html`
   - Find "Quick Downloads" section
   - Click "Download chrome-extension.zip"
   - Save file to your computer

2. **Extract the ZIP**:
```bash
# On macOS/Linux
unzip ~/Downloads/chrome-extension.zip -d ~/chrome-extension

# On Windows (PowerShell)
Expand-Archive -Path "$env:USERPROFILE\Downloads\chrome-extension.zip" -DestinationPath "$env:USERPROFILE\chrome-extension"
```

3. **Load in Chrome**:
   - Open Chrome/Edge
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extracted `chrome-extension` folder
   - Extension icon should appear in toolbar

4. **Verify installation**:
   - Click extension icon
   - Should show "stackBrowserAgent" popup
   - Connection status should show "Connected"

### Method 2: Build from Source

```bash
# Build extension locally
npm run build:chrome

# Extension will be in: build/chrome-extension/

# Load in Chrome:
# 1. chrome://extensions/
# 2. Enable "Developer mode"
# 3. Load unpacked: build/chrome-extension/
```

### Troubleshooting Extension Installation

**Issue**: "Extension failed to load"
- **Solution**: Check that `manifest.json` exists in the folder
- Verify Chrome version is 90 or higher

**Issue**: "Connection failed"
- **Solution**: Ensure server is running on localhost:3000
- Check server logs for errors

**Issue**: "Extension not showing in toolbar"
- **Solution**: Right-click toolbar → Manage extensions → Pin extension

---

## Workflow Builder Setup

### Method 1: Standalone Download

1. **Download workflow builder**:
   - From dashboard: Click "Download workflow-builder.zip"
   - Extract ZIP file
   - Open `workflow-builder.html` in Chrome

2. **Configure connection**:
   - Builder will connect to `http://localhost:3000` automatically
   - If server is on different port, update connection string

### Method 2: Access via Server

Simply navigate to:
```
http://localhost:3000/workflow-builder.html
```

No installation needed!

### Creating Your First Workflow

1. **Open workflow builder**
2. **Drag and drop nodes** from left panel to canvas
3. **Connect nodes** by dragging between connection points
4. **Configure node properties** by selecting nodes
5. **Save workflow** with the Save button
6. **Execute workflow** with the Execute button

---

## Configuration

### JWT Authentication

For production use, always set a strong JWT secret:

```bash
# Generate a secure random secret (recommended)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env file
JWT_SECRET=<generated-secret>
```

### Port Configuration

Change the default port:

```env
PORT=8080
```

Then restart:
```bash
npm start
```

### Database Configuration

Default is SQLite (zero configuration). For PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/workstation
```

### CORS Configuration

Allow specific origins:

```env
ALLOWED_ORIGINS=https://myapp.com,https://app.myapp.com
```

---

## Verification

### Server Health Check

```bash
# Basic health check
curl http://localhost:3000/health

# Get demo token
curl http://localhost:3000/auth/demo-token

# Test protected endpoint
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/protected
```

### Extension Verification

1. Open extension popup
2. Check connection status
3. Try executing a simple navigation command:
   ```
   Navigate to google.com
   ```

### Workflow Builder Verification

1. Open workflow builder
2. Create a simple workflow:
   - Add Start node
   - Add Navigate node (URL: google.com)
   - Add End node
   - Connect nodes
3. Click Execute
4. Check execution status

---

## Next Steps

### 📚 Learn More

- [How to Use Guide](../../HOW_TO_USE.md) - Detailed usage instructions
- [API Documentation](../../API.md) - Complete API reference
- [Architecture Guide](../../ARCHITECTURE.md) - System design details

### 🚀 Deploy to Production

- [Railway Deployment](../../docs/deployment/railway.md) - One-click deploy
- [Docker Deployment](../../docs/deployment/docker.md) - Container setup
- [Manual Deployment](../../docs/deployment/manual.md) - Traditional hosting

### 🔧 Development

- [Contributing Guide](../../CONTRIBUTING.md) - How to contribute
- [Development Setup](../../docs/development/setup.md) - Dev environment
- [Testing Guide](../../TEST_CASES.md) - Run tests

### 💡 Examples

- [Example Workflows](../../examples/workflows/) - Pre-built workflows
- [Chrome Extension Examples](../../chrome-extension/examples/) - Sample automations
- [API Examples](../../examples/api/) - Code samples

---

## Getting Help

### Documentation
- 📖 [Complete Documentation](../../README.md)
- ❓ [FAQ](../../docs/FAQ.md)
- 🐛 [Troubleshooting Guide](./TROUBLESHOOTING.md)

### Community
- 💬 [GitHub Discussions](https://github.com/creditXcredit/workstation/discussions)
- 🐛 [Report Issues](https://github.com/creditXcredit/workstation/issues)
- 📧 Email: support@stackbrowseragent.com

### Support
- Free: Community support via GitHub
- Priority: Enterprise support available

---

## Appendix

### A. System Architecture

```
┌─────────────────────────────────────────┐
│         stackBrowserAgent               │
│                                         │
│  ┌──────────┐  ┌──────────────────┐   │
│  │  Chrome  │  │  Workflow Builder │   │
│  │Extension │  └──────────────────┘   │
│  └──────────┘                          │
│       ↓                ↓                │
│  ┌─────────────────────────────────┐  │
│  │      Express.js API Server       │  │
│  │  (JWT Auth, Rate Limiting)       │  │
│  └─────────────────────────────────┘  │
│       ↓                                 │
│  ┌─────────────────────────────────┐  │
│  │    Playwright Browser Engine     │  │
│  └─────────────────────────────────┘  │
│       ↓                                 │
│  ┌─────────────────────────────────┐  │
│  │      SQLite/PostgreSQL DB        │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### B. Directory Structure

```
workstation/
├── src/                  # TypeScript source
│   ├── auth/            # JWT authentication
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   └── automation/      # Browser automation
├── public/              # Static files
│   ├── dashboard.html   # Main dashboard
│   ├── workflow-builder.html
│   ├── downloads/       # Generated packages
│   └── js/              # Client-side JS
├── chrome-extension/    # Extension source
├── scripts/             # Build & utility scripts
├── tests/               # Test suites
└── docs/                # Documentation
```

### C. Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run lint            # Run linter
npm test                # Run tests

# Building
npm run build           # Full build
npm run build:chrome    # Build extension only
npm run build:workflow  # Build workflow builder

# Production
npm start               # Start server
npm run verify          # Health checks

# Maintenance
npm run update:agents   # Update agent status
npm audit               # Security audit
```

---

**Last Updated**: 2024-11-22  
**Version**: 1.0.0  
**Maintained by**: stackBrowserAgent Team
