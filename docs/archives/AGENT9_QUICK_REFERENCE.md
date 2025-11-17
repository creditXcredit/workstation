# 🧙‍♂️ Agent 9 Quick Reference

## Command Cheatsheet

```bash
# Build Agent 9
npm run agent9:build

# Run optimization engine
npm run agent9:optimize

# Weekly automation (full workflow)
npm run agent9:weekly

# Direct execution with specific handoff
node agents/agent9/dist/optimization-engine.js /path/to/.agent8-handoff.json
```

## Files & Locations

| File | Purpose | Location |
|------|---------|----------|
| **Optimization Engine** | Core optimization logic | `agents/agent9/src/optimization-engine.ts` |
| **Agent Prompt** | System instructions | `agents/agent9/agent-prompt.yml` |
| **Weekly Script** | Automation script | `agents/agent9/run-weekly-optimization.sh` |
| **MCP Memory** | 52-week history | `agents/agent9/memory/optimizations.json` |
| **README** | Documentation | `agents/agent9/README.md` |
| **Completion Status** | Production ready | `.agent9-complete.json` |

## Handoff Artifacts

| From | To | File | Purpose |
|------|-----|------|---------|
| Agent 8 | Agent 9 | `.agent8-handoff.json` | Assessment findings |
| Agent 9 | Agent 7 | `.agent9-to-agent7.json` | Security re-scan request |
| Agent 9 | Agent 8 | `.agent9-to-agent8.json` | Re-assessment request |
| Agent 9 | Agent 10 | `.agent9-to-agent10.json` | Guard rails validation |

## Optimization Patterns

### Error Handling (`AGENT9_OPT`)
```typescript
// AGENT9_OPT: Added comprehensive error handling with context
// WHY: Prevents silent failures and provides actionable error messages
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error: error.message });
  throw new Error('User-friendly message');
}
```

### Refactoring (`AGENT9_REFACTOR`)
```typescript
// AGENT9_REFACTOR: Extracted long function into smaller, testable units
// WHY: Improves readability, testability, and maintainability
// COMPLEXITY: Reduced from 15 to 4 (McCabe)
// LINES: Reduced from 87 to 23
```

### Performance (`AGENT9_PERF`)
```typescript
// AGENT9_PERF: Implemented caching to reduce redundant computations
// WHY: Function called 50+ times per request
// BEFORE: O(n) lookup (200ms avg)
// AFTER: O(1) with LRU cache (5ms avg)
// IMPACT: 95% reduction in response time
```

### Documentation (`AGENT9_DOC`)
```typescript
/**
 * AGENT9_DOC: Added comprehensive JSDoc
 * WHY: Public API requires clear documentation
 * 
 * @param {string} userId - The user identifier
 * @returns {Promise<User>} The user object
 */
```

## Workflow Steps

1. **Intake** - Load Agent 8 findings
2. **Planning** - Prioritize by severity
3. **Execution** - Log optimization recommendations
4. **Validation** - Run tests
5. **Documentation** - Update CHANGELOG
6. **Memory** - Update MCP history
7. **Snapshot** - Create Docker backup
8. **Handoff** - Generate reports

## Success Criteria

### Quality Gates ✅
- All tests passing
- No coverage decrease
- No new vulnerabilities
- Documentation updated
- MCP memory updated

### Target Improvements 📈
- **Grade**: B+ → A (95%+)
- **High Issues**: 3 → 0 (100%)
- **Medium Issues**: 12 → 6 (50%)
- **Coverage**: 94% → 95%+

## Automation Schedule

**Cron**: `45 2 * * 6`  
**Time**: Saturday 2:45 AM MST  
**Duration**: 60-75 minutes  
**After**: Agent 8 (2:00 AM)  
**Before**: Agent 10 (TBD)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find Agent 8 handoff" | Run Agent 8 or create mock handoff |
| "TypeScript compilation failed" | Run `npm run agent9:build` |
| "Docker snapshot failed" | Expected if Docker not running |
| "Tests failing" | Agent 9 logs recommendations only |

## MCP Memory Structure

```json
{
  "timestamp": "ISO8601",
  "week": 46,
  "optimizations": [
    {
      "finding_id": "EH-01",
      "file": "src/index.ts",
      "type": "error_handling",
      "description": "Added try-catch",
      "before": "No error handling",
      "after": "Comprehensive try-catch",
      "reason": "Prevents silent failures"
    }
  ],
  "summary": {
    "total_optimizations": 7,
    "by_type": { "error_handling": 2, ... },
    "files_modified": 5
  }
}
```

## Integration Points

```
Agent 7 (Security)
    ↓
Agent 8 (Assessment) → Agent 9 (Optimization) → Agent 10 (Guardrails)
    ↑                       ↓
    └───────────────────────┘
      Re-assessment request
```

## Quick Test

```bash
# 1. Create mock handoff
cat > .agent8-handoff.json << 'EOF'
{
  "areas_requiring_optimization": [{
    "id": "TEST-01",
    "category": "documentation",
    "severity": "medium",
    "description": "Test optimization",
    "files": ["src/index.ts"]
  }]
}
EOF

# 2. Run optimization
npm run agent9:optimize

# 3. Check results
cat .agent9-to-agent8.json
cat agents/agent9/memory/optimizations.json
head -20 CHANGELOG.md
```

## Status Indicators

- 🧙‍♂️ Agent 9 running
- ✅ Completed successfully
- ⚠️ Warning (non-critical)
- ❌ Error (requires attention)
- 📥 Loading data
- 🔧 Optimizing
- 🧪 Validating
- 📚 Documenting
- 💾 Persisting
- 🔄 Generating handoffs

---

**Agent 9** | Production Ready | Weekly Saturday 2:45 AM MST
