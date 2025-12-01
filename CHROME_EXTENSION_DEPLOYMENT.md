# Chrome Extension Deployment Guide

## Quick Start

The Chrome Extension is now packaged and ready for deployment to the Chrome Web Store.

### Pre-built Package

**Production ZIP File**: `dist/workstation-ai-agent-v2.1.0.zip` (96KB)

This file is ready to upload to the Chrome Web Store.

---

## Building the Extension

### Option 1: Use Pre-built Package (Recommended)

The extension is already built and available at:
```
dist/workstation-ai-agent-v2.1.0.zip
```

### Option 2: Build from Source

```bash
# Build the extension
npm run build:chrome

# Or use the alias
npm run package:chrome
```

This will:
1. Clean previous builds
2. Copy extension files to `build/chrome-extension/`
3. Remove development files (README, etc.)
4. Validate manifest.json
5. Create ZIP package at `dist/workstation-ai-agent-v2.1.0.zip`

---

## Deploying to Chrome Web Store

### Prerequisites

1. **Google Account**: You need a Google account
2. **Developer Account**: Register at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - One-time registration fee: $5 USD
3. **Extension Package**: Use `dist/workstation-ai-agent-v2.1.0.zip`

### Step-by-Step Deployment

#### 1. Access Developer Dashboard

Go to: https://chrome.google.com/webstore/devconsole

#### 2. Create New Item

- Click **"New Item"** button
- Upload `dist/workstation-ai-agent-v2.1.0.zip`
- Wait for upload to complete (~5-10 seconds)

#### 3. Fill Store Listing

**Required Information:**

**Product Details:**
- **Name**: Workstation AI Agent
- **Summary**: Enterprise browser automation with 25+ AI agents, MCP sync, and auto-update
- **Description**:
```
Enterprise-grade browser automation platform with 25+ specialized AI agents, real-time MCP synchronization, and intelligent auto-update capabilities.

Features:
• 25+ AI Agents for comprehensive automation
• MCP Sync with compression (60-80% storage reduction)
• Auto-update system with rollback
• Error reporting with Sentry integration
• Real-time workflow execution
• Browser automation with Playwright
• Data extraction and transformation
• Form filling and interaction
• Performance monitoring

Perfect for:
- Business process automation
- Web scraping and data extraction
- Workflow automation
- Browser testing
- Data enrichment
```

**Category**: Productivity

**Language**: English (United States)

**Icons & Screenshots:**
- Small icon (128x128): `chrome-extension/icons/icon128.png`
- Promotional images (1280x800): Required for featured listing
- Screenshots (1280x800 or 640x400): At least 1 required

#### 4. Privacy Practices

**Privacy Policy URL**: Add your privacy policy URL
- Required for extensions with user data access
- Sample: "This extension does not collect personal data. All data is stored locally in your browser."

**Permissions Justification**:
- `activeTab`: Required for browser automation and content extraction
- `storage`: Required for MCP sync state and settings persistence
- `scripting`: Required for injecting automation scripts
- `notifications`: Required for update alerts and workflow status
- `<all_urls>`: Required for universal automation capabilities

**Single Purpose**:
```
This extension provides enterprise browser automation with AI agents for workflow automation, data extraction, and process optimization.
```

#### 5. Distribution

**Visibility**: Choose one:
- **Public**: Available to everyone (recommended)
- **Unlisted**: Only accessible via direct link
- **Private**: Only for specific users/domains

**Pricing**: Free

#### 6. Submit for Review

- Click **"Submit for Review"**
- Initial review typically takes 1-3 business days
- Updates (after first approval) are usually faster (few hours to 1 day)

---

## Testing Before Submission

### Local Testing (Developer Mode)

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select directory: `build/chrome-extension/`
5. Extension should load and appear in your toolbar

### Test Checklist

- [ ] Extension loads without errors
- [ ] Popup opens correctly
- [ ] MCP sync functions properly
- [ ] Auto-updater checks for updates
- [ ] Error reporter captures errors
- [ ] All 25+ agents are accessible
- [ ] Permissions work correctly

### Chrome DevTools Console

Check for errors:
1. Right-click extension icon → "Inspect popup"
2. Check Console tab for errors
3. Go to `chrome://extensions/` → Click "Errors" if any

---

## Creating CRX File (Optional)

CRX files are Chrome's packaged extension format. While Chrome Web Store doesn't require CRX files (it uses ZIP), you might want to create one for:
- Self-hosting
- Enterprise deployment
- Manual distribution

### Using Chrome's Built-in Packer

1. Load unpacked extension (see "Local Testing" above)
2. Go to `chrome://extensions/`
3. Click **"Pack extension"**
4. **Extension root directory**: Select `build/chrome-extension/`
5. **Private key file**: Leave blank for first-time packaging
6. Click **"Pack Extension"**
7. CRX file will be created at `build/chrome-extension.crx`
8. Private key will be saved at `build/chrome-extension.pem` (keep this secure!)

**Important**: Keep the `.pem` file secure. You'll need it to update the extension later.

