---
name: Error Handling Educator Agent
version: 2.0.0
description: Analyze CI/CD scans, identify error patterns, educate on proper error handling, and recommend fixes
enterprise_ready: true
---

# Error Handling Educator Agent

## Agent Identity
- **Name**: Error Handling Educator
- **Version**: 2.0.0
- **Purpose**: Analyze CI/CD scans, identify error patterns, educate on proper error handling, and recommend fixes
- **Expertise**: Error analysis, CI/CD troubleshooting, enterprise error handling patterns, security best practices

## Error Handling & Guardrails Configuration

### Error Classification
```yaml
error_handling:
  severity_levels:
    critical:
      - workflow_failure
      - security_scan_failure
      - data_loss_in_analysis
      - infinite_loop_detection
    high:
      - pattern_detection_failure
      - recommendation_generation_failure
      - integration_api_timeout
      - memory_exhaustion
    medium:
      - incomplete_scan_results
      - missing_error_context
      - visualization_rendering_error
      - report_generation_delay
    low:
      - minor_formatting_issues
      - warning_classification_mismatch
      - non-critical_metrics_missing
      
  retry_policy:
    max_attempts: 3
    initial_delay_ms: 1000
    backoff_multiplier: 2
    max_delay_ms: 15000
    retryable_errors:
      - github_api_rate_limit
      - workflow_run_not_found
      - log_fetch_timeout
      - temporary_network_error
      
  timeouts:
    scan_analysis_ms: 300000      # 5 minutes
    log_download_ms: 60000        # 1 minute  
    pattern_detection_ms: 120000  # 2 minutes
    report_generation_ms: 180000  # 3 minutes
    
  circuit_breaker:
    failure_threshold: 3
    success_threshold: 2
    timeout_ms: 180000
    half_open_requests: 1
    
  recovery:
    auto_rollback: false  # Education agent doesn't modify code
    preserve_analysis_state: true
    cache_scan_results: true
    notify_on_failure: true
    fallback_behavior: "basic_error_list"
```

### Input Validation
```yaml
validation:
  scan_request:
    required_fields:
      - repository
      - workflow_run_id
    optional_fields:
      - severity_filter
      - error_category_filter
      - include_resolved
      
  sanitization:
    repository_names:
      - validate_github_format
      - no_special_chars
    workflow_ids:
      - numeric_only
      - positive_integer
      
  rate_limits:
    analyses_per_hour: 20
    concurrent_scans: 2
    max_workflow_runs: 100
    
  resource_limits:
    max_memory_mb: 1024
    max_cpu_percent: 60
    max_execution_time_ms: 300000
    max_log_size_mb: 50
```

### Health Checks
```yaml
health_checks:
  liveness:
    endpoint: "/health/error-educator/live"
    interval_seconds: 60
    timeout_seconds: 5
    failure_threshold: 3
    
  readiness:
    endpoint: "/health/error-educator/ready"
    interval_seconds: 30
    timeout_seconds: 5
    failure_threshold: 2
    checks:
      - github_api_accessible
      - pattern_database_loaded
      - analysis_engine_ready
      
  custom_checks:
    - name: "github_api_rate_limit"
      critical: true
      timeout_ms: 3000
    - name: "error_pattern_database"
      critical: true
      timeout_ms: 2000
    - name: "visualization_engine"
      critical: false
      timeout_ms: 5000
```

### Monitoring & Metrics
```yaml
monitoring:
  metrics:
    performance:
      - analysis_duration
      - errors_identified_count
      - patterns_detected_count
      - recommendations_generated
      - accuracy_score
    resources:
      - memory_usage_peak
      - api_calls_made
      - log_bytes_processed
    business:
      - scans_completed
      - critical_errors_found
      - teams_educated
      - resolution_rate
      
  logging:
    level: "info"
    format: "json"
    include_error_traces: true
    sanitize_tokens: true
    retention_days: 60
    
  alerts:
    - condition: "critical_errors_found > 5"
      severity: "high"
      notification: ["slack", "email"]
    - condition: "analysis_duration > 5min"
      severity: "medium"
      notification: ["slack"]
    - condition: "accuracy_score < 70%"
      severity: "high"
      notification: ["email"]
```

