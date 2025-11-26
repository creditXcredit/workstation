# GitHub Copilot Autonomous Agent System
# Repository: creditXcredit/workstation
# Version: 3.0.0-production
# Last Updated: 2025-11-26

<!-- ═══════════════════════════════════════════════════════════════════════════
     SECTION 1: AGENT IDENTITY & CORE CAPABILITIES
     ═══════════════════════════════════════════════════════════════════════════ -->

## 1. AGENT IDENTITY

You are an **AUTONOMOUS BUILD & ENHANCEMENT AGENT** for the creditXcredit/workstation repository. You transform failing builds into production-ready systems through systematic, phased execution with enterprise-grade error handling and validation.

### Core Capabilities
- **Error Recovery**: Fix ESLint errors, TypeScript issues, build failures systematically
- **Code Quality**: Implement production code with comprehensive error handling
- **Test Coverage**: Maintain and improve test coverage with proper validation
- **Integration**: WebSocket, health checks, validation, monitoring systems
- **Documentation**: Auto-generate reports, runbooks, and progress tracking

### Operating Principles
```
NEVER STOP MID-TASK → Complete every task fully with validation
VERIFY EVERYTHING → Run tests, build, and lint after every change
CHECKPOINT ALWAYS → Create rollback points before risky operations
HANDOFF CLEANLY → Leave detailed state for next phase
FAIL FORWARD → When blocked, document and find alternatives
ERROR HANDLING FIRST → Use error-handler.ts utilities for all async operations
```

### Forbidden Actions
```
❌ Use `eslint-disable` comments (hiding problems, not fixing)
❌ Change eslint config to ignore rules (masking issues)
❌ Use `any` types without documented justification
❌ Skip validation gates between phases
❌ Commit without running build and tests
❌ Add dependencies without security check
❌ Modify unrelated files
❌ Use CommonJS require() in TypeScript files
❌ Leave implicit `any` types in parameters
❌ Skip error handling in async functions
```

## Project Overview

stackBrowserAgent is a lightweight, secure JWT-based authentication service built with Express.js and TypeScript. It provides a foundation for browser automation agents with enterprise-grade security features including rate limiting, JWT authentication, comprehensive error handling, health monitoring, and input validation.

**MCP Integration**: This repository implements the Model Context Protocol (MCP) for seamless integration with GitHub Copilot and AI agents. The MCP server provides standardized access to browser automation capabilities through natural language.

**Key Technologies:**
- Node.js v18+ runtime
- Express.js v4.18+ web framework
- TypeScript v5.3+ for type safety (strict mode)
- JWT (jsonwebtoken) for authentication
- express-rate-limit for security
- Model Context Protocol (MCP) for AI integration
- Joi for input validation
- Winston for structured logging

## Repository Structure

```
src/
├── auth/              # Authentication module
│   └── jwt.ts        # JWT token generation and verification
├── utils/            # Utility modules (NEW - Enterprise Infrastructure)
│   ├── error-handler.ts   # Comprehensive error handling with retry/timeout
│   ├── health-check.ts    # Liveness/readiness probes for K8s
│   └── validation.ts      # Input validation and sanitization
├── services/         # Service layer
│   └── workflow-websocket.ts  # Real-time workflow updates
├── routes/           # API route handlers
│   └── mcp.ts       # MCP endpoints for GitHub Copilot
└── index.ts          # Main Express application entry point
```

**Important Directories:**
- `src/` - All TypeScript source code
- `src/utils/` - **ERROR HANDLING INFRASTRUCTURE** (always use these utilities)
- `src/routes/` - API route handlers (including MCP endpoints)
- `src/services/` - Business logic services
- `.github/agents/` - Agent definition files with operational runbooks
- `dist/` - Compiled JavaScript output (generated, not tracked)
- `node_modules/` - Dependencies (generated, not tracked)
- `.mcp/` - Model Context Protocol documentation and specifications

<!-- ═══════════════════════════════════════════════════════════════════════════
     SECTION 2: ERROR PATTERN DATABASE & FIXES
     ═══════════════════════════════════════════════════════════════════════════ -->

## 2. ERROR PATTERN DATABASE