### Using Command Line (Advanced)

```bash
# Install Chrome Extension CLI
npm install -g crx

# Create CRX file
crx pack build/chrome-extension -o dist/workstation-ai-agent-v2.1.0.crx
```

---

## Version Management

### Updating the Extension

1. **Update version** in `chrome-extension/manifest.json`
2. **Rebuild**: `npm run build:chrome`
3. **Upload new ZIP** to Chrome Web Store
4. **Submit for review**

### Semantic Versioning

Follow semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes (e.g., 2.0.0 → 3.0.0)
- **MINOR**: New features (e.g., 2.1.0 → 2.2.0)
- **PATCH**: Bug fixes (e.g., 2.1.0 → 2.1.1)

Current version: **2.1.0**

---

## Distribution Options

### 1. Chrome Web Store (Recommended)

**Pros:**
- Automatic updates
- User trust (verified by Google)
- Easy installation
- Analytics available

**Cons:**
- $5 registration fee
- Review process (1-3 days)
- Must comply with Chrome Web Store policies

### 2. Self-Hosting CRX

**Pros:**
- No review process
- Full control
- Free

**Cons:**
- Manual updates required
- Users see security warning
- No analytics
- Requires HTTPS hosting

**Instructions:**
1. Host CRX file on HTTPS server
2. Create update manifest XML file
3. Users install via URL: `chrome://extensions/` → Drag & drop CRX

### 3. Enterprise Deployment

For organizations using Chrome Enterprise:

1. Upload to Google Admin Console
2. Set policies in Chrome Browser Cloud Management
3. Force-install for all users in domain

---

## Chrome Web Store Policies

Ensure your extension complies with:

### Required Disclosures

- **Data Collection**: Declare all data collected
- **Third-party Services**: List external services (e.g., Sentry, backend API)
- **Permissions**: Justify each permission

### Prohibited Practices

- ❌ Obfuscated code (keep code readable)
- ❌ Unexpected functionality
- ❌ Deceptive installation
- ❌ User data misuse

### Best Practices

- ✅ Clear, honest description
- ✅ Minimal permissions required
- ✅ Privacy policy provided
- ✅ Regular updates
- ✅ Responsive support

---

## Monitoring After Deployment

### Chrome Web Store Dashboard

Track:
- **Installs**: Total and weekly active users
- **Ratings**: User ratings and reviews
- **Reviews**: User feedback
- **Crashes**: Extension crash reports

### Error Monitoring (Sentry)

Configure Sentry DSN in extension for production error tracking:

```javascript
// In error-reporter.js
errorReporter.initialize({
  sentryDSN: 'https://your-key@sentry.io/project-id',
  environment: 'production',
  enabled: true
});
```

---

## Support & Maintenance

### User Support

Provide support channels:
- GitHub Issues: https://github.com/creditXcredit/workstation/issues
- Email: support@yourcompany.com
- Documentation: Include in Chrome Web Store listing

### Update Frequency

Recommended:
- **Security updates**: As needed (immediate)
- **Bug fixes**: Weekly or as reported
- **Feature updates**: Monthly
- **Major versions**: Quarterly

---

## Troubleshooting

### Common Issues

**Upload Failed**
- Check ZIP file size (<128MB limit)
- Ensure manifest.json is valid
- Remove unnecessary files

**Review Rejected**
- Address reviewer feedback
- Update description/screenshots
- Fix policy violations
- Resubmit

**Extension Not Loading**
- Check manifest version (must be 3)
- Verify all resources exist
- Check permissions
- Look for console errors

**Auto-Update Not Working**
- Ensure version number increased
- Check update_url in manifest (not needed for Chrome Web Store)
- Wait 1-2 hours for Chrome to check updates

---

## Quick Reference

### Commands

```bash
# Build extension
npm run build:chrome

# Package extension
npm run package:chrome

# Test locally
# 1. Open chrome://extensions/
# 2. Enable Developer mode
# 3. Load unpacked: build/chrome-extension/
```

### File Locations

- **Source**: `chrome-extension/`
- **Build**: `build/chrome-extension/`
- **Package**: `dist/workstation-ai-agent-v2.1.0.zip`
- **Manifest**: `chrome-extension/manifest.json`

### Important URLs

- **Developer Dashboard**: https://chrome.google.com/webstore/devconsole
- **Extension Page**: chrome://extensions/
- **Store Policies**: https://developer.chrome.com/docs/webstore/program-policies/

---

## Next Steps

1. ✅ **Package Created**: `dist/workstation-ai-agent-v2.1.0.zip`
2. ⏭️ **Test Locally**: Load unpacked extension
3. ⏭️ **Register**: Chrome Web Store Developer account ($5)
4. ⏭️ **Upload**: Submit ZIP file
5. ⏭️ **Configure**: Fill store listing
6. ⏭️ **Submit**: Wait for review (1-3 days)
7. ⏭️ **Publish**: Make available to users

---

**Ready for deployment!** 🚀

The extension package is production-ready and can be uploaded to the Chrome Web Store immediately.