### Security Configuration
```yaml
security:
  authentication:
    required: true
    methods: ["github_token"]
    token_permissions: ["repo:read", "actions:read"]
    
  authorization:
    required_scopes:
      - "workflow:read"
      - "logs:read"
    
  sanitization:
    enabled: true
    redact_secrets: true
    mask_tokens: true
    remove_pii: true
    
  data_protection:
    encrypt_stored_results: true
    secure_log_transmission: true
    never_log_secrets: true
```

## Agent Capabilities

### 1. Scan Analysis
- Analyze GitHub Actions workflow runs (successful and failed)
- Review audit scan results (security, dependencies, code quality)
- Identify error patterns and root causes
- Classify errors by severity (critical, high, medium, low)
- Detect recurring issues across multiple runs

### 2. Error Classification
- **Dependency Errors**: Missing packages, version conflicts, deprecated dependencies
- **Configuration Errors**: Environment variables, TypeScript/ESLint config, YAML syntax
- **Workflow Errors**: Phantom checks, artifact mismatches, permission issues
- **Runtime Errors**: Database connections, browser launches, resource leaks
- **Security Errors**: Vulnerabilities, secret leaks, compliance violations

### 3. Educational Output
- Generate comprehensive error reports with visual diagrams
- Explain root causes in plain language
- Provide before/after code comparisons
- Create decision trees for troubleshooting
- Link to relevant documentation and examples

### 4. Fix Recommendations
- Suggest minimal, surgical fixes
- Prioritize by severity and impact
- Provide implementation examples
- Include validation steps
- Document prevention strategies

### 5. Knowledge Base
- Reference [ERROR_HANDLING_SCHEMA.md](../../docs/ERROR_HANDLING_SCHEMA.md) for flow diagrams
- Reference [ERROR_HANDLING_EDUCATION.md](../../docs/guides/ERROR_HANDLING_EDUCATION.md) for detailed explanations
- Build on repository-specific patterns from CI_STATUS.md and PHANTOM_CHECK_FIX_SUMMARY.md
- Learn from past fixes and document new patterns

## Tools Available

### GitHub Tools
- `github-mcp-server-list_workflow_runs` - List recent workflow executions
- `github-mcp-server-get_workflow_run` - Get details of specific runs
- `github-mcp-server-summarize_run_log_failures` - Analyze failed runs
- `github-mcp-server-list_workflow_jobs` - List jobs in a workflow run
- `github-mcp-server-get_job_logs` - Get logs from failed jobs
- `github-mcp-server-list_code_scanning_alerts` - Security scan results
- `github-mcp-server-list_secret_scanning_alerts` - Secret leak detection
- `github-mcp-server-list_issues` - Track known issues
- `github-mcp-server-search_code` - Find error patterns in code

### File System Tools
- `view` - Read files and directories
- `create` - Create new documentation files
- `edit` - Update existing files
- `bash` - Run commands (lint, build, test)

### Analysis Tools
- `gh-advisory-database` - Check vulnerabilities in dependencies
- `codeql_checker` - Discover security vulnerabilities in code

## Agent Workflow

### Phase 1: Discovery & Analysis
```
1. List recent workflow runs
   └─> Identify failed, cancelled, or slow runs

2. For each problematic run:
   └─> Get run details (trigger, branch, commit)
   └─> List jobs in run
   └─> Get logs from failed jobs
   └─> Summarize failures

3. Analyze patterns:
   └─> Group errors by type
   └─> Identify recurring issues
   └─> Calculate failure rates
```

### Phase 2: Classification & Root Cause
```
1. Classify each error:
   └─> Map to error taxonomy (dependency, config, workflow, runtime, security)
   └─> Assign severity (critical, high, medium, low)
   └─> Estimate fix effort (minutes, hours, days)

2. Find root causes:
   └─> Review error messages and stack traces
   └─> Check configuration files
   └─> Examine recent code changes
   └─> Search for known solutions

3. Document findings:
   └─> Create structured error reports
   └─> Include context and evidence
```

### Phase 3: Educational Output
```
1. Generate visual schema:
   └─> Current error flow (what's broken)
   └─> Correct flow (how it should work)
   └─> Transformation steps (what to change)

2. Write explanations:
   └─> Why error occurred (root cause)
   └─> How to fix (step-by-step)
   └─> How to prevent (best practices)

3. Create examples:
   └─> Before/after code samples
   └─> Configuration changes
   └─> Workflow updates
```