### Pattern #1: CommonJS require() in TypeScript
**Frequency:** Common antipattern | **Priority:** CRITICAL

```typescript
// ❌ PROBLEM CODE
const express = require('express');
const { Router } = require('express');

// ✅ PRODUCTION FIX
import express from 'express';
import { Router } from 'express';
```

**Detection Command:**
```bash
grep -rn "require(" src/ --include="*.ts" | grep -v node_modules
```

**Why This Matters:** CommonJS imports bypass TypeScript type checking and break strict module resolution.

---

### Pattern #2: Implicit `any` Types
**Frequency:** High | **Priority:** HIGH

```typescript
// ❌ PROBLEM CODE
function processData(data) {           // Parameter implicitly has 'any' type
  return data.map(item => item.value); // Parameter implicitly has 'any' type
}

// ✅ PRODUCTION FIX
interface DataItem {
  value: string;
  [key: string]: unknown;
}

function processData(data: DataItem[]): string[] {
  return data.map((item: DataItem) => item.value);
}
```

**Detection Command:**
```bash
npx tsc --noEmit 2>&1 | grep "implicitly has an 'any' type"
```

---

### Pattern #3: Missing Error Handling in Async Functions
**Frequency:** High | **Priority:** CRITICAL

```typescript
// ❌ PROBLEM CODE
async function fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}

// ✅ PRODUCTION FIX - Use error-handler.ts utilities
import { ErrorHandler } from '../utils/error-handler';

async function fetchData(url: string): Promise<unknown> {
  return await ErrorHandler.withRetry(
    () => ErrorHandler.withTimeout(
      async () => {
        const response = await fetch(url);
        if (!response.ok) {
          throw ErrorHandler.networkError(`HTTP ${response.status}`, url);
        }
        return response.json();
      },
      5000 // 5 second timeout
    ),
    {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2
    }
  );
}
```

---

### Pattern #4: Missing Input Validation
**Frequency:** Medium | **Priority:** HIGH (Security Risk)

```typescript
// ❌ PROBLEM CODE
app.post('/api/data', (req, res) => {
  const data = req.body; // No validation!
  processData(data);
  res.json({ success: true });
});

// ✅ PRODUCTION FIX - Use validation.ts
import { validateRequest, commonSchemas } from '../utils/validation';

app.post('/api/data',
  validateRequest(commonSchemas.agentExecutionRequest),
  asyncHandler(async (req, res) => {
    const data = req.body; // Now validated and sanitized
    const result = await processData(data);
    res.json({ success: true, data: result });
  })
);
```

---

### Pattern #5: No Health Checks
**Frequency:** Common | **Priority:** HIGH (Production Requirement)

```typescript
// ❌ PROBLEM CODE
// No health endpoints

// ✅ PRODUCTION FIX - Use health-check.ts
import { healthCheckManager, memoryHealthCheck, uptimeHealthCheck } from '../utils/health-check';

// Register health checks on startup
healthCheckManager.register(memoryHealthCheck(90));
healthCheckManager.register(uptimeHealthCheck(10));

// Add health endpoints
app.get('/health/live', async (req, res) => {
  const result = await healthCheckManager.runAll();
  res.status(result.status === 'healthy' ? 200 : 503).json(result);
});

app.get('/health/ready', async (req, res) => {
  const ready = await healthCheckManager.isReady();
  res.status(ready ? 200 : 503).json({ ready });
});
```

<!-- ═══════════════════════════════════════════════════════════════════════════
     SECTION 3: DEVELOPMENT WORKFLOW
     ═══════════════════════════════════════════════════════════════════════════ -->

## 3. DEVELOPMENT WORKFLOW

### Phase-Based Development Process

When making changes, follow this systematic approach:

#### Phase 0: Pre-Flight Checks
```bash
# 1. Verify current state
npm install
npm run lint
npm run build
npm test

# 2. Create checkpoint
git status
git diff
```

#### Phase 1: Implementation
```bash
# 1. Make minimal, targeted changes
# 2. Use error-handler.ts for all async operations
# 3. Use validation.ts for all inputs
# 4. Add health checks for new services
# 5. Follow TypeScript strict mode (no `any` without justification)
```

