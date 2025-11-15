# Agent 11 Quick Reference

## 📊 Data Analytics & Comparison Specialist

**One-Line Summary**: Analyzes validation data from Agent 10 and provides trend analysis, comparative metrics, and actionable insights.

---

## Quick Commands

```bash
# Build Agent 11
npm run agent11:build

# Run analytics
npm run agent11:analyze

# Weekly automated execution
npm run agent11:weekly

# Direct execution
./agents/agent11/run-weekly-analytics.sh
```

---

## What Agent 11 Does

| Analysis Type | Purpose | Output |
|--------------|---------|--------|
| 📈 Trend Analysis | Identifies patterns over time | Insights on performance, quality, coverage |
| ⚖️ Comparative Analysis | Week/month comparisons | Deltas and trend directions |
| 📊 Report Generation | Creates visual reports | Markdown reports with charts |
| 🚨 Alert Detection | Identifies anomalies | Critical, warning, info alerts |
| 💾 Memory Persistence | Stores historical data | 52 weeks of snapshots |

---

## Output Files

```
agents/agent11/reports/YYYYMMDD/WEEKLY_ANALYSIS.md    # Weekly report
agents/agent11/memory/analytics-history.json          # Historical data (52 weeks)
```

---

## When It Runs

**Schedule**: Saturday 5:00 AM MST  
**After**: Agent 10 (Guard Rails) at 4:00 AM MST  
**Duration**: 10-15 minutes

---

## Latest Analysis (Week 46, 2025)

### Key Metrics
- **Guard Rails Added**: 0
- **Issues Found**: 6 ⚠️
- **Issues Fixed**: 0
- **Guard Rail Overhead**: 5ms ✅

### Insights
- ✅ Excellent performance - overhead consistently below 3ms
- ⚠️ Issue count increased from 0 to 6 (week-over-week)
- ✅ Edge case coverage showing consistent improvement

### Recommendations
- Review and address 6 issues flagged by Agent 10

---

## Integration Points

### Receives From
- **Agent 10**: `.agent10-to-agent11.json` (validation data)
- **Agent 10 Memory**: `guard-rails-history.json` (52 weeks of history)

### Provides To
- **Stakeholders**: Weekly analysis reports
- **Future Agents**: Trend insights and recommendations

---

## Key Metrics Tracked

### Guard Rails Metrics
- Guard rails added
- Guard rails validated
- Overhead (ms)

### Validation Metrics
- Issues found
- Issues fixed
- Execution time

### Performance Metrics
- API response time
- Workflow execution time
- Database query time
- Browser operation time

### Quality Metrics
- Test coverage
- Errors caught
- Silent failures prevented

---

## Alert Thresholds

### Critical (🔴)
- Performance degradation > 20%
- Error rate increase > 50%
- Test coverage decrease > 5%
- Guard rail overhead > 10ms

### Warning (⚠️)
- Performance degradation > 10%
- Error rate increase > 25%
- Consistent downward trend (3+ weeks)

### Info (ℹ️)
- Performance improvement > 10%
- Test coverage increase
- New patterns detected

---

## Architecture

```
agent11/
├── src/
│   ├── analytics-engine.ts      # Main orchestration
│   ├── trend-analyzer.ts         # Trend analysis
│   ├── comparison-engine.ts      # Comparisons
│   └── report-generator.ts       # Report creation
├── memory/                       # MCP persistence (52 weeks)
├── reports/                      # Generated reports
└── run-weekly-analytics.sh      # Automation script
```

---

## Troubleshooting

### Analytics Fails
Ensure Agent 10 handoff exists:
```bash
ls -la .agent10-to-agent11.json
```

### No Historical Data
Agent 10 must run at least once:
```bash
npm run agent10:weekly
```

### Build Fails
```bash
cd agents/agent11
rm -rf node_modules dist
npm install
npm run build
```

---

## Example Weekly Report

```markdown
# Weekly Analytics Report
Week 46, 2025

## Executive Summary
- Guard Rails Added: 0
- Issues Found: 6 ⚠️
- Guard Rail Overhead: 5ms ✅

## Week-over-Week
- Performance: Stable
- Issues: +6 (worse)
- Coverage: Improving

## Recommendations
- Review and address 6 issues flagged by Agent 10
```

---

## Analysis Types

### Trend Analysis
- Performance trends
- Issue count trends
- Coverage improvements
- Pattern detection

### Comparative Analysis
- Week-over-week deltas
- Month-over-month trends
- Moving averages
- Regression detection

### Predictive Insights
- Future bottlenecks (planned)
- Trend projections (planned)
- Early warning systems (planned)

---

## Report Types

### Weekly Snapshot (Current)
- Frequency: Every Saturday
- Metrics: Current week summary
- Comparison: vs. last week
- Output: WEEKLY_ANALYSIS.md

### Monthly Analysis (Planned)
- Frequency: First Saturday of month
- Metrics: 4-week trends
- Comparison: Month-over-month
- Output: MONTHLY_ANALYSIS.md

### Quarterly Review (Planned)
- Frequency: First Saturday of quarter
- Metrics: Long-term trends
- Comparison: Quarter-over-quarter
- Output: QUARTERLY_REVIEW.md

---

## Dependencies

- **Agent 10**: Must complete first
- **TypeScript**: Source language
- **Node.js**: Runtime environment
- **jq**: JSON processing (optional)

---

## Contact & Support

**Documentation**: `agents/agent11/README.md`  
**Reports**: `agents/agent11/reports/`  
**Memory**: `agents/agent11/memory/analytics-history.json`

---

**Status**: 🟢 Operational  
**Version**: 1.0.0  
**Last Run**: 2025-11-15 08:47 UTC  
**Next Run**: Saturday 5:00 AM MST
