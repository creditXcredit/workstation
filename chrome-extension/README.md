# Workstation Chrome Extension

## 🚀 Quick Install

**3 simple steps:**

1. **Open Chrome:** Navigate to `chrome://extensions/`
2. **Enable Developer mode:** Toggle in top-right corner
3. **Load unpacked:** Click button and select the `chrome-extension/` folder

✅ **Done!** Click the extension icon to start automating.

**Need help?** See [HOW_TO_USE.md](../HOW_TO_USE.md) for step-by-step guide.

---

## Overview

The Workstation Chrome Extension enables browser automation through a user-friendly popup interface. It integrates with the Workstation API backend to execute workflows using natural language descriptions.

## Features

- **Natural Language Automation**: Describe what you want to automate in plain English
- **Visual Action Recording**: Record user interactions (clicks, typing, navigation) for workflow creation
- **JWT Authentication**: Secure communication with the Workstation backend
- **Real-time Execution**: Execute workflows immediately and see results
- **Error Handling**: Comprehensive error messages and status indicators

## Installation

### Prerequisites

1. **Workstation Backend Running**: The backend must be running on `http://localhost:3000`
   ```bash
   npm run dev
   ```

2. **Chrome Browser**: Chrome or any Chromium-based browser (Edge, Brave, etc.)

### Steps

1. **Build the Extension**:
   ```bash
   npm run build:chrome
   ```

2. **Load in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right corner)
   - Click "Load unpacked"
   - Select the directory: `build/chrome-extension/`

3. **Verify Installation**:
   - The Workstation icon should appear in your extensions toolbar
   - Click the icon to open the popup
   - The extension will automatically fetch a JWT token from the backend

## Usage

### Basic Workflow Execution

1. Click the Workstation extension icon
2. Enter a description in the textarea, for example:
   ```
   Navigate to https://example.com and take a screenshot
   ```
3. Click "🚀 Execute Workflow"
4. View the results in the popup

### Recording Actions

1. Click the "⏺️ Record" button
2. Interact with the web page (click, type, navigate)
3. Click "⏹️ Stop" to finish recording
4. The recorded actions are stored and can be used for workflow creation

### Clearing Recorded Actions

Click the "🗑️ Clear" button to remove all recorded actions from storage.

## Architecture

### Files

```
chrome-extension/
├── manifest.json          # Chrome Extension manifest (v3)
├── background.js          # Service worker for API communication
├── content.js             # Content script for action recording
├── popup/
│   ├── index.html        # Popup UI
│   └── script.js         # Popup logic and interaction
└── icons/
    ├── icon16.png        # Extension icon (16x16)
    ├── icon48.png        # Extension icon (48x48)
    └── icon128.png       # Extension icon (128x128)
```

### Communication Flow

```
┌─────────────────┐
│  Chrome Popup   │
│  (popup/*)      │
└────────┬────────┘
         │
         ├─ Message ─→ ┌─────────────────────┐
         │             │  Background Worker  │
         │             │  (background.js)    │
         │             └──────────┬──────────┘
         │                        │
         │                        ├─ HTTP ─→ ┌──────────────────┐
         │                        │           │ Workstation API  │
         │                        │           │ (localhost:3000) │
         │                        │           └──────────────────┘
         │                        │
         ↓                        ↓
┌─────────────────┐    ┌──────────────────────┐
│  Content Script │ ←─ │  chrome.tabs API     │
│  (content.js)   │    └──────────────────────┘
└─────────────────┘
```

### API Integration

The extension communicates with these backend endpoints:

- **GET /auth/demo-token**: Fetches JWT authentication token
- **POST /api/v2/execute**: Creates and executes workflows from descriptions

#### Example API Request

```javascript
POST /api/v2/execute
Headers:
  Authorization: Bearer <jwt-token>
  Content-Type: application/json

Body:
{
  "description": "Navigate to https://example.com and take a screenshot",
  "actions": [],  // Optional: pre-recorded actions
  "variables": {} // Optional: workflow variables
}
```

#### Example API Response

```json
{
  "success": true,
  "data": {
    "workflow": {
      "id": "wf_abc123",
      "name": "Navigate to https://example.com and take a screenshot",
      "status": "active"
    },
    "execution": {
      "id": "exec_xyz789",
      "workflow_id": "wf_abc123",
      "status": "running"
    }
  },
  "message": "Workflow created and execution started"
}
```

## Development

### Building

Build the extension after making changes:

```bash
npm run build:chrome
```

### Testing

Validate the build:

```bash
npm run test:chrome
```

This checks:
- All required files exist
- manifest.json is valid
- File sizes are reasonable

### Debugging

1. **Background Service Worker**:
   - Open `chrome://extensions/`
   - Find "Workstation AI Agent"
   - Click "Inspect views: background page"
   - View console logs

2. **Popup**:
   - Right-click the extension icon
   - Select "Inspect"
   - View console logs

3. **Content Script**:
   - Open Developer Tools on any webpage (F12)
   - View console logs
   - Content script logs are prefixed with ⏺️ or ⏹️

### Common Issues

#### "Token fetch failed"

**Cause**: Backend is not running or not accessible.

**Solution**: Start the backend with `npm run dev` and ensure it's running on port 3000.

#### "Workflow execution failed"

**Cause**: Invalid workflow description or API error.

**Solution**: Check the error message in the popup. Common issues:
- Backend database not initialized
- Invalid JWT token
- Malformed request

#### "Extension not loading"

**Cause**: Invalid manifest or missing files.