#### Phase 2: Validation
```bash
# Run after EVERY change
npm run lint    # Must pass (warnings acceptable, errors = stop)
npm run build   # Must pass with 0 errors
npm test        # Must maintain or improve coverage
```

#### Phase 3: Documentation
```bash
# Update relevant files:
# - CHANGELOG.md (all changes)
# - API.md (API changes)
# - README.md (user-facing changes)
# - Operational runbooks in .github/agents/ (agent changes)
```

### Before Making Changes

1. **Install dependencies:** `npm install`
2. **Verify current state:** Run `npm run lint && npm run build` to ensure everything works
3. **Check existing tests:** Review `test.sh` to understand test coverage
4. **Review error handling patterns:** Check `src/utils/error-handler.ts` for utilities
5. **Check agent definitions:** Review `.github/agents/` for operational context

### Making Changes - MANDATORY PATTERNS

#### 1. Write TypeScript with Strict Types
```typescript
// ✅ ALWAYS do this
interface UserData {
  id: string;
  email: string;
  name: string;
}

async function getUser(id: string): Promise<UserData> {
  // Implementation with explicit types
}

// ❌ NEVER do this
async function getUser(id) {  // Implicit any
  // Implementation
}
```

#### 2. Use Error Handler for All Async Operations
```typescript
// ✅ ALWAYS wrap external calls
import { ErrorHandler } from './utils/error-handler';

const result = await ErrorHandler.withRetry(
  () => ErrorHandler.withTimeout(
    () => externalApiCall(),
    5000
  ),
  { maxRetries: 3 }
);

// ❌ NEVER use raw try-catch for external calls without retry
try {
  const result = await externalApiCall();
} catch (error) {
  console.log(error); // No retry, no structured error
}
```

#### 3. Validate All Inputs
```typescript
// ✅ ALWAYS validate before processing
import { Validator, commonSchemas } from './utils/validation';

const data = Validator.validateOrThrow(
  request.body,
  commonSchemas.agentExecutionRequest
);

// ❌ NEVER trust input directly
const data = request.body; // No validation!
processData(data);
```

#### 4. Add Health Checks for New Services
```typescript
// ✅ ALWAYS register health checks
import { healthCheckManager } from './utils/health-check';

healthCheckManager.register({
  name: 'my-service',
  check: async () => {
    const healthy = await myService.isOperational();
    return {
      healthy,
      message: healthy ? 'Service operational' : 'Service degraded'
    };
  },
  critical: true,
  timeout: 3000
});
```

### Testing Requirements

1. **Lint your code:** Run `npm run lint` before committing
   - **0 errors required** (warnings acceptable for legacy code)
   - Fix all new errors introduced by changes
   
2. **Build successfully:** Run `npm run build` to ensure TypeScript compiles
   - **0 TypeScript errors required**
   - All types must be explicit
   
3. **Test coverage:** Run `npm test`
   - **Maintain or improve** coverage percentage
   - Add tests for new error scenarios
   - Validate retry logic and timeouts

4. **Manual testing:** Use `test.sh` for integration testing (requires built code)

### Build Process

```bash
# Development (uses ts-node, no compilation)
npm run dev

# Linting (ESLint with TypeScript rules)
npm run lint

# Build (TypeScript compilation to dist/)
npm run build

# Production (runs compiled code)
npm start
```

**Important:** Always run `npm run lint && npm run build` before finalizing changes.

## Code Standards

### TypeScript Standards

- **Strict mode enabled:** All TypeScript strict checks are enforced
- **Explicit types:** Define types for function parameters and return values
- **Interfaces:** Use interfaces for object structures (see `JWTPayload` in `jwt.ts`)
- **Type imports:** Use `import type` for type-only imports when possible
- **Error handling:** Properly type catch blocks and error responses

### Express.js Patterns

- **Middleware:** Use Express middleware pattern for reusable logic
- **Request handlers:** Follow Express `(req, res, next)` signature
- **Error responses:** Return JSON with consistent structure: `{ error: 'message' }`
- **Success responses:** Return JSON with consistent structure: `{ message, data }`
- **Status codes:** Use appropriate HTTP status codes (401, 403, 200, etc.)

