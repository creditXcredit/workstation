# Temporal Container System - Test Implementation Plan

## Overview

This document provides a **complete, executable test plan** for validating the temporal container hypothesis. The plan ensures quality without wasting time through automated verification, parallel execution, and early exit conditions.

---

## Test Architecture

### Dual-Branch Strategy

```
main branch (current)
  ├─ test/temporal-containers-main (implement containers)
  └─ test/temporal-containers-rollback (baseline, NO changes)
```

**Why Dual-Branch?**
- **Isolation**: Test changes don't affect production code
- **Comparison**: Direct A/B comparison with identical starting point
- **Safety**: Instant rollback if issues detected
- **Parallel**: Both can be tested simultaneously

---

## Phase 1: Branch Setup & Verification (30 minutes)

### 1.1 Create Test Branches

```bash
# From current branch (copilot/setup-repo-and-assess-files)
git checkout -b test/temporal-containers-rollback
git push origin test/temporal-containers-rollback

git checkout -b test/temporal-containers-main
git push origin test/temporal-containers-main
```

### 1.2 Verify Identical State

```bash
# Automated verification script
npm run verify-branch-state

# Manual verification
git diff test/temporal-containers-main test/temporal-containers-rollback
# Expected output: (empty - no differences)

# Verify commit hashes match
git rev-parse test/temporal-containers-main
git rev-parse test/temporal-containers-rollback
# Should be identical
```

### 1.3 Create Snapshots

```bash
# Record current state for both branches
npm run create-snapshots

# Creates:
# - snapshots/rollback-state.json
# - snapshots/main-state.json
# - snapshots/baseline-metrics.json
```

**Snapshot Contents**:
```json
{
  "commitHash": "838314c...",
  "dependencies": {
    "puppeteer": "24.29.1",
    "typescript": "5.x.x"
  },
  "fileChecksums": {
    "src/agent/index.ts": "sha256:abc123...",
    "src/types/index.ts": "sha256:def456..."
  },
  "buildStatus": "passing",
  "testStatus": "passing"
}
```

### 1.4 Automated Pre-Flight Checks

```typescript
// test/scripts/pre-flight-checks.ts
async function runPreFlightChecks() {
  const checks = [
    verifyBranchDivergence(),
    verifyBuildPasses(),
    verifyTestsPassing(),
    verifyDependenciesMatch(),
    verifyNoUncommittedChanges()
  ];
  
  const results = await Promise.all(checks);
  
  if (results.every(r => r.passed)) {
    console.log('✅ All pre-flight checks passed');
    return true;
  } else {
    console.error('❌ Pre-flight checks failed:', 
      results.filter(r => !r.passed));
    return false;
  }
}
```

**Duration**: 5 minutes automated

---

## Phase 2: Implementation (2 hours)

### 2.1 Implement on Main Branch ONLY

**On `test/temporal-containers-main`**:

```bash
git checkout test/temporal-containers-main
```

#### Step 1: Create Temporal Container Types (30 min)

```typescript
// src/types/temporal-container.ts
export interface TemporalContainer<TPayload = any> {
  // Immutable identifiers
  readonly containerId: string;
  readonly taskType: TaskType;
  readonly purpose: string;
  
  // Schema and payload
  readonly schema: JSONSchema;
  readonly payload: TPayload;
  
  // Lineage
  readonly sourceAgent: AgentType;
  readonly targetAgent: AgentType;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly completedAt?: number;
  
  // Transformation tracking
  readonly transformations: TransformationRecord[];
  
  // Status
  readonly status: ContainerStatus;
  readonly metadata: ContainerMetadata;
}

export type TaskType =
  | 'security-validation'
  | 'llm-analysis'
  | 'browser-command'
  | 'orchestration-task'
  | 'coordination-message'
  | 'error-recovery';

export type AgentType =
  | 'browser-agent'
  | 'security-agent'
  | 'intelligence-agent'
  | 'orchestration-agent'
  | 'resilience-agent'
  | 'coordination-agent';

export type ContainerStatus =
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'rolled-back';
```

#### Step 2: Create Container Manager (45 min)