**Solution**: 
1. Run `npm run build:chrome` again
2. Run `npm run test:chrome` to validate
3. Check console for specific errors

## Security

### Token Storage

JWT tokens are stored in Chrome's local storage using `chrome.storage.local`. This is isolated per-extension and not accessible by web pages.

### CORS Configuration

The backend must allow requests from the Chrome extension. The extension uses:
- `host_permissions: ["<all_urls>", "http://localhost:3000/*"]`

Ensure your backend CORS configuration allows these origins in development.

### Content Security Policy

The extension uses:
- `manifest_version: 3` (latest and most secure)
- Service worker for background tasks
- Content scripts run in isolated context

## Roadmap

### v1.1 Features ✅ IMPLEMENTED
- [x] Workflow history in popup - View past workflows with status
- [x] Save and reuse workflows - Persistent workflow storage
- [x] Execution status polling - Real-time status updates
- [x] Error retry mechanism - Integrated into UI with automatic retries
- [x] Settings page for backend URL configuration
- [x] Configurable poll interval for status updates

### v1.2 Features ✅ IMPLEMENTED
- [x] Workflow templates library - Pre-built automation examples (5 templates)
- [x] Template categories (search, forms, capture, extraction, authentication)
- [x] Click-to-load templates
- [ ] Multiple workspace support (Future)
- [ ] Export/Import workflows (Future)

### v2.0 Features (Planned)
- [ ] AI-powered workflow suggestions
- [ ] Browser action automation preview
- [ ] Collaborative workflow sharing
- [ ] Chrome Web Store publication

## v1.1 & v1.2 Features Overview

### Workflow History
- **View Past Executions**: See all previously executed workflows
- **Status Tracking**: Each workflow shows its status (success, error, running, saved)
- **Quick Reload**: Click any history item to load it into the execute tab
- **Timestamps**: Human-readable timestamps (e.g., "5 minutes ago", "2 hours ago")
- **Clear History**: Option to clear all history

### Save & Load Workflows  
- **Save for Later**: Save workflow descriptions without executing them
- **Reuse Workflows**: Reload saved workflows with a single click
- **Persistent Storage**: Workflows stored in Chrome's local storage

### Real-Time Status Polling
- **Live Updates**: Automatically polls backend for execution status
- **Progress Tracking**: Shows execution progress percentage when available
- **Configurable Interval**: Adjust polling frequency in settings (500ms - 10s)
- **Auto-Stop**: Polling stops when workflow completes or fails

### Settings Page
- **Backend URL**: Configure custom backend URL (default: http://localhost:3000)
- **Poll Interval**: Adjust how often to check execution status (default: 2000ms)
- **Auto-Retry**: Enable/disable automatic retry on failure (default: enabled)
- **Persistent Settings**: Settings saved to Chrome storage

### Workflow Templates (NEW!)
- **5 Pre-Built Templates**: Ready-to-use automation workflows
- **Categories**: search, forms, capture, extraction, authentication
- **Click-to-Load**: Load template into execute tab with one click
- **Customizable Variables**: Each template includes configurable variables
- **Backend Integration**: Templates fetched from `/api/v2/templates` endpoint

**Available Templates:**
1. **Google Search** - Search Google and take a screenshot
2. **Form Filler** - Navigate and fill out forms automatically
3. **Screenshot Capture** - Navigate to URL and capture full-page screenshot
4. **Data Extractor** - Extract text content from webpages
5. **Login Flow** - Automated login workflow with credentials

## Updated Usage

### Using Templates

1. Click "Templates" tab
2. Browse available templates by category
3. Click any template to load it
4. Template description loads into Execute tab
5. Customize variables if needed
6. Click "Execute Workflow"

### Using the History Tab

1. Click "History" tab to view all workflows
2. Each item shows:
   - Workflow description
   - Status badge (success, error, running, saved)
   - Timestamp
3. Click any item to load it into the execute tab
4. Use "Clear All" to remove all history

### Saving Workflows

1. Enter workflow description in the Execute tab
2. Click "💾 Save" button (no execution)
3. Workflow saved to history with "saved" status
4. Access later from History tab

### Configuring Settings

1. Click "Settings" tab
2. Modify:
   - Backend URL (e.g., for production deployment)
   - Status Poll Interval (in milliseconds)
   - Auto-Retry toggle
3. Click "💾 Save Settings"
4. Settings applied immediately

### Real-Time Execution Monitoring

When you execute a workflow:
1. Workflow immediately added to history with "running" status
2. Extension polls backend every N milliseconds (configurable)
3. Status updates shown in real-time:
   - "⏳ Running... (25%)"
   - "⏳ Running... (50%)"
   - "✅ Workflow completed successfully!"
4. Final status saved to history

## Roadmap

### v1.1 (Planned)
- [ ] Workflow history in popup
- [ ] Save and reuse workflows
- [ ] Execution status polling
- [ ] Error retry mechanism

### v1.2 (Planned)
- [ ] Settings page for backend URL configuration
- [ ] Multiple workspace support
- [ ] Workflow templates library

### v2.0 (Future)
- [ ] AI-powered workflow suggestions
- [ ] Browser action automation preview
- [ ] Collaborative workflow sharing
- [ ] Chrome Web Store publication

## Contributing

1. Make changes to files in `chrome-extension/`
2. Build: `npm run build:chrome`
3. Test: `npm run test:chrome`
4. Reload extension in Chrome
5. Verify changes work as expected

## License

MIT - See LICENSE file in repository root