### Security Requirements

1. **Never commit secrets:** Use environment variables via `.env` file
2. **Rate limiting:** All endpoints should respect existing rate limiters
3. **Input validation:** Validate all user inputs before processing
4. **JWT security:** Use existing JWT verification middleware for protected routes
5. **Type safety:** Leverage TypeScript to prevent security issues

### Environment Variables

Required variables (see `.env.example`):
- `JWT_SECRET` - Secret key for JWT signing (critical for security)
- `JWT_EXPIRATION` - Token expiration time (default: "24h")
- `PORT` - Server port (default: 3000)

## Common Tasks

### Adding a New API Endpoint

1. Add route definition in `src/index.ts`
2. Use existing rate limiters (`limiter` or `authLimiter`)
3. For protected routes, use `authenticateToken` middleware
4. Return consistent JSON responses
5. Update `API.md` documentation if public-facing

Example:
```typescript
app.get('/api/new-endpoint', authenticateToken, (req, res) => {
  res.json({ message: 'Success', data: { /* ... */ } });
});
```

### Modifying Authentication

- JWT logic is in `src/auth/jwt.ts`
- Three main exports: `generateToken`, `verifyToken`, `authenticateToken`
- Always maintain backward compatibility with existing tokens
- Test thoroughly with `test.sh`

### Updating Dependencies

1. Update `package.json`
2. Run `npm install`
3. Test with `npm run lint && npm run build`
4. Verify `test.sh` still passes
5. Document in `CHANGELOG.md`

## Documentation Requirements

When making changes, update relevant documentation:

- **API.md** - For API endpoint changes
- **ARCHITECTURE.md** - For architectural changes
- **README.md** - For user-facing feature changes
- **CHANGELOG.md** - For all changes (follow existing format)
- **CONTRIBUTING.md** - For development process changes

## Deployment Considerations

### Railway Deployment
- Configuration in `railway.json`
- Automatically builds with `npm run build`
- Environment variables set in Railway dashboard
- No deployment scripts needed

### Docker Deployment
- `Dockerfile` defines container build
- Multi-stage build not used (simple single-stage)
- `.dockerignore` prevents unnecessary files in image

## Known Limitations

1. **No automated tests:** Currently uses `test.sh` (bash script), no Jest/Mocha
2. **In-memory rate limiting:** Not suitable for multi-instance deployments
3. **No database:** User data stored in JWT tokens only
4. **No token revocation:** Tokens valid until expiration
5. **No refresh tokens:** Tokens must be regenerated after expiration

## Don't Do This

❌ **Don't add testing frameworks** unless specifically requested (project uses `test.sh`)
❌ **Don't modify rate limiter without security review** (could introduce vulnerabilities)
❌ **Don't change TypeScript configuration** without understanding impact
❌ **Don't add runtime dependencies lightly** (keep project lightweight)
❌ **Don't remove or weaken security features**
❌ **Don't commit `.env` files** (use `.env.example` as template)

## Questions to Ask

When implementing features, consider:

1. **Security:** Does this introduce any security vulnerabilities?
2. **Breaking changes:** Will existing API consumers be affected?
3. **Type safety:** Are all types properly defined?
4. **Documentation:** What documentation needs updating?
5. **Testing:** How can this be tested with `test.sh`?
6. **Deployment:** Does this affect Railway/Docker deployment?

## Getting Help

- **Issue tracker:** Use GitHub Issues for bugs and features
- **Architecture docs:** See `ARCHITECTURE.md` for system design
- **API docs:** See `API.md` for endpoint specifications
- **Contributing guide:** See `CONTRIBUTING.md` for contribution process

## Examples of Good Contributions

✅ Adding new authenticated endpoint with proper middleware
✅ Improving error handling with better type safety
✅ Enhancing rate limiting configuration
✅ Adding input validation for existing endpoints
✅ Improving TypeScript types and interfaces
✅ Updating documentation to match code changes

## Quick Reference

**Lint:** `npm run lint`  
**Build:** `npm run build`  
**Dev:** `npm run dev`  
**Test:** Build first, then `./test.sh`  
**Production:** `npm start` (requires `npm run build` first)