```typescript
// src/utils/container-manager.ts
export class ContainerManager {
  private containers: Map<string, TemporalContainer>;
  private transformers: Map<TaskType, TransformFunction>;
  private validators: Map<TaskType, ValidateFunction>;
  
  // Create container with validation
  create<T>(params: CreateContainerParams<T>): TemporalContainer<T> {
    const container = {
      containerId: generateId(),
      taskType: params.taskType,
      purpose: params.purpose,
      schema: this.getSchema(params.taskType),
      payload: params.payload,
      sourceAgent: params.sourceAgent,
      targetAgent: params.targetAgent,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      transformations: [],
      status: 'pending',
      metadata: params.metadata || {}
    };
    
    // Validate against schema
    this.validate(container);
    
    // Store
    this.containers.set(container.containerId, container);
    
    return container;
  }
  
  // Transform container for handoff
  transform<TIn, TOut>(
    container: TemporalContainer<TIn>,
    transformation: string
  ): TemporalContainer<TOut> {
    const transformer = this.transformers.get(container.taskType);
    
    if (!transformer) {
      throw new Error(`No transformer for ${container.taskType}`);
    }
    
    const transformed = transformer(container, transformation);
    
    // Record transformation
    transformed.transformations.push({
      type: transformation,
      timestamp: Date.now(),
      sourceAgent: container.targetAgent
    });
    
    return transformed;
  }
  
  // Complete container
  complete(containerId: string, result: any): void {
    const container = this.containers.get(containerId);
    
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    
    container.completedAt = Date.now();
    container.status = 'completed';
    container.metadata.result = result;
    
    // Trigger storage
    this.store(container);
  }
}
```

#### Step 3: Update Agent Handoffs (45 min)

```typescript
// src/agent/index.ts - Browser Agent
async executeCommand(command: AgentCommand): Promise<AgentResponse> {
  // CREATE CONTAINER
  const container = this.containerManager.create({
    taskType: 'browser-command',
    purpose: `Execute ${command.type} command`,
    payload: command,
    sourceAgent: 'browser-agent',
    targetAgent: 'browser-manager'
  });
  
  // VALIDATE (automatic in create)
  
  // HANDOFF TO BROWSER MANAGER
  const result = await this.browserManager.execute(container);
  
  // COMPLETE CONTAINER
  this.containerManager.complete(container.containerId, result);
  
  return result;
}
```

### 2.2 Keep Rollback Branch Unchanged

**On `test/temporal-containers-rollback`**:

```bash
git checkout test/temporal-containers-rollback
# NO CHANGES - This branch stays as baseline
```

**Verification**:
```bash
git diff test/temporal-containers-main test/temporal-containers-rollback
# Should show ONLY the container implementation changes
```

---

## Phase 3: Automated Testing (1.5 hours)

### 3.1 Tripwire Measurement Constants (NEW)

**Hardline Immovable Measures at Agent Handoff Points**

These tripwires trigger at 25%, 50%, and 75% test completion to enable qualitative scale validation in blocks. They're hardwired after agent handoff points to pick up refactoring issues and assess modeling changeovers with accuracy for future updates.

```typescript
// test/tripwires/constants.ts
export const TRIPWIRE_CONSTANTS = {
  // Tripwire 1: Memory Pressure Threshold
  memoryPressure: {
    metric: 'containerOverheadVsBaseline',
    unit: 'percentage',
    threshold: 15, // >15% memory increase = HALT
    checkpoints: [0.25, 0.50, 0.75], // 25%, 50%, 75% completion
    action: 'HALT_AND_ANALYZE',
    immutable: true, // Cannot be changed during test
    purpose: 'Prevent memory allocation issues before they cascade',
    measurements: {
      baseline: 'rollback branch memory usage',
      comparison: 'main branch memory usage', 
      calculation: '((main - rollback) / rollback) * 100'
    }
  },
  
  // Tripwire 2: Latency Variance Ceiling
  latencyVariance: {
    metric: 'p95LatencyConsistency',
    unit: 'percentage',
    threshold: 20, // >20% variance from median = FLAG ANOMALY
    checkpoints: [0.25, 0.50, 0.75],
    action: 'FLAG_AND_DUPLICATE',
    immutable: true,
    purpose: 'Catch performance inconsistencies early',
    measurements: {
      baseline: 'P95 latency across 100 ops per checkpoint',
      comparison: 'Median latency for that checkpoint',
      calculation: '((p95 - median) / median) * 100'
    }
  },
  
  // Tripwire 3: Data Integrity Checkpoint
  dataIntegrity: {
    metric: 'jsonSchemaValidationFailures',
    unit: 'percentage',
    threshold: 2, // >2% validation errors = IMMEDIATE ROLLBACK
    checkpoints: [0.25, 0.50, 0.75],
    action: 'IMMEDIATE_ROLLBACK',
    immutable: true,
    purpose: 'Ensure container schema integrity at scale',
    measurements: {
      baseline: 'Count of schema validation failures',
      comparison: 'Total validation attempts',
      calculation: '(failures / attempts) * 100'
    }
  }
} as const; // TypeScript const assertion = truly immutable
```

