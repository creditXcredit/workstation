# stackBrowserAgent

🤖 A powerful Chromium-based browser automation system with extension support for building automation tools, testing frameworks, and web scraping applications.

> [!IMPORTANT]
> **Quality Status**: ✅ Production-ready after post-validation audit  
> **Note**: This repository experienced an emergency save event on Nov 10, 2025. All code has been thoroughly audited post-commit, validated, and documented. See [`QUALITY_AUDIT.md`](./QUALITY_AUDIT.md) for complete details.

## Features

### Core Capabilities
- ✅ **Chromium Browser Control**: Full control over Chromium browser via Puppeteer v24+
- 🔌 **Extension Support**: Load and manage browser extensions dynamically
- 🎯 **Command System**: Extensible command framework for automation tasks
- 📝 **Structured Logging**: Winston-based logging with multiple outputs
- 🔒 **Session Management**: Track and manage browser sessions
- 🎨 **TypeScript**: Full TypeScript support with type definitions
- 🧪 **Testing Ready**: Jest configuration for unit and integration tests
- 📚 **Well Documented**: Comprehensive documentation and examples

### Self-Healing & Reliability
- 🔄 **Self-Healing**: Automatic error recovery with 3-tier recovery strategies
- 📊 **Performance Tracking**: Continuous monitoring with micro-improvement suggestions
- 🔧 **Version Management**: Automatic Chromium/Puppeteer compatibility checking
- 🔁 **Retry Logic**: Exponential backoff with circuit breakers
- 🏥 **Health Monitoring**: Periodic health checks with automatic recovery

### Enterprise Security
- 🔐 **Authentication & Authorization**: Role-based access control (admin/agent/readonly)
- 🔑 **Credential Management**: AES-256-GCM encrypted storage with auto-rotation
- 🚦 **Rate Limiting**: Configurable per-agent request limits
- 📋 **Audit Logging**: Tamper-proof security event logging
- 🛡️ **Input Validation**: Comprehensive sanitization and validation

### AI/LLM Integration
- 🤖 **Ollama Integration**: Local LLM for code analysis and generation
- 💡 **Code Analysis**: Automated bug detection and security review
- ⚡ **Task Planning**: AI-powered task decomposition
- 🔍 **Error Diagnosis**: Intelligent error analysis and solutions
- 📖 **Documentation Generation**: Auto-generate comprehensive docs
- 🧪 **Test Generation**: AI-created test suites

### Automation & Orchestration
- 📋 **Task Queue**: Priority-based scheduling with dependencies
- 🎯 **State Monitoring**: Auto-detection of system state changes
- ⚙️ **Automation Rules**: Event-driven rule engine
- 💾 **Resource Management**: Automatic allocation and cleanup
- 🔄 **Auto-Scaling**: Concurrent operation management

### Error Handling
- 📊 **Error Classification**: Recoverable/degraded/fatal categorization
- 🔗 **Error Correlation**: Root cause analysis with pattern detection
- 🔮 **Predictive Detection**: Anomaly detection and error prediction
- ⏮️ **Rollback Manager**: Checkpoint-based state recovery
- 🌟 **Graceful Degradation**: Fallback handlers for critical features

### Team Coordination
- 💬 **Message Bus**: Inter-agent communication with pub/sub
- 🗂️ **Agent Registry**: Capability discovery and load balancing
- 🤝 **Task Handoff**: Seamless task transfer with state preservation
- 🧠 **Shared Memory**: Collaborative data storage (public/protected/private)
- ⚖️ **Load Balancing**: Round-robin, least-load, and random strategies

## Quick Start

### Prerequisites

- Node.js v18.0.0 or higher
- npm v9.0.0 or higher
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent

# Install dependencies
npm install

# Build the project
npm run build

# Run the agent
npm start
```

### Development Mode

```bash
# Run with hot-reload
npm run dev
```

## Project Structure

```
stackBrowserAgent/
├── src/                    # Source code
│   ├── agent/             # Core agent logic
│   ├── extensions/        # Extension loading
│   ├── types/             # TypeScript types
│   └── utils/             # Utilities
├── extensions/            # Browser extensions
│   └── example-extension/ # Example extension
├── docs/                  # Documentation
├── tests/                 # Test files
└── scripts/               # Build scripts
```

## Documentation

### Core Documentation
- 📖 [Setup Guide](docs/setup.md) - Detailed setup instructions
- 🏗️ [Architecture](docs/architecture.md) - System architecture and design
- 🔧 [Reassembly Guide](docs/reassembly.md) - Complete reassembly instructions
- 📊 [Repository Assessment](REPOSITORY_ASSESSMENT.md) - Project assessment and roadmap

### Advanced Features
- 🔄 [Self-Healing System](docs/self-healing.md) - Error recovery and performance optimization
- 🤖 [Agentic Infrastructure](docs/agentic-infrastructure.md) - Complete guide to security, LLM, automation, error handling, and team coordination
- 💡 [Implementation Notes](IMPLEMENTATION_NOTES.md) - Technical implementation details

## Configuration

Create a `.env` file:

```env
HEADLESS=false
DEVTOOLS=false
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
EXTENSIONS_PATH=./extensions
LOG_LEVEL=info
SERVER_PORT=3000
SERVER_HOST=localhost
```

## Usage Example

```typescript
import { BrowserAgent } from './src';

const agent = new BrowserAgent({
  browser: {
    headless: false,
    devtools: false,
    extensionsPath: './extensions',
  },
  logging: {
    level: 'info',
  },
});

// Start the agent
await agent.start();