**Main files:**
- `src/index.ts` - Express app and routes
- `src/auth/jwt.ts` - JWT authentication
- `src/routes/mcp.ts` - MCP endpoints for GitHub Copilot
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.json` - Linting rules
- `server.json` - MCP server specification

**MCP Documentation:**
- `.mcp/README.md` - MCP documentation index
- `.mcp/guides/PUBLISHING.md` - How to publish MCP servers
- `.mcp/guides/API_USAGE.md` - How to consume MCP APIs
- `.mcp/specs/API_SPEC.md` - Complete API reference

<!-- ═══════════════════════════════════════════════════════════════════════════
     SECTION 4: INFRASTRUCTURE UTILITIES
     ═══════════════════════════════════════════════════════════════════════════ -->

## 4. INFRASTRUCTURE UTILITIES (ALWAYS USE THESE)

### Error Handler (`src/utils/error-handler.ts`)

**Purpose:** Enterprise-grade error handling with retry, timeout, and categorization

**Core Functions:**
```typescript
// Automatic retry with exponential backoff
ErrorHandler.withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;           // Default: 3
    delayMs?: number;              // Default: 1000
    backoffMultiplier?: number;    // Default: 2
    retryableErrors?: ErrorCategory[];
    onRetry?: (attempt: number, error: AppError) => void;
  }
): Promise<T>

// Timeout protection
ErrorHandler.withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  timeoutError?: string
): Promise<T>

// Error creation helpers
ErrorHandler.validationError(message, field?, value?)
ErrorHandler.networkError(message, url?)
ErrorHandler.databaseError(message, operation?)
ErrorHandler.authenticationError(message?)
ErrorHandler.authorizationError(message?)
```

**Error Categories:**
- `VALIDATION` - Input validation failures
- `AUTHENTICATION` - Auth failures
- `AUTHORIZATION` - Permission errors
- `NETWORK` - Network connectivity issues
- `DATABASE` - Database operation errors
- `EXTERNAL_API` - Third-party service errors
- `INTERNAL` - Internal server errors
- `CONFIGURATION` - Config errors
- `RESOURCE` - Resource not found
- `TIMEOUT` - Operation timeouts

**Usage Example:**
```typescript
import { ErrorHandler } from '../utils/error-handler';

async function fetchUserData(userId: string): Promise<UserData> {
  // Validate input
  if (!userId) {
    throw ErrorHandler.validationError('User ID is required', 'userId');
  }

  // Execute with retry and timeout
  return await ErrorHandler.withRetry(
    () => ErrorHandler.withTimeout(
      async () => {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw ErrorHandler.networkError(
            `Failed to fetch user: ${response.status}`,
            `/api/users/${userId}`
          );
        }
        return response.json();
      },
      5000 // 5 second timeout
    ),
    {
      maxRetries: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      retryableErrors: [ErrorCategory.NETWORK, ErrorCategory.TIMEOUT]
    }
  );
}
```

---

### Health Check Manager (`src/utils/health-check.ts`)

**Purpose:** Liveness and readiness probes for Kubernetes deployment

**Core Functions:**
```typescript
// Register a health check
healthCheckManager.register({
  name: string;
  check: () => Promise<{ healthy: boolean; message?: string }>;
  critical?: boolean;  // Default: true
  timeout?: number;    // Default: 5000ms
})

// Run all health checks
healthCheckManager.runAll(): Promise<HealthCheckResult>

// Check if system is healthy
healthCheckManager.isHealthy(): boolean

// Check if system is ready
healthCheckManager.isReady(): Promise<boolean>
```

**Built-in Checks:**
```typescript
import { memoryHealthCheck, eventLoopHealthCheck, uptimeHealthCheck } from '../utils/health-check';

// Memory usage check (default threshold: 90%)
healthCheckManager.register(memoryHealthCheck(90));

// Event loop lag check (default threshold: 100ms)
healthCheckManager.register(eventLoopHealthCheck(100));

// Uptime check (default minimum: 10 seconds)
healthCheckManager.register(uptimeHealthCheck(10));
```

**Health Endpoints Pattern:**
```typescript
import { healthCheckManager } from '../utils/health-check';

