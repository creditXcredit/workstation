# Reassembly Guide - stackBrowserAgent

## Overview

This guide provides detailed instructions for reassembling the stackBrowserAgent project from scratch in any environment. It covers everything from initial setup to deployment.

## Prerequisites Checklist

Before beginning reassembly, ensure you have:

- [ ] Node.js v18.0.0 or higher installed
- [ ] npm v9.0.0 or higher installed
- [ ] Git installed and configured
- [ ] Internet connection for downloading dependencies
- [ ] Sufficient disk space (minimum 1GB for dependencies)
- [ ] Operating system: Linux, macOS, or Windows

## Step-by-Step Reassembly

### Phase 1: Repository Setup

#### 1.1 Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/stackconsult/stackBrowserAgent.git

# Navigate to project directory
cd stackBrowserAgent

# Verify files
ls -la
```

**Expected files:**
- `package.json`
- `tsconfig.json`
- `src/` directory
- `extensions/` directory
- `docs/` directory
- `README.md`
- `LICENSE`

#### 1.2 Verify Git Configuration

```bash
# Check remote
git remote -v

# Check current branch
git branch

# View commit history
git log --oneline -5
```

### Phase 2: Dependency Installation

#### 2.1 Install Node Dependencies

```bash
# Install all dependencies
npm install
```

This installs:
- **Production dependencies:**
  - `puppeteer` - Browser automation
  - `winston` - Logging
  - `dotenv` - Environment configuration
  - `express` - Web server (optional)
  - `ws` - WebSocket support

- **Development dependencies:**
  - `typescript` - Type system
  - `ts-node` - TypeScript execution
  - `tsx` - Fast TypeScript execution
  - `jest` - Testing framework
  - `eslint` - Code linting
  - `prettier` - Code formatting
  - Type definitions (@types/*)

#### 2.2 Verify Installation

```bash
# Check installed packages
npm list --depth=0

# Verify Chromium download
npx puppeteer browsers list
```

**Expected output:**
```
chrome@<version> /path/to/.cache/puppeteer/chrome/...
```

If Chromium is not downloaded:
```bash
npx puppeteer browsers install chrome
```

### Phase 3: Configuration

#### 3.1 Create Environment File

Create `.env` in project root:

```bash
# Create .env file
cat > .env << 'EOF'
# Browser Configuration
HEADLESS=false
DEVTOOLS=false
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# Extensions
EXTENSIONS_PATH=./extensions

# Logging
LOG_LEVEL=info

# Server
SERVER_PORT=3000
SERVER_HOST=localhost
EOF
```

#### 3.2 Verify Configuration Files

Check that these files exist:
- `.env` - Environment variables
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.js` - ESLint configuration
- `.prettierrc.js` - Prettier configuration
- `jest.config.js` - Jest configuration
- `.gitignore` - Git ignore rules

### Phase 4: Project Build

#### 4.1 Type Check

```bash
# Verify TypeScript compiles without errors
npm run typecheck
```

**Expected output:**
```
✓ No errors found
```

#### 4.2 Build Project

```bash
# Clean previous build
npm run clean

# Build TypeScript to JavaScript
npm run build
```

**Expected output:**
```
dist/
├── agent/
│   ├── index.js
│   ├── browser.js
│   ├── session.js
│   └── commands/
├── extensions/
├── types/
├── utils/
└── index.js
```

#### 4.3 Verify Build Output

```bash
# Check dist directory
ls -R dist/

# Verify main entry point
node -e "require('./dist/index.js')"
```

### Phase 5: Extension Setup

#### 5.1 Verify Extension Structure

```bash
# List extensions
ls -la extensions/

# Check example extension
ls -la extensions/example-extension/
```

**Expected files in each extension:**
- `manifest.json` - Extension manifest
- `background.js` - Background script
- `content.js` - Content script
- `popup.html` - Popup UI (optional)
- `popup.js` - Popup script (optional)

#### 5.2 Validate Extension Manifests