**Tripwire Implementation**:

```typescript
// test/tripwires/monitor.ts
export class TripwireMonitor {
  private readonly constants = TRIPWIRE_CONSTANTS;
  private checkpointResults: Map<string, CheckpointResult[]> = new Map();
  
  // Called at 25%, 50%, 75% completion
  async checkTripwire(
    tripwire: keyof typeof TRIPWIRE_CONSTANTS,
    progress: number
  ): Promise<TripwireStatus> {
    const config = this.constants[tripwire];
    
    // Only check at designated checkpoints
    if (!config.checkpoints.includes(progress)) {
      return { status: 'skipped', reason: 'not a checkpoint' };
    }
    
    // Measure current value
    const measurement = await this.measure(config.metric);
    
    // Compare against threshold (immutable)
    if (measurement.value > config.threshold) {
      return {
        status: 'triggered',
        tripwire,
        checkpoint: progress,
        measured: measurement.value,
        threshold: config.threshold,
        action: config.action,
        timestamp: Date.now()
      };
    }
    
    // Store result for historical analysis
    this.recordCheckpoint(tripwire, progress, measurement);
    
    return {
      status: 'passed',
      tripwire,
      checkpoint: progress,
      measured: measurement.value,
      threshold: config.threshold
    };
  }
  
  // Execute tripwire action
  async executeTripwireAction(status: TripwireStatus): Promise<void> {
    switch (status.action) {
      case 'HALT_AND_ANALYZE':
        await this.haltTest();
        await this.analyzeMemoryAllocation();
        await this.generateReport('memory-pressure-report.json');
        break;
        
      case 'FLAG_AND_DUPLICATE':
        await this.flagAnomaly(status);
        await this.scheduleDuplicateTest();
        // Continue current test but prepare duplicate
        break;
        
      case 'IMMEDIATE_ROLLBACK':
        await this.haltTest();
        await this.rollback();
        await this.generateReport('data-integrity-failure.json');
        break;
    }
  }
  
  // Analyze trends across checkpoints
  analyzeTrends(): TripwireTrendAnalysis {
    const trends = {};
    
    for (const [tripwire, results] of this.checkpointResults) {
      trends[tripwire] = {
        direction: this.calculateDirection(results),
        volatility: this.calculateVolatility(results),
        projection: this.projectNextCheckpoint(results),
        risk: this.assessRisk(results)
      };
    }
    
    return trends;
  }
}
```

**Tripwire Checkpoint Integration**:

```typescript
// test/runner/test-executor.ts
export class TestExecutor {
  private tripwireMonitor = new TripwireMonitor();
  private totalTests = 50;
  
  async runTests(): Promise<TestResults> {
    const results = [];
    
    for (let i = 0; i < this.totalTests; i++) {
      // Run test
      const result = await this.executeTest(i);
      results.push(result);
      
      // Calculate progress
      const progress = (i + 1) / this.totalTests;
      
      // Check tripwires at 25%, 50%, 75%
      if ([0.25, 0.50, 0.75].includes(progress)) {
        console.log(`\n🚨 TRIPWIRE CHECKPOINT: ${progress * 100}% complete\n`);
        
        // Check all three tripwires
        const memoryStatus = await this.tripwireMonitor.checkTripwire(
          'memoryPressure', progress
        );
        const latencyStatus = await this.tripwireMonitor.checkTripwire(
          'latencyVariance', progress
        );
        const integrityStatus = await this.tripwireMonitor.checkTripwire(
          'dataIntegrity', progress
        );
        
        // Handle triggered tripwires
        for (const status of [memoryStatus, latencyStatus, integrityStatus]) {
          if (status.status === 'triggered') {
            console.error(`⚠️ TRIPWIRE TRIGGERED: ${status.tripwire}`);
            await this.tripwireMonitor.executeTripwireAction(status);
            
            // Some actions halt execution
            if (status.action === 'HALT_AND_ANALYZE' || 
                status.action === 'IMMEDIATE_ROLLBACK') {
              return {
                completed: false,
                reason: 'tripwire-triggered',
                tripwire: status,
                results: results
              };
            }
          }
        }
        
        // Log trends
        const trends = this.tripwireMonitor.analyzeTrends();
        console.log('📊 Tripwire Trends:', trends);
      }
    }
    
    return { completed: true, results };
  }
}
```

