# stackBrowserAgent

A comprehensive browser agent platform combining backend services with JWT authentication and a multi-agent browser extension.

## Project Structure

This is a monorepo containing:

- **Node.js Backend** (root): Express.js API with JWT authentication
- **Python Backend** (`backend/`): Advanced multi-agent orchestration system
- **Browser Extension** (`src/`, `public/`): Chrome extension for browser automation

## Features

### Backend Services

#### Node.js API (Root Level)
- 🔐 JWT Authentication with Express
- 📝 TypeScript for type safety
- 🛡️ Rate limiting for security
- ✅ Comprehensive test suite with Jest
- 🔍 Input validation with Joi schemas
- 📊 Structured logging with Winston

#### Python Backend (Backend Directory)
- 🤖 Multi-agent orchestration system
- 🌐 LLM provider support (OpenAI, Anthropic, Google, Ollama)
- 💾 Database integration (PostgreSQL/SQLite)
- 🔄 Workflow execution engine
- 📊 RAG (Retrieval Augmented Generation)
- 🐳 Docker containerization

### Browser Extension
- 🤖 Multi-agent system (Navigator, Planner, Validator, Executor, Extractor, Analyzer)
- 🔐 Privacy-first architecture with local-only execution mode
- 🎯 Natural language command processing
- 💬 Interactive chat-based interface
- 🌐 Multiple LLM provider support
- 📸 Screenshot capture and data extraction

## Quick Start

### Prerequisites

- Node.js 18+ (for Node.js backend and extension)
- Python 3.9+ (for Python backend)
- npm or yarn

### Node.js Backend

1. Clone the repository:
```bash
git clone https://github.com/stackconsult/stackBrowserAgent.git
cd stackBrowserAgent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Build and run:
```bash
npm run build
npm start
```

### Python Backend

See [backend/README.md](backend/README.md) for detailed backend setup instructions.

### Browser Extension

See [INSTALLATION.md](INSTALLATION.md) for browser extension installation instructions.

## Development

### Node.js Backend Development
```bash
npm run dev        # Start with ts-node
npm run lint       # Run ESLint
npm test           # Run tests
```

### Python Backend Development
```bash
cd backend
pip install -r requirements.txt
python -m pytest tests/
```

## Documentation

- [API Documentation](API.md)
- [Architecture](ARCHITECTURE.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Backend README](backend/README.md)
- [Quick Start Guide](QUICK_START.md)

## Deployment

### GitHub Container Registry
Both backend services are automatically deployed to GitHub Container Registry via GitHub Actions.

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Testing

### Node.js Backend
```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:integration   # Integration tests only
```

### Python Backend
```bash
cd backend
pytest tests/ -v --cov=src
```

## License

ISC

## Repository

- GitHub: [https://github.com/stackconsult/stackBrowserAgent](https://github.com/stackconsult/stackBrowserAgent)
- Issues: [https://github.com/stackconsult/stackBrowserAgent/issues](https://github.com/stackconsult/stackBrowserAgent/issues)