// Execute commands
const result = await agent.executeCommand({
  type: 'navigate',
  payload: { url: 'https://example.com' },
});

console.log(result);

// Stop the agent
await agent.stop();

// Access system health and performance
const health = agent.getSystemHealth();
console.log('Browser Health:', health.browser);
console.log('Performance Metrics:', health.performance);
console.log('Improvement Suggestions:', health.improvements);
```

## Available Commands

### Navigate
Navigate to a URL:
```typescript
{
  type: 'navigate',
  payload: { url: 'https://example.com' }
}
```

### Screenshot
Capture a screenshot:
```typescript
{
  type: 'screenshot',
  payload: {
    path: './screenshot.png',
    fullPage: true
  }
}
```

## Extension Development

Create custom extensions in the `extensions/` directory:

```
extensions/my-extension/
├── manifest.json
├── background.js
├── content.js
└── popup.html
```

See the [example-extension](extensions/example-extension/) for a complete example.

## Scripts

```bash
npm run dev          # Development mode with hot-reload
npm run build        # Build TypeScript to JavaScript
npm start            # Run the compiled agent
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
npm run typecheck    # Type check without building
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests.

### Team Collaboration Principles

**"No one codes large projects alone for the reason that without another, a singular event could cause the system to fail and the build stage to dematerialize."**

This project embraces collaborative development with the following principles:

- **Pair Programming**: Recommended for critical infrastructure
- **Code Reviews**: Mandatory before merging to main
- **Emergency Protocols**: Documented procedures for rapid saves (see [`QUALITY_AUDIT.md`](./QUALITY_AUDIT.md))
- **Backup Developers**: Secondary reviewers assigned for major features
- **Automated Validation**: Pre-commit hooks and CI/CD pipelines
- **Checkpoint Strategy**: Regular automated state preservation

### For Agentic Contributors

If you're an AI agent or autonomous system contributing to this project:

1. **Always validate before committing**: Run build, lint, and tests
2. **Create checkpoints**: Save state every 5 minutes during long tasks
3. **Enable recovery**: Implement rollback to last good state
4. **Document handoffs**: Use `CoordinationManager` for task transfers
5. **Notify on failures**: Alert human oversight for unrecoverable errors

See our [Agentic Infrastructure Guide](docs/agentic-infrastructure.md) for complete details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📝 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/stackconsult/stackBrowserAgent/issues)
- 💬 [Discussions](https://github.com/stackconsult/stackBrowserAgent/discussions)

## Acknowledgments

- Built with [Puppeteer](https://pptr.dev/)
- Powered by [Chromium](https://www.chromium.org/)
- TypeScript for type safety
- Winston for logging

---

Made with ❤️ by [stackconsult](https://github.com/stackconsult)
Browser Agent with JWT Authentication and Railway Deployment

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/stackbrowseragent)

## Features

- 🔐 JWT Authentication with Express
- 🚀 One-click deployment to Railway
- 🐳 Docker containerization
- 📝 TypeScript for type safety
- ⚡ Fast development with ts-node
- 🛡️ Rate limiting for security (100 req/15min, 10 auth req/15min)

## Quick Start

### Local Development

1. Clone the repository:
```bash
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Update `.env` with your JWT secret:
```env
JWT_SECRET=your-secure-secret-key
JWT_EXPIRATION=24h
PORT=3000
```

5. Run in development mode:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Generate Demo Token
```bash
GET /auth/demo-token
```
Returns a demo JWT token for testing.

### Generate Custom Token
```bash
POST /auth/token
Content-Type: application/json

{
  "userId": "user123",
  "role": "admin"
}
```

### Protected Route Example
```bash
GET /api/protected
Authorization: Bearer <your-jwt-token>
```

### Agent Status (Protected)
```bash
GET /api/agent/status
Authorization: Bearer <your-jwt-token>
```

## Railway Deployment

### Option 1: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/stackconsult/stackBrowserAgent)

Click the button above to deploy instantly to Railway. The deployment will:
- Automatically build the TypeScript application
- Generate a secure JWT secret (or you can provide your own)
- Expose the API on a public URL

After deployment:
1. Railway will automatically set a `JWT_SECRET` for you
2. Your application will be available at: `https://your-app.railway.app`
3. Test it: `https://your-app.railway.app/health`
4. Get a demo token: `https://your-app.railway.app/auth/demo-token`

### Option 2: Railway CLI

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login to Railway:
```bash
railway login
```

3. Initialize and deploy:
```bash
railway init
railway up
```

4. Set environment variables in Railway dashboard:
   - `JWT_SECRET`: Your secure secret key
   - `JWT_EXPIRATION`: Token expiration time (e.g., "24h")
   - `PORT`: Will be set automatically by Railway

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `JWT_SECRET` | Secret key for JWT signing | `default-secret...` | Yes (in production) |
| `JWT_EXPIRATION` | JWT token expiration time | `24h` | No |
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |

## Testing JWT Authentication

1. Get a demo token:
```bash
curl http://localhost:3000/auth/demo-token
```

2. Use the token to access protected routes:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/protected
```

## Docker

Build and run with Docker:

```bash
# Build image
docker build -t stackbrowseragent .

# Run container
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  stackbrowseragent
```

## Security Notes

⚠️ **Important**: Always set a strong `JWT_SECRET` in production. Never use the default value.

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Rate Limiting

The application includes built-in rate limiting for security:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 10 requests per 15 minutes per IP

Rate limits help prevent:
- Brute force attacks on authentication
- Denial of service (DoS) attacks
- API abuse

If you need to adjust rate limits, modify the `limiter` and `authLimiter` configurations in `src/index.ts`.

## License

ISC
