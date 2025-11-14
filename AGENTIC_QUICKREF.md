# Agentic Infrastructure Quick Reference

## System Files Overview

| System | File | Size | Purpose |
|--------|------|------|---------|
| Security | `src/utils/security.ts` | 17KB | Authentication, encryption, audit logging |
| LLM | `src/utils/llm.ts` | 13.5KB | Local AI for code analysis & generation |
| Automation | `src/utils/automation.ts` | 15KB | Task orchestration & resource management |
| Error Handling | `src/utils/error-handling.ts` | 15KB | Classification, prediction, recovery |
| Coordination | `src/utils/coordination.ts` | 15KB | Inter-agent messaging & collaboration |

## Quick Start Examples

### 1. Secure Agent Setup

```typescript
import { SecurityManager } from './utils/security';

const security = new SecurityManager('encryption-key');

// Register agent
const token = security.auth.registerAgent({
  name: 'Worker Agent',
  role: 'agent',
  capabilities: ['navigate', 'analyze'],
});

// Validate request
const { valid, agent } = security.validateRequest(
  token, 'navigate', 'https://example.com'
);
```

### 2. LLM Code Analysis

```typescript
import { LLMManager } from './utils/llm';

const llm = new LLMManager({
  provider: 'ollama',
  model: 'codellama',
});

// Analyze code
const analysis = await llm.analyzeCode(code, 'typescript');

// Generate tests
const tests = await llm.generateTests(code, 'typescript', 'jest');
```

### 3. Automated Task Queue

```typescript
import { AutomationManager } from './utils/automation';

const automation = new AutomationManager(5); // max 5 concurrent

// Register handler
automation.taskQueue.registerHandler('process', async (task) => {
  return await processTask(task.payload);
});

// Submit task
const taskId = await automation.submitTask('process', data, {
  priority: 'high',
  dependencies: ['task-1'],
});
```

### 4. Error Handling with Recovery

```typescript
import { EnhancedErrorManager } from './utils/error-handling';

const errorMgr = new EnhancedErrorManager();

// Create checkpoint
const cpId = errorMgr.rollbackManager.createCheckpoint('Before operation', state);

try {
  // Risky operation
} catch (error) {
  // Handle with classification & recovery
  const { recovered, action } = await errorMgr.handleError(error, context);
  
  if (!recovered) {
    const prevState = errorMgr.rollbackManager.rollback(cpId);
  }
}
```

### 5. Agent Coordination

```typescript
import { CoordinationManager } from './utils/coordination';

const coord = new CoordinationManager();

// Register agent
coord.registry.register({
  id: 'agent-1',
  name: 'Browser Agent',
  capabilities: [{ name: 'navigate', ... }],
  status: 'idle',
  load: 0,
});

// Send message
coord.messageBus.send({
  from: 'agent-1',
  to: 'agent-2',
  type: 'request',
  payload: { action: 'screenshot' },
});

// Store in shared memory
coord.sharedMemory.set('config', data, 'agent-1', {
  access: 'public',
  ttl: 60000,
});
```

## Component Integration Map

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY LAYER (validates all)             │
│  • Authentication  • Authorization  • Audit Logging          │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        ↓                                       ↓
┌──────────────────┐                   ┌──────────────────┐
│  AUTOMATION      │                   │  COORDINATION    │
│  • Task Queue    │←──────────────────→│  • Message Bus   │
│  • Scheduling    │                   │  • Registry      │
│  • Resources     │                   │  • Handoff       │
└──────────────────┘                   └──────────────────┘
        ↓                                       ↓
┌──────────────────┐                   ┌──────────────────┐
│  ERROR HANDLER   │                   │  LLM MANAGER     │
│  • Classification│                   │  • Code Analysis │
│  • Recovery      │                   │  • Generation    │
│  • Prediction    │                   │  • Planning      │
└──────────────────┘                   └──────────────────┘
```

## Configuration Summary

### Environment Variables

```env
# Security
ENCRYPTION_KEY=your-32-char-hex-key-here

# LLM
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=codellama

# Automation
MAX_CONCURRENT_TASKS=5
TASK_RETRY_LIMIT=3

# Logging
LOG_LEVEL=info
```

### Default Limits

- **Security**:
  - Token expiry: 24 hours
  - Rate limit: 100 requests/minute
  - Audit log: 10,000 entries

- **LLM**:
  - Context window: 4,096 tokens
  - Request timeout: 60 seconds
  - Conversation history: 20 messages

- **Automation**:
  - Max concurrent: 5 tasks
  - Max retries: 3
  - Resource memory: 1024 MB
  - Resource CPU: 100%

- **Error Handling**:
  - Error history: 1,000 entries
  - Checkpoints: 10 max
  - Prediction window: 100 metrics

- **Coordination**:
  - Message history: 1,000 messages
  - Shared memory: Unlimited (with TTL)
  - Lock timeout: 30 seconds

## Common Patterns

### Pattern 1: Secure LLM Task

```typescript
// Validate → Analyze with LLM → Store result
const { valid } = security.validateRequest(token, 'analyze', resource);
if (!valid) throw new Error('Unauthorized');