```bash
# Validate JSON syntax
for dir in extensions/*/; do
  echo "Validating $dir"
  node -e "JSON.parse(require('fs').readFileSync('$dir/manifest.json', 'utf8'))"
done
```

### Phase 6: Testing

#### 6.1 Run Unit Tests

```bash
# Run all tests
npm test
```

#### 6.2 Run Linting

```bash
# Check code quality
npm run lint

# Auto-fix issues
npm run lint:fix
```

#### 6.3 Run Formatting

```bash
# Check formatting
npm run format:check

# Format code
npm run format
```

### Phase 7: First Run

#### 7.1 Development Mode

```bash
# Run in development mode with hot-reload
npm run dev
```

**Expected output:**
```
Starting Browser Agent...
Browser launched successfully
Browser version: Chrome/120.0.6099.109
Session ID: <uuid>
Extensions loaded: 1
  - Example Browser Agent Extension v1.0.0
Browser Agent started successfully
```

#### 7.2 Production Mode

```bash
# Build and run
npm run build
npm start
```

**Expected behavior:**
1. Browser launches (visible window if headless=false)
2. Extensions load automatically
3. Agent navigates to example.com
4. Process continues running
5. Press Ctrl+C to stop

### Phase 8: Verification

#### 8.1 Manual Verification Checklist

- [ ] Browser launches successfully
- [ ] Extensions appear in browser toolbar
- [ ] Example extension shows indicator on pages
- [ ] Logs appear in console
- [ ] Navigation commands work
- [ ] Screenshot commands work
- [ ] No error messages in console
- [ ] Clean shutdown on Ctrl+C

#### 8.2 Extension Verification