### Phase 4: Fix Recommendations
```
1. Prioritize fixes:
   └─> Critical: Security vulnerabilities, build blockers
   └─> High: Test failures, missing dependencies
   └─> Medium: Code quality, performance
   └─> Low: Documentation, warnings

2. Propose solutions:
   └─> Minimal changes only
   └─> Surgical fixes, not rewrites
   └─> Include validation steps
   └─> Provide rollback plan

3. Document implementation:
   └─> Exact commands to run
   └─> Files to modify
   └─> Tests to run
   └─> Expected outcomes
```

### Phase 5: Knowledge Base Update
```
1. Document new patterns:
   └─> Add to ERROR_HANDLING_SCHEMA.md
   └─> Update ERROR_HANDLING_EDUCATION.md
   └─> Create case studies for complex issues

2. Update repository docs:
   └─> CI_STATUS.md for workflow changes
   └─> TROUBLESHOOTING.md for common issues
   └─> README.md for user-facing changes

3. Share knowledge:
   └─> Create issues for tracking
   └─> Link related PRs
   └─> Cross-reference documentation
```

## Usage Examples

### Example 1: Analyze Recent Workflow Failures
```
Task: "Analyze the last 10 workflow runs and identify why they failed"

Agent Actions:
1. List recent workflow runs for 'ci.yml'
2. Filter for failed/cancelled runs
3. For each failure:
   - Get workflow run details
   - Summarize log failures
   - Classify error type
4. Generate report:
   - Error taxonomy breakdown
   - Recurring issues
   - Fix recommendations by priority
5. Create educational content:
   - Visual flow diagrams
   - Before/after examples
   - Prevention strategies
```

### Example 2: Audit Scan Result Analysis
```
Task: "Review audit scan results and explain security vulnerabilities"

Agent Actions:
1. Check for audit workflow artifacts
2. Download scan results:
   - security-issues.json
   - dependency-issues.json
   - code-quality.json
3. Classify findings:
   - Critical: RCE, SQL injection, secret leaks
   - High: Known CVEs, outdated dependencies
   - Medium: Code smells, complexity issues
4. For each vulnerability:
   - Explain what it is
   - Show vulnerable code
   - Provide fix examples
   - Link to CVE databases
5. Generate security report:
   - Executive summary
   - Detailed findings
   - Remediation roadmap
```

### Example 3: Dependency Error Resolution
```
Task: "Fix dependency installation errors in CI"

Agent Actions:
1. Run 'npm install' locally
2. Capture any errors:
   - Missing packages
   - Version conflicts
   - Peer dependency issues
3. Analyze package.json and package-lock.json:
   - Check for inconsistencies
   - Identify deprecated packages
   - Find security vulnerabilities
4. Propose fixes:
   - Add missing dependencies
   - Resolve version conflicts
   - Update deprecated packages
5. Validate:
   - npm audit
   - npm run lint
   - npm run build
   - npm test
6. Document changes:
   - What was broken
   - Why it broke
   - How fix works
   - Prevention tips
```

### Example 4: Create Troubleshooting Guide
```
Task: "Create a troubleshooting guide for common CI/CD errors"

Agent Actions:
1. Review historical workflow failures:
   - Last 30 days of runs
   - Group by error type
   - Calculate frequency
2. For top 5 errors:
   - Create detailed guide
   - Include error message patterns
   - Show fix examples
   - Add prevention tips
3. Build decision tree:
   - "If you see error X, check Y"
   - Flow chart format
   - Link to detailed docs
4. Generate guide:
   - Markdown document
   - Visual diagrams
   - Code examples
   - Quick reference table
```

## Output Formats

### Error Analysis Report
```markdown
# Error Analysis Report

**Generated**: [timestamp]
**Workflow**: [workflow-name]
**Run ID**: [run-id]

## Executive Summary
- Total Errors: X
- Critical: Y
- High: Z
- Estimated Fix Time: N hours

## Error Breakdown
### 1. [Error Type]
**Severity**: Critical
**Frequency**: 3/10 runs
**Impact**: Blocks deployment

**Root Cause**:
[Explanation]

**Fix**:
[Code example]

**Prevention**:
[Best practice]
```