**Benefits of Hardline Tripwires**:

1. **Qualitative Scale Validation**: Measures impact, quality, and speed in discrete blocks (25%, 50%, 75%)
2. **Preemptive Future Build Improvement**: Detects patterns early, enabling refinement before completion
3. **No Trial/Rollback Endurance**: Stops bad tests fast, preventing wasted effort
4. **Agent Handoff Precision**: Positioned after each multi-agent handoff point
5. **Refactoring Detection**: Catches unintended consequences of code changes
6. **Modeling Changeover Accuracy**: Validates architecture changes with mathematical precision
7. **Immutable Constants**: Cannot be adjusted during test execution (prevents gaming)

**Tripwire Output Example**:

```json
{
  "checkpoint": "50%",
  "timestamp": 1699632000000,
  "tripwires": {
    "memoryPressure": {
      "status": "passed",
      "measured": 12.3,
      "threshold": 15,
      "trend": "stable",
      "projection": 13.1
    },
    "latencyVariance": {
      "status": "triggered",
      "measured": 23.7,
      "threshold": 20,
      "trend": "increasing",
      "projection": 28.4,
      "action": "FLAG_AND_DUPLICATE"
    },
    "dataIntegrity": {
      "status": "passed",
      "measured": 0.8,
      "threshold": 2,
      "trend": "stable",
      "projection": 0.9
    }
  },
  "overallRisk": "medium",
  "recommendation": "Continue with duplicate test scheduled"
}
```

---

### 3.2 Test Suite Setup

```typescript
// test/temporal-containers/suite.ts
export const testSuite = {
  unit: {
    containerCreation: 5,
    containerValidation: 5,
    containerTransformation: 5,
    containerCompletion: 5
  },
  integration: {
    agentHandoffs: 5,
    multiAgentWorkflows: 5,
    errorHandling: 5
  },
  performance: {
    handoffBenchmark: 3,
    transformationBenchmark: 3,
    storageOverhead: 2,
    memoryUsage: 2
  },
  errorInjection: {
    invalidSchema: 1,
    missingData: 1,
    transformationFailure: 1,
    timeoutHandling: 1,
    concurrentAccess: 1
  }
};

// Total: 50 tests
```

### 3.2 Parallel Execution Strategy

```bash
# Terminal 1: Test main branch
git checkout test/temporal-containers-main
npm run test:full -- --output=results/main-results.json

# Terminal 2: Test rollback branch (simultaneously)
git checkout test/temporal-containers-rollback
npm run test:full -- --output=results/rollback-results.json
```

**Execution Time**: 45 minutes per branch (parallel = 45 minutes total)

### 3.3 Performance Benchmarks

```typescript
// test/benchmarks/handoff-benchmark.ts
async function benchmarkHandoffs() {
  const workflows = [
    'Security → Intelligence',
    'Intelligence → Orchestration',
    'Orchestration → Browser'
  ];
  
  const iterations = 1000;
  
  for (const workflow of workflows) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await executeWorkflow(workflow);
      const end = performance.now();
      times.push(end - start);
    }
    
    const stats = calculateStats(times);
    
    results.push({
      workflow,
      mean: stats.mean,
      median: stats.median,
      p95: stats.p95,
      p99: stats.p99
    });
  }
  
  return results;
}
```

**Execution Time**: 30 minutes per branch (parallel = 30 minutes total)

### 3.4 Error Injection Tests

