# Architecture Documentation - stackBrowserAgent

## Overview

stackBrowserAgent is a Chromium-based browser automation system designed for extensibility and programmatic control. It provides a robust foundation for building browser automation tools, testing frameworks, and web scraping applications.

## Core Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Agent                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Session    │  │   Commands   │  │    Logger    │  │
│  │   Manager    │  │   Handler    │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                 │                  │           │
│         └─────────────────┴──────────────────┘           │
│                         │                                │
│                  ┌──────▼──────┐                        │
│                  │   Browser   │                        │
│                  │   Manager   │                        │
│                  └──────┬──────┘                        │
└─────────────────────────┼────────────────────────────────┘
                          │
                  ┌───────▼────────┐
                  │   Extension    │
                  │    Loader      │
                  └───────┬────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
   ┌────▼────┐                        ┌─────▼─────┐
   │ Chromium│                        │Extensions │
   │ Browser │                        │  (1...N)  │
   └─────────┘                        └───────────┘
```

## Component Details

### 1. Browser Agent

**Location:** `src/agent/index.ts`

The main orchestrator that coordinates all components.

**Responsibilities:**
- Initialize and configure all subsystems
- Register and dispatch commands
- Manage agent lifecycle (start/stop)
- Provide high-level API

**Key Methods:**
- `start()`: Initialize browser and session
- `stop()`: Cleanup and shutdown
- `executeCommand()`: Execute agent commands
- `registerCommand()`: Register custom command handlers

### 2. Browser Manager

**Location:** `src/agent/browser.ts`

Manages the Chromium browser instance and its lifecycle.

**Responsibilities:**
- Launch browser with configuration
- Load and manage extensions
- Create and manage pages
- Handle browser process

**Key Methods:**
- `launch()`: Start browser with extensions
- `newPage()`: Create new browser page
- `getPages()`: Get all open pages
- `close()`: Shutdown browser
- `getLoadedExtensions()`: List loaded extensions

**Configuration:**
```typescript
interface BrowserConfig {
  headless: boolean;        // Headless mode
  devtools: boolean;        // Auto-open DevTools
  viewport?: {              // Window size
    width: number;
    height: number;
  };
  userDataDir?: string;     // Profile directory
  extensionsPath?: string;  // Extensions location
  args?: string[];          // Custom Chromium args
}
```

### 3. Session Manager

**Location:** `src/agent/session.ts`

Tracks browser session state and metadata.

**Responsibilities:**
- Generate unique session IDs
- Track session uptime
- Collect session information
- Manage session lifecycle

**Key Methods:**
- `getSessionInfo()`: Get current session details
- `getSessionId()`: Get unique session ID
- `getUptime()`: Get session duration
- `endSession()`: Terminate session

**Session Information:**
```typescript
interface SessionInfo {
  id: string;               // Unique session ID
  startTime: Date;          // Session start time
  browser: {
    version: string;        // Browser version
    userAgent: string;      // User agent string
  };
  extensions: string[];     // Loaded extensions
}
```

### 4. Extension Loader

**Location:** `src/extensions/loader.ts`

Discovers and loads browser extensions.

**Responsibilities:**
- Scan extensions directory
- Validate extension manifests
- Load extension metadata
- Provide extension paths for browser

**Key Methods:**
- `discoverExtensions()`: Find all extensions
- `loadExtensionManifest()`: Parse manifest.json
- `getExtensionPaths()`: Get validated extension paths
- `getLoadedExtensions()`: List loaded extensions

**Extension Discovery Process:**
1. Scan `extensions/` directory
2. Look for `manifest.json` in each subdirectory
3. Validate manifest format
4. Return paths of valid extensions

### 5. Command System

**Location:** `src/agent/commands/`

Extensible command execution framework.

**Architecture:**
```
BaseCommand (abstract)
    │
    ├── NavigateCommand
    ├── ScreenshotCommand
    └── [Custom Commands...]
```

**Command Interface:**
```typescript
interface AgentCommand {
  type: string;        // Command type
  payload?: any;       // Command parameters
  id?: string;         // Command ID
}

interface AgentResponse {
  success: boolean;    // Success flag
  data?: any;          // Response data
  error?: string;      // Error message
  commandId?: string;  // Command ID
}
```

**Built-in Commands:**

#### NavigateCommand
Navigate to a URL.
```typescript
{
  type: 'navigate',
  payload: { url: 'https://example.com' }
}
```

#### ScreenshotCommand
Capture page screenshot.
```typescript
{
  type: 'screenshot',
  payload: {
    path?: string,      // Save path (optional)
    fullPage?: boolean  // Full page screenshot
  }
}
```

### 6. Logging System

**Location:** `src/utils/logger.ts`

Structured logging using Winston.

**Features:**
- Multiple log levels (error, warn, info, debug)
- Console and file output
- Structured JSON logging
- Colorized console output
- Timestamp inclusion

**Usage:**
```typescript
import { logger } from './utils/logger';

