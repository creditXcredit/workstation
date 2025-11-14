# Setup Guide - stackBrowserAgent

## Prerequisites

- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- Puppeteer (with Chromium)
- TypeScript
- Winston (logging)
- Express (optional server)
- Development tools (ESLint, Prettier, Jest)

### 3. Configure Environment

Create a `.env` file in the root directory:

```bash
# Browser Configuration
HEADLESS=false
DEVTOOLS=false
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# Extensions
EXTENSIONS_PATH=./extensions

# User Data Directory (optional)
# USER_DATA_DIR=./user-data

# Logging
LOG_LEVEL=info
# LOG_FILE=./logs/agent.log

# Server (optional)
SERVER_PORT=3000
SERVER_HOST=localhost
```

### 4. Build the Project

```bash
npm run build
```

This compiles TypeScript code to JavaScript in the `dist/` directory.

## Running the Agent

### Development Mode

Run with hot-reload for development:

```bash
npm run dev
```

### Production Mode

Build and run the compiled version:

```bash
npm run build
npm start
```

## Project Structure

```
stackBrowserAgent/
├── src/                    # Source code
│   ├── agent/             # Core agent logic
│   │   ├── index.ts       # Main agent class
│   │   ├── browser.ts     # Browser management
│   │   ├── session.ts     # Session management
│   │   └── commands/      # Command handlers
│   ├── extensions/        # Extension loading logic
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── extensions/            # Browser extensions
│   └── example-extension/ # Example extension
├── tests/                 # Test suite
├── docs/                  # Documentation
├── config/                # Configuration files
├── dist/                  # Compiled output (generated)
└── node_modules/          # Dependencies (generated)
```

## Extension Development

### Creating a New Extension

1. Create a new directory in `extensions/`:

```bash
mkdir extensions/my-extension
```

2. Create a `manifest.json`:

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "description": "My custom extension",
  "permissions": ["storage", "tabs"],
  "background": {
    "service_worker": "background.js"
  }
}
```

3. Add your extension scripts (background.js, content.js, etc.)

4. The extension will be automatically discovered and loaded when the agent starts.

### Extension Structure

```
extensions/my-extension/
├── manifest.json          # Extension manifest (required)
├── background.js          # Background service worker
├── content.js             # Content script
├── popup.html             # Extension popup UI
└── popup.js               # Popup script
```

## Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Development Workflow

### 1. Code Style

The project uses ESLint and Prettier for code quality:

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix

# Format code
npm run format
```

### 2. Type Checking

```bash
npm run typecheck
```

### 3. Clean Build

```bash
npm run clean
npm run build
```

## Configuration Options

### Browser Configuration

- `headless`: Run browser in headless mode (no UI)
- `devtools`: Open DevTools automatically
- `viewport`: Browser window size
- `userDataDir`: Directory for browser profile data
- `extensionsPath`: Path to extensions directory
- `args`: Additional Chromium arguments

### Logging Configuration

- `level`: Log level (error, warn, info, debug)
- `file`: Log file path (optional)

### Server Configuration

- `port`: Server port for remote control
- `host`: Server host address

## Troubleshooting

### Chromium Download Issues

If Puppeteer fails to download Chromium:

```bash
# Manually install Chromium
npx puppeteer browsers install chrome
```

### Extension Loading Issues

- Ensure manifest.json is valid JSON
- Check that manifest_version is 3
- Verify all referenced files exist
- Extensions require headed mode (headless=false)

### Permission Errors

On Linux, you may need to install dependencies:

```bash
# Ubuntu/Debian
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
```

## Next Steps

- Read [Architecture Documentation](./architecture.md)
- Read [Reassembly Guide](./reassembly.md)
- Check out example extensions
- Explore the API documentation

## Support

For issues and questions:
- GitHub Issues: https://github.com/stackconsult/stackBrowserAgent/issues
- Documentation: https://github.com/stackconsult/stackBrowserAgent/docs
