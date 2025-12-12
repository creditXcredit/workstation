#!/bin/bash
# Display startup instructions for new users

cat << 'EOF'
🚀 See 🚀_START_HERE.md for complete setup instructions

Quick Start:
1. Build Chrome Extension: bash ./scripts/build-enterprise-chrome-extension.sh
2. Extract and load in Chrome: chrome://extensions/
3. Start Backend: npm start

⚡ SHORTCUT: Pre-built ZIPs already exist in dist/ directory!
   - dist/workstation-ai-agent-enterprise-v2.1.0.zip (143 KB)
   - dist/workstation-ai-agent-v2.1.0.zip (97 KB)

Just extract and load in Chrome!

📖 Full documentation: 🚀_START_HERE.md
EOF
