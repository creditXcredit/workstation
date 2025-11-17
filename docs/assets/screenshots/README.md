# Visual Assets

This directory contains visual assets for Workstation documentation.

## 📁 Directory Structure

```
assets/
├── screenshots/     # UI and feature screenshots
│   ├── README.md   # This file
│   └── (add screenshots here)
│
└── diagrams/       # Architecture and flow diagrams
    └── (add diagrams here)
```

## 📸 Screenshots Needed

To improve documentation, we need screenshots of:

### User Interfaces
- [ ] Landing page (`landing.html`)
- [ ] Simple dashboard (`index.html`)
- [ ] Control center (`workstation-control-center.html`)
- [ ] Workflow creation form
- [ ] Execution monitoring view
- [ ] API testing interface

### Features
- [ ] Browser automation in action
- [ ] Workflow execution status
- [ ] JWT token generation
- [ ] Health check results
- [ ] Example workflow JSON

### Terminal/CLI
- [ ] Quick start commands
- [ ] npm run dev output
- [ ] API curl examples
- [ ] Test suite results

## 🎨 Screenshot Guidelines

### Format
- **Format:** PNG (preferred) or JPEG
- **Size:** Max 1920x1080, compress for web
- **Naming:** Lowercase with hyphens (e.g., `landing-page-hero.png`)

### Content
- Include relevant context (browser chrome, terminal prompts)
- Use consistent theme (light or dark)
- Highlight important features
- Keep sensitive data (tokens, secrets) out

### Tools
- **macOS:** Cmd+Shift+4 (region), Cmd+Shift+3 (full screen)
- **Windows:** Windows+Shift+S
- **Linux:** Screenshot tool or `gnome-screenshot`
- **Browser:** Browser DevTools screenshot feature

## 📊 Diagrams

Architecture and flow diagrams can be created with:

- **Mermaid** - Markdown-based diagrams (recommended)
- **Draw.io** - Free diagram tool
- **Excalidraw** - Hand-drawn style
- **PlantUML** - Text-based UML

### Diagram Ideas

```
diagrams/
├── system-architecture.svg         # Overall system design
├── workflow-execution-flow.svg     # Workflow execution process
├── authentication-flow.svg         # JWT auth flow
├── browser-automation-stack.svg    # Tech stack diagram
└── deployment-options.svg          # Deployment architecture
```

## 📝 Adding Screenshots

### 1. Capture Screenshot
Use tools mentioned above

### 2. Optimize File Size
```bash
# Install imagemagick (if needed)
brew install imagemagick  # macOS
apt install imagemagick   # Linux

# Resize and compress
convert input.png -resize 1920x1080 -quality 85 output.png
```

### 3. Add to Repository
```bash
# Copy to screenshots directory
cp ~/Downloads/my-screenshot.png docs/assets/screenshots/

# Commit
git add docs/assets/screenshots/my-screenshot.png
git commit -m "Add screenshot: my-screenshot"
```

### 4. Reference in Documentation
```markdown
![Feature Screenshot](../assets/screenshots/my-screenshot.png)
```

## 🔗 Using in Web Pages

### In HTML
```html
<img src="assets/screenshots/my-screenshot.png" alt="Feature" class="rounded shadow-lg">
```

### In Markdown
```markdown
![Alt text](assets/screenshots/my-screenshot.png)
```

### With Links
```markdown
[![Feature](assets/screenshots/thumbnail.png)](assets/screenshots/full-size.png)
```

## 📦 Example Screenshots

**Coming soon!** We'll add screenshots as the UI stabilizes.

For now, you can:
1. Run the project locally
2. Open the web interfaces
3. Capture your own screenshots
4. Contribute them back!

## 🤝 Contributing Screenshots

Have a great screenshot? We'd love to include it!

1. Fork the repository
2. Add your screenshot to this directory
3. Update this README with a description
4. Submit a pull request

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

---

**Help us make the documentation visual! 📸**
