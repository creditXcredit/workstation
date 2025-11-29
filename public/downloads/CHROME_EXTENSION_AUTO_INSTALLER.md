# Chrome Extension Auto-Installer

## 📦 One-Click Automated Installation

This script automatically downloads, builds, and deploys the Workstation Chrome Extension in developer mode.

## 🚀 Quick Start

### Method 1: Direct Download from Dashboard

1. Go to `http://localhost:3000/dashboard.html`
2. Click **"Download Installer"** button in the Auto-Installer card
3. Run the downloaded script:
   ```bash
   bash install-chrome-extension.sh
   ```

### Method 2: Download via curl

```bash
curl -fsSL https://raw.githubusercontent.com/creditXcredit/workstation/main/public/downloads/install-chrome-extension.sh -o install-chrome-extension.sh
bash install-chrome-extension.sh
```

### Method 3: Direct Execution (Not Recommended for Production)

```bash
curl -fsSL https://raw.githubusercontent.com/creditXcredit/workstation/main/public/downloads/install-chrome-extension.sh | bash
```

## ✨ What It Does

The auto-installer performs the following steps automatically:

1. ✅ **Checks prerequisites** - Node.js 18+, Git, Chrome/Chromium
2. ✅ **Creates installation directory** - `~/.workstation-chrome`
3. ✅ **Clones repository** - Downloads latest Workstation code
4. ✅ **Installs dependencies** - Runs `npm install`
5. ✅ **Builds extension** - Compiles Chrome extension
6. ✅ **Starts backend server** - Launches API server on port 3000
7. ✅ **Opens Chrome** - Launches `chrome://extensions/` page
8. ✅ **Creates helper scripts** - Reload, start, stop scripts

## 📋 Requirements

### System Requirements
- **OS**: Linux, macOS, or Windows (WSL)
- **Node.js**: Version 18 or higher
- **Git**: Any recent version
- **Chrome**: Or any Chromium-based browser

### Disk Space
- Minimum: 500 MB
- Recommended: 1 GB

## 🔧 Post-Installation

After running the installer, complete these final steps in Chrome:

1. Navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select directory: `~/.workstation-chrome/build/chrome-extension`
5. Click **"Select"**

✅ Done! The extension icon appears in your Chrome toolbar.

## 📂 Installation Directory

The installer creates the following structure in `~/.workstation-chrome`:

```
~/.workstation-chrome/
├── chrome-extension/        # Source code
├── build/
│   └── chrome-extension/    # Built extension (load this in Chrome)
├── backend.log              # Backend server logs
├── backend.pid              # Backend process ID
├── install.log              # Installation log
├── reload-extension.sh      # Quick reload script
├── start-backend.sh         # Start backend script
└── stop-backend.sh          # Stop backend script
```

## 🔄 Helper Scripts

The installer creates convenience scripts:

### Reload Extension
```bash
~/.workstation-chrome/reload-extension.sh
```
Rebuilds the extension. Then reload it in Chrome at `chrome://extensions/`.

### Start Backend
```bash
~/.workstation-chrome/start-backend.sh
```
Starts the backend server on port 3000.

### Stop Backend
```bash
~/.workstation-chrome/stop-backend.sh
```
Stops the running backend server.

## 🌐 Backend Server

The installer automatically starts the backend server:

- **URL**: http://localhost:3000
- **Logs**: `~/.workstation-chrome/backend.log`
- **PID**: Stored in `backend.pid`

To check if backend is running:
```bash
lsof -i :3000
```

## 🎯 Using the Extension

1. **Click the extension icon** in Chrome toolbar
2. **4 tabs available**:
   - **Execute** - Run workflows
   - **Builder** - Visual workflow editor  
   - **Templates** - Pre-built workflows
   - **History** - Past executions

3. **Quick test workflow**:
   ```
   Navigate to https://example.com and take a screenshot
   ```

## 🐛 Troubleshooting

### Extension doesn't load
- Check Chrome console for errors (`chrome://extensions/`)
- Verify directory path is correct
- Try reloading the extension

### Backend server fails to start
- Check if port 3000 is already in use: `lsof -i :3000`
- View backend logs: `cat ~/.workstation-chrome/backend.log`
- Manually start: `cd ~/.workstation-chrome && npm start`

### Prerequisites not met
- **Node.js**: Install from https://nodejs.org/
- **Git**: Install via package manager (`apt`, `brew`, etc.)
- **Chrome**: Download from https://www.google.com/chrome/

### Installation fails
- Check installation log: `~/.workstation-chrome/install.log`
- Ensure stable internet connection
- Verify disk space availability
- Try manual installation (see README.md)

## 🔒 Security Notes

- Script requires write access to `~/.workstation-chrome`
- Backend server runs on localhost only (not exposed externally)
- Always review scripts before running with curl/bash
- Extension runs in developer mode (not signed)

## 📝 Logs

All logs are saved in the installation directory:

- **Installation log**: `install.log`
- **Backend log**: `backend.log`

View logs:
```bash
# Installation log
cat ~/.workstation-chrome/install.log

# Backend log
tail -f ~/.workstation-chrome/backend.log
```

## 🗑️ Uninstall

To completely remove the installation:

```bash
# Stop backend
~/.workstation-chrome/stop-backend.sh

# Remove installation directory
rm -rf ~/.workstation-chrome

# Remove extension from Chrome
# Go to chrome://extensions/ and click "Remove"
```

## 🆘 Support

- **Issues**: https://github.com/creditXcredit/workstation/issues
- **Documentation**: See repository README.md
- **Extension docs**: chrome-extension/README.md

## 📜 License

ISC License - See LICENSE file in repository

---

**Generated by Workstation Auto-Installer**  
**Version**: 1.0.0  
**Last Updated**: 2025-11-27