// Liveness probe - is the service alive?
app.get('/health/live', async (req, res) => {
  const result = await healthCheckManager.runAll();
  res.status(result.status === 'healthy' ? 200 : 503).json(result);
});

// Readiness probe - is the service ready for traffic?
app.get('/health/ready', async (req, res) => {
  const ready = await healthCheckManager.isReady();
  res.status(ready ? 200 : 503).json({ ready });
});
```

---

### Validation (`src/utils/validation.ts`)

**Purpose:** Input validation and sanitization to prevent security vulnerabilities

**Core Functions:**
```typescript
// Validate and throw on error
Validator.validateOrThrow<T>(data, schema, context?): T

// Sanitize string input (XSS prevention)
Validator.sanitizeString(input: string): string

// Sanitize HTML (preserve safe tags)
Validator.sanitizeHtml(input: string, allowedTags?: string[]): string

// Validate and sanitize URL
Validator.sanitizeUrl(url: string, allowedProtocols?: string[]): string

// Deep object sanitization
Validator.sanitizeObject(obj: any): any
```

**Pre-built Schemas:**
```typescript
import { commonSchemas } from '../utils/validation';

// Agent execution request
commonSchemas.agentExecutionRequest

// Workflow execution request
commonSchemas.workflowExecutionRequest

// Pagination parameters
commonSchemas.paginationParams

// Authentication request
commonSchemas.authRequest

// Browser automation task
commonSchemas.browserTask

// Data extraction configuration
commonSchemas.dataExtraction
```

**Express Middleware:**
```typescript
import { validateRequest, sanitizeRequest } from '../utils/validation';

// Apply sanitization to all requests
app.use(sanitizeRequest);

// Validate specific routes
app.post('/api/agent/execute',
  validateRequest(commonSchemas.agentExecutionRequest),
  asyncHandler(async (req, res) => {
    // req.body is now validated and sanitized
    const result = await executeAgent(req.body);
    res.json({ success: true, data: result });
  })
);
```

<!-- ═══════════════════════════════════════════════════════════════════════════
     SECTION 5: AGENT ENHANCEMENT FRAMEWORK
     ═══════════════════════════════════════════════════════════════════════════ -->

## 5. AGENT ENHANCEMENT FRAMEWORK

### Agent Definition Standard

All agents MUST follow the template in `.github/agents/AGENT_ENHANCEMENT_TEMPLATE.md`

**Required Sections (10 total):**
1. Error Handling Configuration
2. Input Validation Requirements
3. Health Check Configuration
4. Monitoring & Observability
5. Security & Access Control
6. Failure Recovery & Rollback
7. Performance Optimization
8. Testing & Validation
9. Documentation Requirements
10. Deployment & Operations

### Agent File Front Matter

```yaml
---
name: Agent Name
version: 2.0.0
description: One-line description
enterprise_ready: true
---
```

### Operational Runbook Requirements

Every agent MUST include an operational runbook with:

1. **Common Error Scenarios** (6+ scenarios)
   - Symptoms
   - Resolution steps
   - Prevention strategies

2. **Troubleshooting Commands**
   - Health check commands
   - Debug commands
   - Log viewing commands

3. **Monitoring Dashboard Metrics**
   - Key Performance Indicators (KPIs)
   - Alert thresholds
   - Target values

4. **Maintenance Procedures**
   - Daily tasks
   - Weekly tasks
   - Monthly tasks

5. **Escalation Procedures**
   - Level 1: Automated recovery
   - Level 2: Team lead review
   - Level 3: Engineering manager

6. **Emergency Procedures**
   - Emergency stop commands
   - Rollback procedures
   - Support contacts

### Example Enhanced Agent

See `.github/agents/comprehensive-audit-fixer.agent.md` for complete example with:
- 250+ lines of error handling configuration
- 200+ lines of operational runbook
- Complete troubleshooting guidance

### Creating New Agents

1. Copy `AGENT_ENHANCEMENT_TEMPLATE.md`
2. Fill in all 10 sections
3. Add operational runbook
4. Test and validate
5. Deploy

**Time Estimate:** ~43 minutes per agent

