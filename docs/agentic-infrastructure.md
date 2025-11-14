# Agentic Programming Infrastructure Guide

## Overview

This guide documents the complete agentic programming infrastructure for stackBrowserAgent, including security, LLM integration, automation, enhanced error handling, and team coordination systems.

## Table of Contents

1. [Security Layer](#security-layer)
2. [LLM Integration](#llm-integration)
3. [Automation Layer](#automation-layer)
4. [Enhanced Error Handling](#enhanced-error-handling)
5. [Team Coordination](#team-coordination)
6. [Integration Examples](#integration-examples)

---

## Security Layer

**File**: `src/utils/security.ts`

### Components

#### 1. Input Validator
Sanitizes and validates all input to prevent injection attacks.

```typescript
import { InputValidator } from './utils/security';

// Sanitize string input
const clean = InputValidator.sanitizeString(userInput, 1000);

// Validate URL
const isValid = InputValidator.validateUrl('https://example.com');

// Validate file path (prevents directory traversal)
const isSafePath = InputValidator.validatePath('/safe/path/file.txt');

// Validate command payload
const hasRequiredFields = InputValidator.validateCommandPayload(
  payload,
  ['url', 'type']
);

// Sanitize for logging (removes passwords, tokens, etc.)
const safe = InputValidator.sanitizeForLogging(sensitiveObject);
```

#### 2. Authentication & Authorization

```typescript
import { AuthManager } from './utils/security';

const authManager = new AuthManager();

// Register agent
const token = authManager.registerAgent({
  id: 'agent-1',
  name: 'Worker Agent',
  role: 'agent',
  capabilities: ['navigate', 'screenshot', 'analyze'],
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
});

// Authenticate
const agent = authManager.authenticate(token);

// Authorize action
const allowed = authManager.authorize(token, 'navigate');

// Revoke token
authManager.revokeToken(token);
```

**Roles:**
- `admin`: Full access to all capabilities
- `agent`: Limited to assigned capabilities
- `readonly`: Read-only access

#### 3. Secure Credential Management

```typescript
import { CredentialManager } from './utils/security';

const credentialManager = new CredentialManager('encryption-key-here');

// Store encrypted credential
credentialManager.store('api-key', 'secret-value-123', 86400000); // 24h TTL

// Retrieve and decrypt
const apiKey = credentialManager.retrieve('api-key');

// Rotate credential
credentialManager.rotate('api-key', 'new-secret-value-456');

// Check which credentials need rotation
const needsRotation = credentialManager.checkRotation();

// Delete credential
credentialManager.delete('api-key');
```

**Features:**
- AES-256-GCM encryption
- Automatic rotation detection (30-day interval)
- TTL support for temporary credentials
- Secure deletion

#### 4. Rate Limiting

```typescript
import { RateLimiter } from './utils/security';

const rateLimiter = new RateLimiter();

// Set limit: 100 requests per minute
rateLimiter.setLimit('agent-1', 100, 60000);

// Check if request allowed
if (rateLimiter.isAllowed('agent-1')) {
  // Process request
}

// Get remaining requests
const remaining = rateLimiter.getRemaining('agent-1');

// Reset limit
rateLimiter.reset('agent-1');
```

#### 5. Security Audit Log

```typescript
import { AuditLogger } from './utils/security';

const auditLogger = new AuditLogger();

// Log security event
auditLogger.log({
  agentId: 'agent-1',
  action: 'navigate',
  resource: 'https://example.com',
  result: 'success',
  details: { duration: 1234 },
});

// Verify log integrity (tamper detection)
const isIntact = auditLogger.verifyIntegrity();

// Get agent's audit history
const entries = auditLogger.getEntriesForAgent('agent-1', 100);

// Get failed attempts
const failures = auditLogger.getFailedAttempts(50);
```

**Features:**
- SHA-256 hash for tamper detection
- Automatic sensitive data redaction
- 10,000 entry rolling window
- Query by agent, result, or time

#### 6. Security Manager (Main Interface)

```typescript
import { SecurityManager } from './utils/security';

const security = new SecurityManager('encryption-key');

// Validate complete request
const validation = security.validateRequest(
  token,
  'navigate',
  'https://example.com',
  { url: 'https://example.com' }
);

if (validation.valid) {
  // Process authorized request
  const agent = validation.agent;
} else {
  // Handle error
  console.error(validation.error);
}
```

**Automatic Maintenance:**
- Hourly: Expired token cleanup
- Hourly: Audit log integrity check
- Daily: Credential rotation check

---

## LLM Integration

**File**: `src/utils/llm.ts`

### Ollama Integration

#### Setup Ollama

```bash
# Install Ollama (Mac/Linux)
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull codellama
ollama pull llama2
```

#### Using LLM Manager

```typescript
import { LLMManager } from './utils/llm';

const llm = new LLMManager({
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'codellama',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 60000,
});

// Check if available
const available = await llm.isAvailable();

// List available models
const models = await llm.listModels();

// Download new model
await llm.downloadModel('llama2');

// Switch model
llm.switchModel('llama2');
```

### Code Analysis

```typescript
const analysis = await llm.analyzeCode(`
function add(a, b) {
  return a + b;
}
`, 'javascript');

console.log(analysis);
// Returns: detailed analysis with bugs, performance, security
```

### Code Generation

```typescript
const code = await llm.generateCode(
  'Create a function that validates email addresses',
  'typescript'
);

console.log(code);
// Returns: production-ready TypeScript code
```

### Task Planning

```typescript
const plan = await llm.planTask(
  'Build a REST API for user management',
  'Using Express.js and TypeScript'
);

console.log(plan);
// Returns: step-by-step plan with dependencies
```

### Error Diagnosis

```typescript
const diagnosis = await llm.diagnoseError(
  'TypeError: Cannot read property "map" of undefined',
  'Occurred in user list component after API call'
);

console.log(diagnosis);
// Returns: root cause, solution, prevention strategies
```

### Documentation Generation

```typescript
const docs = await llm.generateDocumentation(`
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
`, 'typescript');

console.log(docs);
// Returns: JSDoc-style documentation
```

### Test Generation

```typescript
const tests = await llm.generateTests(`
export function isPalindrome(str: string): boolean {
  const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return clean === clean.split('').reverse().join('');
}
`, 'typescript', 'jest');

console.log(tests);
// Returns: Complete Jest test suite
```

### Conversation History

```typescript
// Start conversation with session ID
const response1 = await llm.generate('What is TypeScript?', 'session-1');

// Continue conversation
const response2 = await llm.generate('How do I use generics?', 'session-1');

// Get history
const history = llm.getHistory('session-1');

// Clear history
llm.clearHistory('session-1');
```

### Prompt Templates

```typescript
import { PromptTemplates } from './utils/llm';

// Use built-in templates
const messages = PromptTemplates.custom(
  'You are a helpful coding assistant',
  'Explain async/await in JavaScript'
);

const response = await llm.generate(messages);
```

### Context Window Management

```typescript
import { ContextWindowManager } from './utils/llm';

const contextManager = new ContextWindowManager(4096);

// Estimate tokens
const tokens = contextManager.estimateTokens('Your text here');

// Truncate messages to fit
const truncated = contextManager.truncateMessages(messages, 1000);

// Optimize prompt
const optimized = contextManager.optimizePrompt(longPrompt);
```

---

## Automation Layer

**File**: `src/utils/automation.ts`

### Task Queue Manager

```typescript
import { TaskQueueManager } from './utils/automation';

const taskQueue = new TaskQueueManager(5); // max 5 concurrent

// Register task handler
taskQueue.registerHandler('screenshot', async (task) => {
  // Take screenshot
  return await takeScreenshot(task.payload.url);
});

// Add task
const taskId = taskQueue.addTask({
  type: 'screenshot',
  priority: 'high',
  payload: { url: 'https://example.com' },
  dependencies: [], // Task IDs that must complete first
  maxRetries: 3,
});

// Get task status
const task = taskQueue.getTask(taskId);

// Cancel task
taskQueue.cancelTask(taskId);

// Get queue status
const status = taskQueue.getStatus();
console.log(status);
// {
//   pending: 5,
//   running: 3,
//   completed: 12,
//   tasks: { ... }
// }
```

**Task Events:**
```typescript
taskQueue.on('task:added', (task) => { });
taskQueue.on('task:started', (task) => { });
taskQueue.on('task:completed', (task) => { });
taskQueue.on('task:failed', (task) => { });
taskQueue.on('task:retry', (task) => { });
taskQueue.on('task:cancelled', (task) => { });
```

### State Monitoring

```typescript
import { StateMonitor } from './utils/automation';

const stateMonitor = new StateMonitor();

// Set state
stateMonitor.setState('browser-status', 'running');

// Get state
const status = stateMonitor.getState('browser-status');

// Watch for changes
stateMonitor.watch('browser-status', (oldValue, newValue) => {
  console.log(`Status changed: ${oldValue} -> ${newValue}`);
});

// Get all state
const allState = stateMonitor.getAllState();
```

### Automation Rules Engine

```typescript
import { AutomationEngine } from './utils/automation';

const automation = new AutomationEngine(stateMonitor);

// Register rule
automation.registerRule({
  name: 'restart-on-crash',
  trigger: 'state_change',
  condition: (change) => {
    return change.key === 'browser-status' && change.newValue === 'crashed';
  },
  action: async (change) => {
    await restartBrowser();
  },
  enabled: true,
});

// Trigger event-based rules
automation.triggerEvent('user-action', { action: 'button-click' });

// Enable/disable rules
automation.enableRule('restart-on-crash');
automation.disableRule('restart-on-crash');
```

**Rule Triggers:**
- `state_change`: Triggered on state changes
- `schedule`: Cron-like scheduling
- `event`: Custom event triggers
- `threshold`: Metric threshold triggers

### Resource Manager

```typescript
import { ResourceManager } from './utils/automation';

const resources = new ResourceManager();

// Allocate resources
const allocated = resources.allocate('task-123', 5); // priority 5

if (allocated) {
  // Execute task
  
  // Release when done
  resources.release('task-123');
}

// Get resource status
const status = resources.getStatus();
console.log(status);
// {
//   total: { memory: 1024, cpu: 100 },
//   available: { memory: 768, cpu: 75 },
//   allocated: { memory: 256, cpu: 25 }
// }
```

### Automation Manager (Main Interface)

```typescript
import { AutomationManager } from './utils/automation';

const automation = new AutomationManager(5); // max 5 concurrent

// Submit automated task
const taskId = await automation.submitTask('navigate', {
  url: 'https://example.com'
}, {
  priority: 'high',
  dependencies: ['task-previous-id']
});

// Get system status
const status = automation.getStatus();
```

---

## Enhanced Error Handling

**File**: `src/utils/error-handling.ts`

### Error Classification

```typescript
import { ErrorClassifier, ErrorCategory, ErrorSeverity } from './utils/error-handling';

const classifier = new ErrorClassifier();

// Classify error
const { category, severity } = classifier.classify(error);

console.log(category); // 'recoverable', 'degraded', or 'fatal'
console.log(severity); // 'low', 'medium', 'high', or 'critical'

// Register custom pattern
classifier.registerPattern({
  pattern: /Custom error pattern/i,
  category: ErrorCategory.RECOVERABLE,
  severity: ErrorSeverity.LOW,
  recoveryStrategy: 'retry',
});
```

### Error Correlation

```typescript
import { ErrorCorrelationEngine } from './utils/error-handling';

const correlation = new ErrorCorrelationEngine();

// Errors are automatically correlated

// Analyze root cause
const analysis = correlation.analyzeRootCause('error-id-123');
console.log(analysis.rootCause);
console.log(analysis.chain); // Chain of related errors

// Detect patterns
const patterns = correlation.detectPatterns();
// Returns: [{ pattern: 'Connection timeout', count: 15, severity: 'medium' }, ...]
```

### Predictive Error Detection

```typescript
import { PredictiveErrorDetector } from './utils/error-handling';

const predictor = new PredictiveErrorDetector();

// Set thresholds
predictor.setThreshold('memory-usage', 80, 95); // warning at 80%, critical at 95%

// Track metrics
predictor.trackMetric('memory-usage', 75);

// Listen for anomalies
predictor.on('anomaly:critical', (data) => {
  console.log(`Critical: ${data.metric} = ${data.value}`);
});

predictor.on('anomaly:warning', (data) => {
  console.log(`Warning: ${data.metric} = ${data.value}`);
});

// Get predictions
const predictions = predictor.predictErrors();
// Returns: [{ metric: 'memory', prediction: 'Potential exhaustion', confidence: 85 }]
```

### Rollback Manager

```typescript
import { RollbackManager } from './utils/error-handling';

const rollback = new RollbackManager();

// Create checkpoint
const checkpointId = rollback.createCheckpoint('Before major change', currentState);

try {
  // Perform risky operation
} catch (error) {
  // Rollback to checkpoint
  const previousState = rollback.rollback(checkpointId);
  restoreState(previousState);
}

// List checkpoints
const checkpoints = rollback.listCheckpoints();

// Get latest
const latest = rollback.getLatest();
```

### Graceful Degradation

```typescript
import { DegradationManager } from './utils/error-handling';

const degradation = new DegradationManager();

// Register fallback
degradation.registerFallback('screenshot', async () => {
  return await takeSimpleScreenshot(); // Fallback implementation
});

// Execute with automatic fallback
const result = await degradation.executeWithFallback(
  'screenshot',
  async () => await takeAdvancedScreenshot(), // Primary
  async () => await takeSimpleScreenshot()     // Fallback (optional)
);

// Check feature availability
if (degradation.isAvailable('screenshot')) {
  // Use full feature
} else {
  // Feature is degraded, using fallback
}

// Get status
const status = degradation.getStatus();
console.log(status.degradedFeatures);
console.log(status.availableFeatures);
```

### Enhanced Error Manager (Main Interface)

```typescript
import { EnhancedErrorManager } from './utils/error-handling';

const errorManager = new EnhancedErrorManager();

// Handle error
const result = await errorManager.handleError(error, {
  feature: 'browser-launch',
  attempt: 1,
});

console.log(result.recovered); // true/false
console.log(result.action);    // 'retry', 'degrade', 'rollback', 'shutdown'

// Get statistics
const stats = errorManager.getStatistics();
console.log(stats);
// {
//   totalErrors: 42,
//   patterns: [...],
//   predictions: [...],
//   degradation: {...},
//   checkpoints: 5
// }

// Listen to events
errorManager.on('error', (error) => { });
errorManager.on('predictive:critical', (data) => { });
errorManager.on('predictions', (predictions) => { });
```

---

## Team Coordination

**File**: `src/utils/coordination.ts`

### Message Bus

```typescript
import { MessageBus } from './utils/coordination';

const messageBus = new MessageBus();

// Subscribe to messages
messageBus.subscribe('agent-1', (message) => {
  console.log('Received:', message);
});

// Send message
const messageId = messageBus.send({
  from: 'agent-1',
  to: 'agent-2', // or ['agent-2', 'agent-3'] for broadcast
  type: 'request',
  payload: { action: 'screenshot', url: 'https://example.com' },
  correlationId: 'conv-123',
});

// Get message history
const history = messageBus.getHistory('agent-1', 100);

// Get correlated messages
const thread = messageBus.getCorrelated('conv-123');

// Unsubscribe
messageBus.unsubscribe('agent-1');
```

### Agent Registry

```typescript
import { AgentRegistry } from './utils/coordination';

const registry = new AgentRegistry();

// Register agent
registry.register({
  id: 'agent-1',
  name: 'Browser Agent',
  type: 'browser-automation',
  capabilities: [
    {
      name: 'navigate',
      description: 'Navigate to URL',
      version: '1.0.0',
      inputs: ['url'],
      outputs: ['screenshot', 'html'],
    },
  ],
  status: 'idle',
  load: 0,
  lastSeen: new Date(),
});

// Update status
registry.updateStatus('agent-1', 'busy', 75);

// Find agents by capability
const agents = registry.findByCapability('navigate');

// Get best agent (lowest load)
const best = registry.getBestAgent('navigate');

// List all agents
const all = registry.listAgents();

// Unregister
registry.unregister('agent-1');
```

### Task Handoff

```typescript
import { HandoffManager } from './utils/coordination';

const handoff = new HandoffManager(messageBus);

// Initiate handoff
const taskId = await handoff.initiateHandoff(
  'task-123',
  'agent-1',
  'agent-2',
  { progress: 50, data: {...} }, // Current state
  { reason: 'overload' }          // Context
);

// Accept handoff (from receiving agent)
const accepted = handoff.acceptHandoff('task-123', 'agent-2');

// Or reject
handoff.rejectHandoff('task-123', 'agent-2', 'Insufficient resources');

// Complete handoff
handoff.completeHandoff('task-123');

// Get status
const status = handoff.getHandoff('task-123');

// Listen to events
handoff.on('handoff:initiated', (h) => { });
handoff.on('handoff:accepted', (h) => { });
handoff.on('handoff:completed', (h) => { });
```

### Shared Memory

```typescript
import { SharedMemoryManager } from './utils/coordination';

const sharedMemory = new SharedMemoryManager();

// Store value
sharedMemory.set('config', { setting: 'value' }, 'agent-1', {
  ttl: 60000,           // 1 minute
  access: 'public',     // 'public', 'protected', 'private'
});

// Get value
const config = sharedMemory.get('config', 'agent-2');

// Lock key
const locked = sharedMemory.lock('config', 'agent-1', 30000); // 30s timeout

if (locked) {
  // Modify safely
  sharedMemory.set('config', newConfig, 'agent-1');
  
  // Unlock
  sharedMemory.unlock('config', 'agent-1');
}

// List keys
const keys = sharedMemory.listKeys('agent-1');

// Delete
sharedMemory.delete('config', 'agent-1');

// Get status
const status = sharedMemory.getStatus();
```

### Load Balancer

```typescript
import { LoadBalancer } from './utils/coordination';

const loadBalancer = new LoadBalancer(registry, 'least-load');

// Select agent for capability
const agent = loadBalancer.selectAgent('navigate');

if (agent) {
  // Use selected agent
}

// Change strategy
loadBalancer.setStrategy('round-robin'); // or 'least-load', 'random'
```

### Coordination Manager (Main Interface)

```typescript
import { CoordinationManager } from './utils/coordination';

const coordination = new CoordinationManager();

// Access all subsystems
const { messageBus, registry, handoffManager, sharedMemory, loadBalancer } = coordination;

// Get overall status
const status = coordination.getStatus();
console.log(status);
// {
//   agents: 5,
//   messages: 142,
//   sharedMemory: { entries: 12, locks: 2, ... }
// }
```

---

## Integration Examples

### Complete Agent with All Systems

```typescript
import { SecurityManager } from './utils/security';
import { LLMManager } from './utils/llm';
import { AutomationManager } from './utils/automation';
import { EnhancedErrorManager } from './utils/error-handling';
import { CoordinationManager } from './utils/coordination';

class FullyIntegratedAgent {
  private security: SecurityManager;
  private llm: LLMManager;
  private automation: AutomationManager;
  private errorManager: EnhancedErrorManager;
  private coordination: CoordinationManager;
  private agentId: string;

  constructor() {
    this.security = new SecurityManager();
    this.llm = new LLMManager({
      provider: 'ollama',
      model: 'codellama',
    });
    this.automation = new AutomationManager();
    this.errorManager = new EnhancedErrorManager();
    this.coordination = new CoordinationManager();
    this.agentId = 'agent-' + Date.now();

    this.registerAgent();
    this.setupAutomation();
  }

  private registerAgent() {
    // Register with coordination
    this.coordination.registry.register({
      id: this.agentId,
      name: 'Integrated Agent',
      type: 'full-stack',
      capabilities: [
        {
          name: 'code-analysis',
          description: 'Analyze code using LLM',
          version: '1.0.0',
          inputs: ['code', 'language'],
          outputs: ['analysis'],
        },
      ],
      status: 'idle',
      load: 0,
      lastSeen: new Date(),
    });

    // Subscribe to messages
    this.coordination.messageBus.subscribe(this.agentId, async (message) => {
      await this.handleMessage(message);
    });
  }

  private setupAutomation() {
    // Register task handlers
    this.automation.taskQueue.registerHandler('analyze-code', async (task) => {
      return await this.llm.analyzeCode(task.payload.code, task.payload.language);
    });

    // Set up automation rules
    this.automation.automationEngine.registerRule({
      name: 'error-recovery',
      trigger: 'state_change',
      condition: (change) => change.key === 'error-count' && change.newValue > 5,
      action: async () => {
        // Create checkpoint and attempt recovery
        const checkpoint = this.errorManager.rollbackManager.createCheckpoint(
          'Before recovery',
          this.getCurrentState()
        );
      },
      enabled: true,
    });
  }

  async handleMessage(message: any) {
    try {
      // Validate request
      const validation = this.security.validateRequest(
        message.payload.token,
        message.type,
        message.from,
        message.payload
      );

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Process based on type
      switch (message.type) {
        case 'request':
          await this.handleRequest(message);
          break;
        case 'handoff':
          await this.handleHandoff(message);
          break;
      }
    } catch (error: any) {
      // Enhanced error handling
      const result = await this.errorManager.handleError(error, {
        message: message.id,
        agent: this.agentId,
      });

      if (!result.recovered) {
        // Notify sender of failure
        this.coordination.messageBus.send({
          from: this.agentId,
          to: message.from,
          type: 'response',
          payload: { error: error.message },
          replyTo: message.id,
        });
      }
    }
  }

  async handleRequest(message: any) {
    // Submit as automated task
    const taskId = await this.automation.submitTask('analyze-code', message.payload, {
      priority: 'normal',
    });

    // Update load
    this.coordination.registry.updateStatus(this.agentId, 'busy', 50);
  }

  async handleHandoff(message: any) {
    // Accept handoff
    const handoff = this.coordination.handoffManager.acceptHandoff(
      message.payload.taskId,
      this.agentId
    );

    if (handoff) {
      // Continue task from handoff state
      const result = await this.continueTask(handoff.state, handoff.context);

      // Complete handoff
      this.coordination.handoffManager.completeHandoff(handoff.taskId);
    }
  }

  async continueTask(state: any, context: any) {
    // Implementation
  }

  getCurrentState() {
    return {
      tasks: this.automation.taskQueue.getStatus(),
      errors: this.errorManager.getStatistics(),
    };
  }
}
```

### Usage

```typescript
const agent = new FullyIntegratedAgent();

// Agent is now:
// - Secured with authentication/authorization
// - Can analyze code using LLM
// - Automatically manages tasks
// - Handles errors gracefully
// - Coordinates with other agents
```

---

## Best Practices

### Security

1. **Always validate input** before processing
2. **Use authentication** for all agent interactions
3. **Rotate credentials** regularly (check daily)
4. **Monitor audit logs** for suspicious activity
5. **Use rate limiting** to prevent abuse

### LLM Integration

1. **Check availability** before making requests
2. **Handle timeouts** gracefully (60s default)
3. **Manage context window** to avoid truncation
4. **Use appropriate models** for tasks (codellama for code)
5. **Clear conversation history** after completion

### Automation

1. **Set appropriate priorities** for tasks
2. **Define dependencies** clearly
3. **Implement proper cleanup** in handlers
4. **Monitor resource usage**
5. **Use automation rules** for common patterns

### Error Handling

1. **Create checkpoints** before risky operations
2. **Set up predictive thresholds** early
3. **Register fallback handlers** for critical features
4. **Monitor error patterns** regularly
5. **Test recovery strategies**

### Team Coordination

1. **Register capabilities** accurately
2. **Update status** regularly (load, availability)
3. **Use message correlation** for conversations
4. **Clean up shared memory** after use
5. **Handle handoff failures** gracefully

---

## Performance Considerations

- **Security**: Minimal overhead (<1ms per validation)
- **LLM**: Variable (2-30s depending on model/prompt)
- **Automation**: Efficient task queue (handles 100+ tasks)
- **Error Handling**: Lightweight (<0.1ms per error)
- **Coordination**: Low latency messaging (<1ms)

## Resource Requirements

- **Memory**: ~50MB for all systems
- **CPU**: Minimal when idle, spikes during LLM requests
- **Network**: Only for Ollama communication (local)
- **Storage**: <10MB for logs and state

---

## Troubleshooting

### Ollama Connection Issues

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
ollama serve
```

### High Memory Usage

```typescript
// Clear conversation histories
llm.clearHistory('session-id');

// Reduce task queue size
automation.taskQueue.maxConcurrent = 3;

// Clean up shared memory
sharedMemory.delete('old-key', agentId);
```

### Rate Limit Exceeded

```typescript
// Increase limits
rateLimiter.setLimit('agent-id', 200, 60000); // 200/min

// Or reset
rateLimiter.reset('agent-id');
```

---

## Next Steps

1. Review each system's documentation
2. Implement security for your agents
3. Set up Ollama for LLM capabilities
4. Define automation rules
5. Configure error handling strategies
6. Register agents with coordination

For more examples, see the `tests/` directory.
