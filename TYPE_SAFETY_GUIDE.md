# Type Safety Implementation Guide

## Quick Start

This guide shows how to eliminate `any` types using the new type-safe infrastructure.

## New Type System Components

### 1. Type Guards (`src/types/type-guards.ts`)

Runtime type validation with zero performance overhead:

```typescript
import { isString, isObject, isArrayOf, typeGuardRegistry } from '../types/type-guards';

// Simple type check
if (isString(value)) {
  // value is string here
  console.log(value.toUpperCase());
}

// Array type check
if (isArrayOf(isString)(value)) {
  // value is string[] here
  value.forEach(s => console.log(s.length));
}

// Register custom type guard
typeGuardRegistry.register('myType', (v): v is MyType => {
  return isObject(v) && 'requiredProp' in v;
});
```

### 2. Enhanced Types

#### Automation Types (`src/types/automation.ts`)

```typescript
import { Task, TaskPayload, TaskHandler } from '../types/automation';

// Define specific payload type
interface CodeAnalysisPayload extends TaskPayload {
  code: string;
  language: string;
}

// Type-safe task
const task: Task<CodeAnalysisPayload> = {
  id: '123',
  type: 'analyze',
  priority: 'high',
  payload: { code: '...', language: 'typescript' },
  status: 'pending',
  createdAt: new Date()
};

// Type-safe handler
const handler: TaskHandler<CodeAnalysisPayload, AnalysisResult> = async (payload) => {
  // payload.code and payload.language are strongly typed
  return analyzeCode(payload.code, payload.language);
};
```

#### Coordination Types (`src/types/coordination.ts`)

```typescript
import { Message, AgentMetadata, SharedMemoryEntry } from '../types/coordination';

// Type-safe message
interface NavigatePayload {
  url: string;
  timeout?: number;
}

const message: Message<NavigatePayload> = {
  id: 'msg-1',
  from: 'agent-1',
  to: 'agent-2',
  type: 'navigate',
  payload: { url: 'https://example.com' },
  priority: 'normal',
  timestamp: new Date()
};

// Type-safe shared memory
const entry: SharedMemoryEntry<string> = {
  key: 'config',
  value: 'some-config-value',
  owner: 'agent-1',
  accessLevel: 'public',
  createdAt: new Date(),
  updatedAt: new Date(),
  locked: false
};
```

## Migration Patterns

### Pattern 1: Replace `any` with Generics

**Before:**
```typescript
function processTask(task: any): any {
  return task.data;
}
```

**After:**
```typescript
function processTask<T>(task: Task<T>): T {
  return task.payload;
}
```

### Pattern 2: Replace `any` with `unknown` + Type Guards

**Before:**
```typescript
function validate(data: any): boolean {
  return data.isValid;
}
```

**After:**
```typescript
import { isObject, hasProperty } from '../types/type-guards';

function validate(data: unknown): boolean {
  if (!isObject(data)) return false;
  if (!hasProperty('isValid')(data)) return false;
  return Boolean(data.isValid);
}
```

### Pattern 3: Discriminated Unions for Dynamic Types

**Before:**
```typescript
interface Message {
  type: string;
  payload: any;
}
```

**After:**
```typescript
type Message =
  | { type: 'navigate'; payload: { url: string } }
  | { type: 'analyze'; payload: { code: string } }
  | { type: 'custom'; payload: Record<string, unknown> };

function handleMessage(msg: Message) {
  switch (msg.type) {
    case 'navigate':
      // msg.payload.url is string
      console.log(msg.payload.url);
      break;
    case 'analyze':
      // msg.payload.code is string
      console.log(msg.payload.code);
      break;
  }
}
```

### Pattern 4: Record Types for Dynamic Objects

**Before:**
```typescript
function parseConfig(config: any) {
  return config.settings;
}
```

**After:**
```typescript
function parseConfig(config: Record<string, unknown>) {
  if ('settings' in config) {
    return config.settings;
  }
  return null;
}
```

## File-by-File Migration

### automation.ts (33 warnings)

**Priority**: HIGH (most warnings)

**Target areas:**
1. Task payload types → Use `Task<TPayload>`
2. State values → Use `StateChangeEvent<T>`
3. Event handlers → Use typed callbacks
4. Rule conditions/actions → Use generic `AutomationRule<TCond, TAction>`