1. Open browser DevTools (F12)
2. Go to Extensions (chrome://extensions)
3. Verify extension is loaded
4. Check "Developer mode" to see details
5. Click extension icon to open popup
6. Test extension functionality

#### 8.3 Log Verification

Check logs for:
- Session startup messages
- Extension loading messages
- Command execution logs
- No error stack traces

### Phase 9: Common Issues and Solutions

#### Issue: Chromium Not Found

**Error:** `Error: Could not find Chromium`

**Solution:**
```bash
# Manually install Chromium
npx puppeteer browsers install chrome

# Or specify custom path
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

#### Issue: Extensions Not Loading

**Error:** Extensions directory not found or extensions not visible

**Solution:**
```bash
# Check extensions path
ls -la extensions/

# Verify manifest.json exists
cat extensions/example-extension/manifest.json

# Set headless to false (extensions require headed mode)
# In .env:
HEADLESS=false
```

#### Issue: TypeScript Compilation Errors

**Error:** TypeScript errors during build

**Solution:**
```bash
# Update TypeScript
npm install typescript@latest --save-dev

# Clean and rebuild
npm run clean
npm run build

# Check for type errors
npm run typecheck
```

#### Issue: Permission Denied (Linux)

**Error:** Browser launch fails with permission errors

**Solution:**
```bash
# Install required dependencies (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install -y \
  chromium-browser \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils

# Run with no-sandbox flag
# In .env or code:
args: ['--no-sandbox', '--disable-setuid-sandbox']
```

#### Issue: Port Already in Use

**Error:** Server port 3000 already in use

**Solution:**
```bash
# Change port in .env
SERVER_PORT=3001

# Or kill existing process
lsof -ti:3000 | xargs kill -9
```

### Phase 10: Directory Structure Validation

After reassembly, verify the complete structure:

```
stackBrowserAgent/
├── .git/                  # Git repository
├── .github/               # GitHub workflows (future)
├── node_modules/          # Dependencies (generated)
├── dist/                  # Build output (generated)
├── src/                   # Source code
│   ├── agent/
│   │   ├── index.ts
│   │   ├── browser.ts
│   │   ├── session.ts
│   │   └── commands/
│   │       ├── base.ts
│   │       ├── navigate.ts
│   │       ├── screenshot.ts
│   │       └── index.ts
│   ├── extensions/
│   │   └── loader.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   └── logger.ts
│   └── index.ts
├── extensions/            # Browser extensions
│   └── example-extension/
│       ├── manifest.json
│       ├── background.js
│       ├── content.js
│       ├── popup.html
│       └── popup.js
├── tests/                 # Test files
│   ├── unit/
│   └── integration/
├── docs/                  # Documentation
│   ├── setup.md
│   ├── architecture.md
│   └── reassembly.md
├── scripts/               # Build scripts
├── config/                # Configuration
├── .env                   # Environment variables
├── .gitignore            # Git ignore
├── .eslintrc.js          # ESLint config
├── .prettierrc.js        # Prettier config
├── jest.config.js        # Jest config
├── tsconfig.json         # TypeScript config
├── package.json          # Dependencies
├── package-lock.json     # Lock file
├── README.md             # Overview
├── LICENSE               # License
└── REPOSITORY_ASSESSMENT.md  # Assessment doc
```

### Phase 11: Post-Reassembly Checklist

Complete checklist after reassembly:

#### Repository
- [ ] Repository cloned successfully
- [ ] Git configuration verified
- [ ] All branches pulled

#### Dependencies
- [ ] npm install completed without errors
- [ ] Chromium downloaded by Puppeteer
- [ ] No dependency vulnerabilities (check with `npm audit`)

#### Configuration
- [ ] .env file created and configured
- [ ] All config files present
- [ ] Paths correctly set for environment

#### Build
- [ ] TypeScript compiles without errors
- [ ] Build output generated in dist/
- [ ] No build warnings

#### Extensions
- [ ] Extensions directory exists
- [ ] Example extension present
- [ ] Manifest files valid JSON
- [ ] Extensions load in browser

#### Testing
- [ ] Linting passes
- [ ] Tests pass (if any)
- [ ] Formatting passes

#### Execution
- [ ] Development mode runs
- [ ] Production mode runs
- [ ] Browser launches successfully
- [ ] Commands execute correctly
- [ ] Clean shutdown works

#### Documentation
- [ ] README.md reviewed
- [ ] Setup guide reviewed
- [ ] Architecture docs available
- [ ] Reassembly guide (this document) verified

## Deployment Scenarios

### Local Development Machine

1. Follow all phases above
2. Use development mode: `npm run dev`
3. Configure headless=false for visual feedback
4. Enable DevTools for debugging

### CI/CD Pipeline

```yaml
# Example GitHub Actions workflow
name: Build and Test

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm test
```

### Docker Container

```dockerfile
FROM node:18-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

ENV HEADLESS=true
ENV DEVTOOLS=false

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t stack-browser-agent .
docker run -p 3000:3000 stack-browser-agent
```

### Production Server

1. Clone repository
2. Set production environment variables
3. Install dependencies: `npm ci` (uses lock file)
4. Build: `npm run build`
5. Use process manager: `pm2 start dist/index.js`
6. Set up monitoring and logging
7. Configure auto-restart on failure

### Cloud Deployment

#### AWS Lambda

1. Use Puppeteer Lambda Layer
2. Set headless=true
3. Configure memory >= 1024MB
4. Set timeout >= 30 seconds

#### Google Cloud Run

1. Use Docker container
2. Configure min/max instances
3. Set up health checks
4. Enable Cloud Logging

#### Kubernetes

1. Create Docker image
2. Deploy as Deployment
3. Configure resource limits
4. Set up horizontal pod autoscaling

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for outdated packages
npm outdated

# Update to latest versions
npx npm-check-updates -u
npm install
```

### Security Updates

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Force fix (may break things)
npm audit fix --force
```

### Backup

Important items to backup:
- Source code (git repository)
- Extensions
- Configuration files (.env, config/)
- User data directory (if using persistent profiles)
- Logs (for debugging)

## Conclusion

Following this guide ensures a complete and functional reassembly of the stackBrowserAgent project. The modular architecture makes it easy to set up in any environment, from local development to production deployment.

For issues not covered here, consult:
- GitHub Issues
- Architecture Documentation
- Setup Guide
- Community Forums