logger.info('Application started');
logger.error('Error occurred', { error });
logger.debug('Debug information', { data });
```

## Data Flow

### Startup Sequence

```
1. Load Configuration
   ↓
2. Initialize Logger
   ↓
3. Create Browser Manager
   ↓
4. Discover Extensions
   ↓
5. Launch Browser with Extensions
   ↓
6. Create Session Manager
   ↓
7. Register Command Handlers
   ↓
8. Agent Ready
```

### Command Execution Flow

```
1. Receive Command
   ↓
2. Validate Command Type
   ↓
3. Lookup Command Handler
   ↓
4. Execute Handler
   ↓
5. Handler Uses Browser Manager
   ↓
6. Generate Response
   ↓
7. Return Result
```

## Extension Architecture

### Extension Manifest (V3)

```json
{
  "manifest_version": 3,
  "name": "Extension Name",
  "version": "1.0.0",
  "description": "Description",
  "permissions": ["storage", "tabs"],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }]
}
```

### Extension Loading

Extensions are loaded using Chromium's `--load-extension` flag:
```bash
chromium --load-extension=/path/to/ext1,/path/to/ext2
```

**Note:** Extensions require headed mode (headless=false).

### Extension Communication

```
Background Script ←→ Browser Agent
       ↕
Content Script ←→ Web Page
```

## Security Considerations

### Sandboxing

- Each extension runs in isolated context
- Content scripts have limited DOM access
- Background scripts have no direct page access

### Permissions

- Extensions declare required permissions
- Permissions enforced by Chromium
- Minimal permission principle

### Data Isolation

- User data directory for profile isolation
- Session-specific data storage
- No shared state between sessions

## Extensibility

### Adding Custom Commands

```typescript
import { BaseCommand } from './agent/commands/base';

class CustomCommand extends BaseCommand {
  async execute(command: AgentCommand): Promise<AgentResponse> {
    // Implementation
  }
}

// Register
agent.registerCommand('custom', new CustomCommand(browserManager));
```

### Adding Custom Extensions

1. Create extension directory
2. Add manifest.json
3. Implement extension logic
4. Place in extensions/ directory
5. Restart agent

### Custom Configuration

Extend AgentConfig interface:
```typescript
interface CustomConfig extends AgentConfig {
  custom: {
    feature1: boolean;
    feature2: string;
  };
}
```

## Performance Considerations

### Memory Management

- Browser instances consume significant memory
- Close unused pages with `page.close()`
- Limit concurrent pages
- Monitor memory usage

### Resource Cleanup

- Always call `agent.stop()` on shutdown
- Close browser properly
- Clean up temporary files
- Remove event listeners

### Optimization Tips

- Use headless mode when possible
- Disable unnecessary features
- Cache frequently used resources
- Limit extension count
- Use network throttling for testing

## Error Handling

### Error Propagation

```
Command → Handler → Browser Manager → Puppeteer
   ↓         ↓             ↓              ↓
Error ← Error ←── Error ←──── Error
```

### Error Types

- **Configuration Errors**: Invalid config
- **Browser Errors**: Launch failures
- **Command Errors**: Invalid commands
- **Extension Errors**: Load failures
- **Network Errors**: Connection issues

### Error Recovery

- Automatic browser restart on crash
- Command retry mechanisms
- Session recovery
- Graceful degradation

## Testing Strategy

### Unit Tests

Test individual components in isolation:
- Command handlers
- Extension loader
- Session manager
- Utility functions

### Integration Tests

Test component interactions:
- Browser launch with extensions
- Command execution flow
- Session lifecycle

### E2E Tests

Test complete workflows:
- Navigate and screenshot
- Extension interaction
- Multi-page scenarios

## Deployment Options

### Local Development

```bash
npm run dev
```

### Docker Container

```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

### Cloud Deployment

- AWS Lambda with Puppeteer Layer
- Google Cloud Run
- Azure Container Instances
- Kubernetes cluster

## Monitoring

### Metrics to Track

- Session count
- Command success rate
- Browser memory usage
- Extension load time
- Response times

### Logging

- All commands logged
- Browser events captured
- Extension activity tracked
- Error stack traces preserved

## Future Enhancements

### Planned Features

- WebSocket API for remote control
- REST API server
- Multi-browser support (Firefox, Safari)
- Extension marketplace
- Distributed execution
- Cloud synchronization
- Team collaboration

### API Evolution

Current: Direct method calls
Future: REST/WebSocket API

```http
POST /api/command
{
  "type": "navigate",
  "payload": { "url": "https://example.com" }
}
```

## Conclusion

The stackBrowserAgent architecture provides a solid foundation for browser automation with strong separation of concerns, extensibility, and maintainability. The modular design allows for easy customization and scaling.