**Example fix:**
```typescript
// Before
private tasks: Map<string, any> = new Map();

// After
private tasks: Map<string, Task<TaskPayload>> = new Map();
```

### coordination.ts (11 warnings)

**Priority**: HIGH

**Target areas:**
1. Message payloads → Use `Message<TPayload>`
2. Agent metadata → Use `AgentMetadata`
3. Shared memory values → Use `SharedMemoryEntry<T>`

### security.ts (10 warnings)

**Priority**: MEDIUM

**Target areas:**
1. Credential structures → Define specific interfaces
2. Validation inputs → Use `unknown` + guards
3. Audit log data → Use typed events

### error-handling.ts (7 warnings)

**Priority**: MEDIUM

**Target areas:**
1. Error contexts → Define `ErrorContext` interface
2. Recovery data → Use typed recovery states

### llm.ts (7 warnings)

**Priority**: MEDIUM

**Target areas:**
1. Model responses → Define response interfaces
2. Prompt variables → Use `Record<string, string | number>`

## Performance Considerations

### Type Guard Caching

The `TypeGuardRegistry` automatically tracks validation statistics:

```typescript
const stats = typeGuardRegistry.getStats('myType');
console.log(`Success rate: ${stats.successRate}%`);
```

### Validation Cost Budget

- Target: < 1ms per validation
- Measurement: Add to performance tracking
- Optimization: Use LRU cache for repeated validations

## Testing Type Safety

### Compile-Time Tests

```typescript
// This should NOT compile
const task: Task<{ code: string }> = {
  payload: { code: 123 } // ERROR: Type 'number' is not assignable to type 'string'
};
```

### Runtime Tests

```typescript
import { assert, isString } from '../types/type-guards';

test('validates string type', () => {
  const value: unknown = 'test';
  assert(value, isString);
  expect(value.length).toBe(4); // value is string here
});
```

## Rollout Strategy

### Phase 1: Foundation (Day 1-2)
- [x] Create type guard system
- [x] Create enhanced type definitions
- [x] Update package.json for Zod (optional)
- [ ] Add type safety metrics to health monitoring

### Phase 2: Critical Files (Day 3-5)
- [ ] Refactor automation.ts
- [ ] Refactor coordination.ts
- [ ] Run tests and verify no regressions

### Phase 3: Remaining Files (Day 6-7)
- [ ] Refactor security.ts
- [ ] Refactor error-handling.ts
- [ ] Refactor llm.ts
- [ ] Final verification

### Phase 4: Validation (Day 8)
- [ ] Run full lint (expect 0 warnings)
- [ ] Run all tests
- [ ] Performance benchmark
- [ ] Update documentation

## Success Criteria

- ✅ 0 `@typescript-eslint/no-explicit-any` warnings
- ✅ All tests passing
- ✅ < 1% performance degradation
- ✅ Build time < 30 seconds
- ✅ Type safety metrics in health dashboard

## Troubleshooting

### Issue: Too Many Type Errors

**Solution**: Migrate incrementally. Use `unknown` as intermediate step:

```typescript
// Step 1: Replace any with unknown
function process(data: unknown) { }

// Step 2: Add type guards
function process(data: unknown) {
  if (isObject(data)) {
    // now data is Record<string, unknown>
  }
}

// Step 3: Define specific types
interface ProcessData { id: string; value: number }
function process(data: unknown) {
  if (isObjectWithShape<ProcessData>({ id: isString, value: isNumber })(data)) {
    // now data is ProcessData
  }
}
```

### Issue: External Library Returns `any`

**Solution**: Wrap with type-safe adapter:

```typescript
// External library
declare function externalApi(): any;

// Type-safe wrapper
function safeExternalApi(): string | null {
  const result: unknown = externalApi();
  return isString(result) ? result : null;
}
```

### Issue: Performance Concern

**Solution**: Measure first, optimize if needed:

```typescript
console.time('validation');
const isValid = typeGuardRegistry.validate('myType', data);
console.timeEnd('validation'); // Should be < 1ms
```

## Next Steps

1. Review this guide
2. Start with Phase 1 (foundation already complete)
3. Begin Phase 2 (automation.ts refactor)
4. Track progress with type safety metrics
5. Deploy incrementally with feature flags

## Resources

- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Production Readiness Strategy](./PRODUCTION_READINESS_STRATEGY.md)
- [Quality Audit](./QUALITY_AUDIT.md)