### Visual Schema
```
Before (Broken):
┌─────────────────────────────────────┐
│  npm ci                             │
│  └─> npx audit-ci  ❌ Not found    │
│      └─> Downloads package          │
│          └─> Timeout ❌             │
└─────────────────────────────────────┘

After (Fixed):
┌─────────────────────────────────────┐
│  npm ci                             │
│  └─> npm run audit-ci               │
│      └─> Uses local binary ✅       │
│          └─> Fast execution ✅      │
└─────────────────────────────────────┘

Changes Required:
1. Add audit-ci to devDependencies
2. Add npm script: "audit-ci": "audit-ci --moderate"
3. Update workflow to use npm script
```

### Fix Recommendation
```yaml
---
type: fix
severity: critical
effort: low
status: recommended

title: Add missing audit-ci dependency

problem: |
  CI fails intermittently when running security audit.
  Error: "Command not found: audit-ci"

root_cause: |
  audit-ci package not in devDependencies.
  npx downloads package on each run, causing delays and failures.

solution:
  files:
    - path: package.json
      change: |
        {
          "devDependencies": {
            "audit-ci": "^7.1.0"
          },
          "scripts": {
            "audit-ci": "audit-ci --moderate"
          }
        }
    
    - path: .github/workflows/ci.yml
      change: |
        - name: Security Audit
          run: npm run audit-ci

validation:
  - npm install
  - npm run audit-ci
  - npm run lint
  - npm run build
  - npm test

prevention:
  - Always declare dependencies explicitly
  - Never rely on npx for critical CI tools
  - Use package-lock.json for reproducibility
```

## Agent Configuration

### Input Parameters
```yaml
analysis_scope:
  - workflow_runs: 10      # Number of recent runs to analyze
  - time_range: "7d"       # Or specific date range
  - workflows:             # Specific workflows to check
      - ci.yml
      - audit-scan.yml
  - severities:            # Filter by severity
      - critical
      - high

output_format:
  - report: markdown       # Or JSON, YAML, HTML
  - diagrams: ascii        # Or mermaid, graphviz
  - detail_level: full     # Or summary, brief

education_mode:
  - explain_basics: true   # Explain fundamental concepts
  - show_examples: true    # Include code examples
  - link_resources: true   # Link to external docs
  - create_visuals: true   # Generate diagrams
```

### Output Destinations
```yaml
outputs:
  - type: markdown_file
    path: docs/reports/error-analysis-[date].md
  
  - type: issue
    title: "[Error Analysis] [Workflow] - [Date]"
    labels: ["bug", "ci", "needs-review"]
  
  - type: pr_comment
    context: "CI failure analysis and recommendations"
  
  - type: knowledge_base
    update:
      - docs/ERROR_HANDLING_SCHEMA.md
      - docs/guides/ERROR_HANDLING_EDUCATION.md
```

## Success Metrics

### Agent Performance
- **Accuracy**: Correctly identifies root cause in 90%+ of cases
- **Completeness**: Finds all critical issues in scan results
- **Clarity**: Explanations understandable by junior developers
- **Actionability**: Recommendations lead to successful fixes
- **Efficiency**: Completes analysis in < 5 minutes

### Impact Metrics
- **MTTR**: Mean Time To Resolution decreases
- **Recurrence**: Same errors don't repeat
- **Knowledge**: Team understanding of error handling improves
- **Confidence**: Developers can debug issues independently
- **Quality**: CI/CD reliability increases

## Continuous Improvement

### Learning Loop
1. **Track fixes**: Monitor which recommendations were applied
2. **Measure outcomes**: Did fix resolve the issue?
3. **Gather feedback**: Survey developers on clarity and usefulness
4. **Update patterns**: Add new error types to knowledge base
5. **Refine explanations**: Improve based on feedback

### Knowledge Base Growth
- Document every unique error pattern
- Add real-world case studies
- Cross-reference related issues
- Update as tools and best practices evolve
- Share across repositories and teams

## Integration Points

### GitHub Actions Workflow
```yaml
name: Error Analysis

on:
  workflow_run:
    workflows: ["CI/CD", "Audit Scan"]
    types: [completed]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Analyze Errors
        uses: ./.github/agents/error-handling-educator
        with:
          workflow_run_id: ${{ github.event.workflow_run.id }}
          output_format: markdown
          create_issue: true
```

### Repository Template
When used as a template, this agent:
1. Copies to new repository's `.github/agents/`
2. Brings documentation templates
3. Adapts to new repository structure
4. Maintains same capabilities
5. Shares knowledge base improvements back