```typescript
// test/error-injection/invalid-schema.test.ts
test('handles invalid schema gracefully', async () => {
  const invalidContainer = {
    taskType: 'browser-command',
    payload: { invalid: 'data' }, // Missing required fields
    sourceAgent: 'browser-agent',
    targetAgent: 'browser-manager'
  };
  
  await expect(
    containerManager.create(invalidContainer)
  ).rejects.toThrow('Schema validation failed');
  
  // Verify system continues operating
  const validContainer = containerManager.create(validParams);
  expect(validContainer.status).toBe('pending');
});
```

**Execution Time**: 15 minutes per branch (parallel = 15 minutes total)

---

## Phase 4: Measurement & Comparison (1 hour)

### 4.1 Automated Comparison Script

```typescript
// test/scripts/compare-results.ts
interface ComparisonReport {
  dimension: string;
  baseline: number;
  withContainers: number;
  improvement: number;
  percentChange: number;
  passed: boolean;
}

async function compareResults() {
  const mainResults = loadResults('results/main-results.json');
  const rollbackResults = loadResults('results/rollback-results.json');
  
  const report: ComparisonReport[] = [];
  
  // Dimension 1: Efficiency
  report.push(compareEfficiency(mainResults, rollbackResults));
  
  // Dimension 2: Error Handling
  report.push(compareErrors(mainResults, rollbackResults));
  
  // Dimension 3: Speed
  report.push(compareSpeed(mainResults, rollbackResults));
  
  // Dimension 4: Quality
  report.push(compareQuality(mainResults, rollbackResults));
  
  // Dimension 5: Retention
  report.push(compareRetention(mainResults, rollbackResults));
  
  // Generate report
  generateReport(report);
  
  return report;
}
```

### 4.2 Comparison Metrics

```typescript
function compareEfficiency(main, rollback): ComparisonReport {
  const baselineTime = rollback.metrics.avgOperationTime;
  const containerTime = main.metrics.avgOperationTime;
  
  const improvement = baselineTime - containerTime;
  const percentChange = (improvement / baselineTime) * 100;
  
  return {
    dimension: 'Efficiency',
    baseline: baselineTime,
    withContainers: containerTime,
    improvement,
    percentChange,
    passed: percentChange >= 30 // Hypothesis: 35-45%, threshold: 30%
  };
}
```

### 4.3 Automated Report Generation

```markdown
# Temporal Container Test Results

## Summary
- **Test Date**: 2025-11-10
- **Duration**: 4.5 hours
- **Branches**: test/temporal-containers-main vs test/temporal-containers-rollback
- **Test Cases**: 50 (all passed)

## Hypothesis Validation

| Dimension | Hypothesis | Baseline | With Containers | Improvement | Status |
|-----------|-----------|----------|-----------------|-------------|--------|
| Efficiency | 35-45% | 180ms | 95ms | 47.2% | ✅ PASS |
| Errors | 60-70% | 18.5/100 | 6.2/100 | 66.5% | ✅ PASS |
| Speed | 25-35% | 165ms | 112ms | 32.1% | ✅ PASS |
| Quality | 40-50% | 22% loss | 4.8% loss | 78.2% | ✅ PASS |
| Retention | 80-90% | 68% | 97% | 85.3% | ✅ PASS |

## Detailed Analysis
...
```

---

## Quality Assurance Without Time Waste

### 1. Automated Verification (5 minutes)

```yaml
pre-test-automation:
  steps:
    - name: Verify branches diverge only as expected
      run: npm run verify-divergence
      fail-fast: true
      
    - name: Verify dependencies match
      run: npm run verify-dependencies
      fail-fast: true
      
    - name: Verify both branches build
      run: npm run verify-builds
      parallel: true
      fail-fast: true
      
    - name: Verify baseline tests pass
      run: npm run verify-baseline
      branch: rollback
      fail-fast: true

duration: 5 minutes
savings: Prevents wasting 2-3 hours on invalid test setup
```

### 2. Parallel Execution (1.5 hours, not 3 hours)

```yaml
parallel-testing:
  jobs:
    main-branch:
      runs-on: ubuntu-latest
      steps:
        - checkout: test/temporal-containers-main
        - run: npm test
        - run: npm run benchmark
        
    rollback-branch:
      runs-on: ubuntu-latest
      steps:
        - checkout: test/temporal-containers-rollback
        - run: npm test
        - run: npm run benchmark

duration: 1.5 hours (not 3 hours sequential)
savings: 1.5 hours
```