const analysis = await llm.analyzeCode(code, 'typescript');

coord.sharedMemory.set('analysis-result', analysis, agentId, {
  access: 'public',
  ttl: 3600000,
});
```

### Pattern 2: Automated Error Recovery

```typescript
// Task with automatic error recovery
automation.taskQueue.registerHandler('risky-task', async (task) => {
  const cpId = errorMgr.rollbackManager.createCheckpoint('Before task', state);
  
  try {
    return await performRiskyOperation(task.payload);
  } catch (error) {
    const { recovered } = await errorMgr.handleError(error);
    if (!recovered) {
      const prevState = errorMgr.rollbackManager.rollback(cpId);
      await restoreState(prevState);
    }
    throw error;
  }
});
```

### Pattern 3: Multi-Agent Collaboration

```typescript
// Agent A requests help from Agent B
const bestAgent = coord.loadBalancer.selectAgent('data-processing');

coord.messageBus.send({
  from: 'agent-a',
  to: bestAgent.id,
  type: 'request',
  payload: { task: 'process-data', data: largeDataset },
});

// Agent B processes and responds
coord.messageBus.subscribe('agent-b', async (message) => {
  const result = await processData(message.payload.data);
  
  coord.messageBus.send({
    from: 'agent-b',
    to: message.from,
    type: 'response',
    payload: { result },
    replyTo: message.id,
  });
});
```

### Pattern 4: Task Handoff

```typescript
// Agent A starts task but gets overloaded
const taskState = { progress: 50, data: partialResult };

await coord.handoffManager.initiateHandoff(
  'task-123',
  'agent-a',
  'agent-b',
  taskState,
  { reason: 'overload', priority: 'high' }
);

// Agent B accepts and continues
const handoff = coord.handoffManager.acceptHandoff('task-123', 'agent-b');
if (handoff) {
  const finalResult = await continueTask(handoff.state);
  coord.handoffManager.completeHandoff('task-123');
}
```

### Pattern 5: Predictive Error Prevention

```typescript
// Set up predictive monitoring
errorMgr.predictor.setThreshold('memory-usage', 80, 95);
errorMgr.predictor.setThreshold('error-rate', 5, 10);

// Track metrics
errorMgr.predictor.trackMetric('memory-usage', currentMemory);
errorMgr.predictor.trackMetric('error-rate', errors.length);

// React to predictions
errorMgr.on('predictive:critical', async (data) => {
  logger.error(`Critical anomaly: ${data.metric}`);
  
  // Take preventive action
  if (data.metric === 'memory-usage') {
    await cleanup();
  }
});
```

## Testing Checklist

### Security
- [ ] Authentication with valid/invalid tokens
- [ ] Authorization with different roles
- [ ] Rate limiting enforcement
- [ ] Credential encryption/decryption
- [ ] Audit log integrity

### LLM
- [ ] Ollama connection
- [ ] Code analysis quality
- [ ] Model switching
- [ ] Context window management
- [ ] Timeout handling

### Automation
- [ ] Task queue ordering (priority)
- [ ] Dependency resolution
- [ ] Concurrent execution limit
- [ ] Resource allocation
- [ ] Retry logic

### Error Handling
- [ ] Error classification accuracy
- [ ] Recovery strategy execution
- [ ] Rollback functionality
- [ ] Degradation mode
- [ ] Predictive detection

### Coordination
- [ ] Message delivery
- [ ] Agent discovery
- [ ] Task handoff flow
- [ ] Shared memory access
- [ ] Load balancing

## Performance Benchmarks

| Operation | Expected Time | Memory |
|-----------|--------------|---------|
| Security validation | <1ms | <1KB |
| LLM code analysis | 2-30s | ~100MB |
| Task queue add | <1ms | <1KB |
| Error classification | <0.1ms | <1KB |
| Message send | <1ms | <1KB |
| Shared memory set | <1ms | Variable |

## Troubleshooting Quick Guide

| Issue | Check | Solution |
|-------|-------|----------|
| "Authentication failed" | Token validity | Regenerate token |
| "Ollama connection error" | Ollama running | Start `ollama serve` |
| "Rate limit exceeded" | Request count | Increase limit or wait |
| "Task queue full" | Queue size | Wait or increase max concurrent |
| "Handoff rejected" | Target agent | Check agent availability |
| "Memory lock failed" | Existing lock | Wait for timeout or force unlock |

## Next Steps

1. **Implement Security First**: Set up `SecurityManager` for your agents
2. **Add LLM if Needed**: Install Ollama and configure models
3. **Define Tasks**: Register handlers in `AutomationManager`
4. **Set Up Error Handling**: Configure thresholds and fallbacks
5. **Register Agents**: Add to `CoordinationManager` registry
6. **Test Integration**: Run through common patterns

For detailed documentation, see `docs/agentic-infrastructure.md`.

## Support

- Issues: https://github.com/stackconsult/stackBrowserAgent/issues
- Documentation: `docs/` directory
- Examples: See documentation for complete examples