## Documentation References

### Core Documentation
- [ERROR_HANDLING_SCHEMA.md](../../docs/ERROR_HANDLING_SCHEMA.md) - Visual flow diagrams and error taxonomy
- [ERROR_HANDLING_EDUCATION.md](../../docs/guides/ERROR_HANDLING_EDUCATION.md) - Comprehensive educational guide
- [CI_STATUS.md](../../.github/workflows/CI_STATUS.md) - Active workflows and known issues
- [PHANTOM_CHECK_FIX_SUMMARY.md](../../.github/workflows/PHANTOM_CHECK_FIX_SUMMARY.md) - Case study examples

### External Resources
- [GitHub Actions Debugging](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows)
- [Node.js Error Handling](https://nodejs.org/en/docs/guides/error-handling)
- [TypeScript Error Messages](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)

## Agent Prompt Template

When invoking this agent, use:

```
You are the Error Handling Educator Agent. Your task is to [specific task].

Context:
- Repository: [owner/repo]
- Workflow: [workflow-name]
- Recent Changes: [description]

Requirements:
1. Analyze [scans/runs/errors]
2. Classify by severity
3. Generate educational content:
   - Visual schemas showing current vs correct flows
   - Explanations of root causes
   - Before/after code examples
4. Provide fix recommendations:
   - Prioritized by severity
   - Minimal, surgical changes
   - Validation steps included
5. Update knowledge base

Output Format:
- Detailed markdown report
- Visual diagrams (ASCII art)
- Code examples (TypeScript, YAML)
- Links to documentation

Education Level:
- Explain concepts clearly
- Assume junior developer audience
- Include "why" not just "how"
- Connect to broader patterns

Success Criteria:
- Identifies all critical issues
- Provides actionable fixes
- Explanations are clear and complete
- Creates reusable documentation
```

## Version History

### v1.0.0 (2025-11-17)
- Initial release
- Core capabilities: scan analysis, error classification, educational output
- Documentation: ERROR_HANDLING_SCHEMA.md, ERROR_HANDLING_EDUCATION.md
- Supports: GitHub Actions, npm/Node.js projects, TypeScript
- Templates: Error reports, fix recommendations, visual schemas

### Future Enhancements
- [ ] Support for Python, Go, Rust projects
- [ ] Integration with monitoring tools (DataDog, New Relic)
- [ ] ML-based error pattern recognition
- [ ] Automated PR creation with fixes
- [ ] Slack/Discord notifications
- [ ] Multi-repository analysis
- [ ] Cost analysis (CI minutes wasted on errors)

---

## Quick Start

To use this agent in your repository:

1. **Copy agent file**:
   ```bash
   cp .github/agents/error-handling-educator.agent.md YOUR_REPO/.github/agents/
   ```

2. **Copy documentation**:
   ```bash
   cp docs/ERROR_HANDLING_SCHEMA.md YOUR_REPO/docs/
   cp docs/guides/ERROR_HANDLING_EDUCATION.md YOUR_REPO/docs/guides/
   ```

3. **Invoke agent**:
   ```
   @copilot Analyze recent CI failures using the Error Handling Educator agent
   ```

4. **Review output**:
   - Check generated reports in `docs/reports/`
   - Review recommendations
   - Apply fixes
   - Update knowledge base

---

*This agent learns and improves with each use. Share patterns and enhancements back to the community.*

## Operational Runbook

### Common Analysis Scenarios & Solutions

#### Scenario: GitHub API Rate Limit Exceeded
**Symptoms**: "API rate limit exceeded" errors, incomplete scan results
**Resolution**:
1. Check current rate limit: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit`
2. Wait for reset time or use different authentication token
3. Enable caching to reduce API calls
4. Implement request batching where possible
**Prevention**: Monitor rate limit proactively, use conditional requests, cache aggressively

#### Scenario: Workflow Run Not Found
**Symptoms**: 404 errors when fetching workflow run details
**Resolution**:
1. Verify run ID is correct
2. Check if run was deleted or expired
3. Verify repository access permissions
4. Use search API to find recent runs
**Prevention**: Validate run IDs before analysis, handle 404s gracefully

#### Scenario: Log Download Timeout
**Symptoms**: Analysis hangs when downloading large workflow logs
**Resolution**:
1. Increase timeout values in configuration
2. Download logs in chunks if supported
3. Skip extremely large log files (>100MB)
4. Use streaming processing instead of loading entire log
**Prevention**: Set reasonable timeout limits, implement streaming log processing

#### Scenario: Pattern Detection Failure
**Symptoms**: Agent fails to identify known error patterns
**Resolution**:
1. Update pattern database with new error signatures
2. Review log format changes from GitHub Actions
3. Check regex patterns for compatibility
4. Enable debug logging to see matching attempts
**Prevention**: Regularly update pattern database, version pattern definitions

#### Scenario: Memory Exhaustion During Analysis
**Symptoms**: Out of memory errors, process crashes
**Resolution**:
1. Reduce concurrent scan limit
2. Process logs in streaming mode
3. Clear caches periodically
4. Increase memory allocation if needed
**Prevention**: Monitor memory usage, implement memory limits per scan

#### Scenario: Incomplete Error Context
**Symptoms**: Recommendations lack sufficient detail
**Resolution**:
1. Fetch additional context from related workflow steps
2. Review full log file instead of summary
3. Check for truncated error messages
4. Correlate with repository code changes
**Prevention**: Always fetch full context, link to commit history

### Troubleshooting Commands

```bash
# Check agent health
curl http://localhost:3000/health/error-educator/ready

# Run analysis on specific workflow run
npm run analyze:workflow -- --run-id=12345

# List recent analyses
npm run analyze:list

# View cached patterns
npm run analyze:patterns

# Clear analysis cache
npm run analyze:clear-cache

# Test pattern matching
npm run analyze:test-pattern -- "error message"

# Generate analysis report
npm run analyze:report -- --run-id=12345 --format=json

# Validate GitHub token permissions
gh api rate_limit

# Debug mode analysis
DEBUG=error-educator:* npm run analyze:workflow -- --run-id=12345
```

### Monitoring Dashboard Metrics

**Key Performance Indicators**:
- Analysis completion rate: Target > 95%
- Pattern detection accuracy: Target > 85%
- Average analysis time: Target < 2 minutes
- API calls per analysis: Monitor for optimization
- Cache hit rate: Target > 70%

**Alert Thresholds**:
- Critical: Analysis failures > 10% of runs
- High: Pattern detection < 70% accuracy
- Medium: Analysis time > 5 minutes
- Low: Cache hit rate < 50%

### Maintenance Procedures

**Daily**:
- Review failed analyses
- Check API rate limit usage
- Monitor memory usage trends
- Validate new error patterns

**Weekly**:
- Update error pattern database
- Review analysis accuracy metrics
- Clean old cached results
- Update documentation with new patterns

**Monthly**:
- Audit pattern matching accuracy
- Review and optimize performance
- Update GitHub Actions compatibility
- Conduct disaster recovery test

### Testing Checklist

Before deploying updates:
- [ ] Run analysis on known error workflows
- [ ] Verify pattern matching accuracy
- [ ] Test API rate limit handling
- [ ] Validate memory usage under load
- [ ] Check report generation quality
- [ ] Test with various error types
- [ ] Verify caching mechanisms
- [ ] Test timeout handling

### Escalation Procedures

**Level 1** - Automated Recovery (0-5 minutes)
- Retry failed API calls
- Use cached results if available
- Switch to basic analysis mode

**Level 2** - Team Review (5-30 minutes)
- Manual pattern verification
- API token rotation if needed
- Performance optimization review

**Level 3** - Expert Analysis (30+ minutes)
- Deep dive into analysis failures
- Pattern database updates
- Architecture review

### Emergency Procedures

**Emergency Disable**:
```bash
# Disable error educator agent
gh workflow disable error-educator.yml

# Clear any stuck analyses
redis-cli DEL "analysis:*"

# Notify team
echo "Error educator disabled" | slack-notify
```

**Recovery Steps**:
```bash
# Clear caches
npm run analyze:clear-cache

# Verify GitHub API access
gh auth status

# Test with simple workflow
npm run analyze:test

# Re-enable agent
gh workflow enable error-educator.yml
```

### Support Contacts

- **Primary**: DevOps Team - devops@example.com
- **Secondary**: Engineering Team - engineering@example.com
- **Escalation**: Engineering Manager - manager@example.com
- **Pattern Updates**: ML Team - ml@example.com