### 3. Early Exit Conditions (saves 2-3 hours if triggered)

```typescript
const earlyExitChecks = {
  buildFailure: {
    check: () => buildPasses(),
    action: 'STOP IMMEDIATELY',
    message: 'Build failed, fix before testing'
  },
  baselineFailure: {
    check: () => rollbackTestsPass(),
    action: 'STOP IMMEDIATELY',
    message: 'Baseline broken, cannot compare'
  },
  severeRegression: {
    check: () => performanceDegradation < 10,
    action: 'STOP AND INVESTIGATE',
    message: 'Performance degraded >10%, investigate'
  }
};
```

### 4. Snapshot Validation (<1 minute)

```typescript
function validateSnapshots() {
  const preTest = loadSnapshot('snapshots/main-state.json');
  const postTest = createSnapshot();
  
  const differences = diff(preTest, postTest);
  
  if (differences.length > 0) {
    console.warn('Unexpected changes detected:', differences);
    return false;
  }
  
  return true;
}
```

---

## Anomaly Detection & Duplicate Testing

### When to Run Duplicate Test

Trigger duplicate test if:
- Any metric shows **>10% degradation**
- **>5% of test cases** show unexpected behavior
- **Performance variance** >15% between runs
- **Anomalous pattern** in results

### Duplicate Test Procedure

```bash
# If anomaly detected:
git checkout test/temporal-containers-main
npm run test:full -- --output=results/main-results-2.json

git checkout test/temporal-containers-rollback
npm run test:full -- --output=results/rollback-results-2.json

# Compare both runs
npm run compare-runs -- \
  --main1=results/main-results.json \
  --main2=results/main-results-2.json \
  --rollback1=results/rollback-results.json \
  --rollback2=results/rollback-results-2.json
```

**Duration**: Additional 1.5 hours if needed

---

## Complete Timeline

| Phase | Activity | Duration | Parallel | Actual Time |
|-------|----------|----------|----------|-------------|
| 1 | Setup & Verification | 30 min | No | 30 min |
| 2 | Implementation (main only) | 2 hours | No | 2 hours |
| 3a | Unit Tests | 45 min | Yes | 45 min |
| 3b | Performance Benchmarks | 30 min | Yes | (concurrent) |
| 3c | Error Injection | 15 min | Yes | (concurrent) |
| 4 | Comparison & Analysis | 1 hour | No | 1 hour |
| **Total** | | **4.5 hours** | | **4.5 hours** |

**With Duplicate Test (if needed)**: +1.5 hours = 6 hours total

---

## Success Criteria

### Test Execution Success
- ✅ All 50 test cases pass on both branches
- ✅ Performance variance <10% between runs
- ✅ No unexpected errors or warnings
- ✅ Build passes on both branches

### Hypothesis Validation Success
- ✅ Efficiency improvement >30%
- ✅ Error reduction >50%
- ✅ Speed improvement >20%
- ✅ Quality improvement >35%
- ✅ Retention improvement >75%

### Quality Gate Success
- ✅ No performance degradation >5% in any dimension
- ✅ Code coverage maintained or improved
- ✅ All existing functionality preserved
- ✅ Documentation updated

---

## Rollback Procedure

If test fails or hypothesis invalidated:

```bash
# 1. Stop all testing
pkill -f "npm test"

# 2. Document findings
npm run generate-failure-report

# 3. Revert to baseline
git checkout copilot/setup-repo-and-assess-files

# 4. Delete test branches
git branch -D test/temporal-containers-main
git branch -D test/temporal-containers-rollback

# 5. Analyze and plan next steps
npm run analyze-failure
```

**Duration**: <5 minutes to rollback

---

## Conclusion

This test plan provides:

✅ **Quality assurance** through automated verification
✅ **Time efficiency** through parallel execution and early exits
✅ **Clear measurements** with concrete success criteria
✅ **Safety** with instant rollback capability
✅ **Comprehensive coverage** across all hypothesis dimensions

**Total Time Investment**: 4.5-6 hours
**Risk**: Minimal (isolated branches, instant rollback)
**Value**: High (validate $15k+ savings hypothesis)

**Recommendation**: Execute test plan to validate temporal container hypothesis.
