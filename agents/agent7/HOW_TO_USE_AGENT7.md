# How to Use Agent 7: Security & Penetration Testing

## Table of Contents
1. [Quick Start (5 minutes)](#quick-start-5-minutes)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage Scenarios](#usage-scenarios)
5. [API Reference](#api-reference)
6. [Examples](#examples)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)

---

## Quick Start (5 minutes)

Get Agent 7 running in 5 minutes:

```bash
# 1. Navigate to agent directory
cd agents/agent7

# 2. Install dependencies
npm install

# 3. Build the agent
npm run build

# 4. Run security scan
npm run scan
```

**Expected Output:**
```
🚀 Starting Agent 7: Security Scanner

🔍 Scanning for TypeScript errors...
✅ No TypeScript errors found!
🔍 Scanning for security vulnerabilities...
✅ No security vulnerabilities found!
📝 Generating security report...
✅ Report generated: agents/agent7/reports/{timestamp}/SECURITY_REPORT.md
📦 Creating handoff artifact...
✅ Handoff artifact created: .agent7-handoff.json

✅ Agent 7 execution completed successfully!
```

---

## Installation

### Prerequisites

- Node.js 18+ installed
- npm 9+ installed
- TypeScript knowledge (for customization)
- Git repository access

### Step 1: Install Agent Dependencies

```bash
cd agents/agent7
npm install
```

This installs:
- TypeScript compiler
- Node.js types
- ts-node for development

### Step 2: Build Agent

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### Step 3: Verify Installation

```bash
npm run scan
```

Should complete without errors and generate a security report.

---

## Configuration

### Environment Variables

Agent 7 uses project-level configuration. No agent-specific environment variables required.

### TypeScript Configuration

The agent uses its own `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Package Configuration

`package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/security-scanner.ts",
    "scan": "node dist/security-scanner.js",
    "fix-typescript": "node dist/typescript-fixer.js",
    "fix-cve": "node dist/cve-fixer.js",
    "test": "echo \"Tests not implemented yet\" && exit 0"
  }
}
```

---

## Usage Scenarios

### Scenario 1: Weekly Security Audit

**Goal:** Run automated security scan as part of weekly maintenance.

**Steps:**
```bash
# From project root
npm run agent7:weekly

# Or directly
./agents/agent7/run-weekly-security.sh
```

**What it does:**
1. Scans for TypeScript compilation errors
2. Runs npm audit for security vulnerabilities
3. Generates comprehensive security report
4. Creates handoff artifact for Agent 8

**Output Location:**
- Report: `agents/agent7/reports/{timestamp}/SECURITY_REPORT.md`
- Handoff: `.agent7-handoff.json`

### Scenario 2: Pre-Deployment Security Check

**Goal:** Verify no security issues before deploying to production.

**Steps:**
```bash
cd agents/agent7

# Run scan
npm run scan

# Check results
cat .agent7-handoff.json | grep -E "typescriptErrors|critical|high"
```

**Exit Code Check:**
```bash
npm run scan && echo "✅ Deployment safe" || echo "❌ Security issues detected"
```

### Scenario 3: Fix TypeScript Errors Automatically

**Goal:** Automatically fix common TypeScript compilation errors.

**Steps:**
```bash
cd agents/agent7

# Scan and identify errors
npm run scan

# Apply automatic fixes
npm run fix-typescript

# Verify fixes worked
npm run scan
```

**What gets fixed:**
- Missing commas in object literals
- Implicit 'any' types in function parameters

### Scenario 4: Fix Security Vulnerabilities

**Goal:** Update dependencies to fix known CVEs.

**Steps:**
```bash
cd agents/agent7

# Scan for vulnerabilities
npm run scan

# Apply safe fixes
npm run fix-cve

# For critical/high vulnerabilities requiring breaking changes
npm run fix-cve -- --force
```

**What happens:**
1. Runs `npm audit fix` to update vulnerable packages
2. Reports on fixed and remaining vulnerabilities
3. Optionally force-fixes critical/high severity issues

---

## API Reference

### SecurityScanner Class

Main scanning engine that coordinates TypeScript and CVE detection.

#### Constructor

```typescript
const scanner = new SecurityScanner();
```

#### Methods

##### `scanTypeScriptErrors(): TypeScriptError[]`

Scans project for TypeScript compilation errors.

**Returns:** Array of TypeScript errors with file, line, column, code, and message.

**Example:**
```typescript
const errors = scanner.scanTypeScriptErrors();
console.log(`Found ${errors.length} errors`);
```

##### `scanSecurityVulnerabilities(): SecurityVulnerability[]`

Scans npm dependencies for security vulnerabilities.

**Returns:** Array of vulnerabilities with severity, package, version info, and fix details.

**Example:**
```typescript
const vulns = scanner.scanSecurityVulnerabilities();
const critical = vulns.filter(v => v.severity === 'critical');
console.log(`Found ${critical.length} critical vulnerabilities`);
```

##### `generateReport(result: ScanResult): void`

Generates comprehensive security report in Markdown format.

**Parameters:**
- `result`: ScanResult object containing all findings

**Output:** Creates report file at `reports/{timestamp}/SECURITY_REPORT.md`

##### `createHandoffArtifact(result: ScanResult): void`

Creates JSON handoff artifact for downstream agents.

**Parameters:**
- `result`: ScanResult object containing all findings

**Output:** Creates `.agent7-handoff.json` in project root

##### `run(): Promise<void>`

Runs complete security scan workflow.

**Example:**
```typescript
const scanner = new SecurityScanner();
await scanner.run();
```

### TypeScriptFixer Class

Automatically fixes common TypeScript errors.

#### Constructor

```typescript
const fixer = new TypeScriptFixer();
```

#### Methods

##### `fixErrors(): Promise<void>`

Attempts to automatically fix TypeScript errors.

**What it fixes:**
- TS1005: Missing commas in object literals
- TS7006: Implicit 'any' types

**Example:**
```typescript
const fixer = new TypeScriptFixer();
await fixer.fixErrors();
```

### CVEFixer Class

Fixes security vulnerabilities by updating dependencies.

#### Constructor

```typescript
const fixer = new CVEFixer();
```

#### Methods

##### `fixVulnerabilities(forcefix: boolean = false): Promise<void>`

Fixes security vulnerabilities using npm audit.

**Parameters:**
- `forcefix`: If true, uses `--force` flag for critical/high vulnerabilities

**Example:**
```typescript
const fixer = new CVEFixer();
await fixer.fixVulnerabilities(false); // Safe fixes only
await fixer.fixVulnerabilities(true);  // Force fix critical/high
```

---

## Examples

### Example 1: Programmatic Usage

```typescript
import { SecurityScanner } from './agents/agent7/src/security-scanner';

async function runSecurityAudit() {
  const scanner = new SecurityScanner();
  await scanner.run();
}

runSecurityAudit().catch(console.error);
```

### Example 2: Custom Error Handling

```typescript
import { SecurityScanner } from './agents/agent7/src/security-scanner';

async function auditWithNotifications() {
  const scanner = new SecurityScanner();
  const tsErrors = scanner.scanTypeScriptErrors();
  const cveErrors = scanner.scanSecurityVulnerabilities();
  
  if (tsErrors.length > 0) {
    console.error(`⚠️  ${tsErrors.length} TypeScript errors detected!`);
    // Send notification (email, Slack, etc.)
  }
  
  const criticalCVEs = cveErrors.filter(v => v.severity === 'critical');
  if (criticalCVEs.length > 0) {
    console.error(`🚨 ${criticalCVEs.length} CRITICAL vulnerabilities!`);
    // Send urgent notification
  }
}

auditWithNotifications().catch(console.error);
```

### Example 3: Automated CI/CD Integration

```bash
#!/bin/bash
# .github/workflows/security-check.sh

cd agents/agent7
npm install
npm run build
npm run scan

# Check handoff for errors
ERRORS=$(cat ../../.agent7-handoff.json | jq '.findings.typescriptErrors + .findings.critical + .findings.high')

if [ "$ERRORS" -gt 0 ]; then
  echo "❌ Security check failed: $ERRORS critical issues found"
  exit 1
else
  echo "✅ Security check passed"
  exit 0
fi
```

### Example 4: Weekly Cron Job

```bash
# Add to crontab (Saturday 2:00 AM MST)
0 2 * * 6 cd /path/to/workstation && npm run agent7:weekly >> /var/log/agent7.log 2>&1
```

---

## Troubleshooting

### Issue: "TypeScript compiler not found"

**Symptoms:**
```
Error: Cannot find module 'typescript'
```

**Solution:**
```bash
cd agents/agent7
npm install
```

### Issue: "Permission denied" when writing reports

**Symptoms:**
```
Error: EACCES: permission denied, mkdir 'reports'
```

**Solution:**
```bash
# Ensure reports directory is writable
chmod +w agents/agent7/reports

# Or create it manually
mkdir -p agents/agent7/reports
```

### Issue: npm audit not working

**Symptoms:**
```
npm audit requires package-lock.json
```

**Solution:**
```bash
# Ensure package-lock.json exists in project root
cd ../../
npm install
```

### Issue: "No TypeScript errors detected but build fails"

**Symptoms:**
Agent reports 0 errors but `npm run build` fails.

**Solution:**
Agent scans from project root. Check if errors are in excluded directories:
```bash
# Run TypeScript compiler manually
npx tsc --noEmit

# Check tsconfig.json exclude patterns
cat tsconfig.json | grep -A 5 "exclude"
```

### Issue: CVE fixes break the application

**Symptoms:**
After running `npm run fix-cve --force`, tests fail.

**Solution:**
```bash
# Rollback changes
git checkout package.json package-lock.json
npm install

# Review breaking changes before force-fixing
npm audit
# Read the "fix available" notes carefully

# Test fixes incrementally
npm audit fix
npm test
```

---

## Advanced Usage

### Custom Scan Configuration

Create a custom scanner configuration:

```typescript
// custom-scan.ts
import { SecurityScanner } from './src/security-scanner';

class CustomSecurityScanner extends SecurityScanner {
  // Override to add custom logic
  public scanTypeScriptErrors() {
    console.log('Running custom TypeScript scan...');
    const errors = super.scanTypeScriptErrors();
    
    // Filter out certain error codes
    return errors.filter(e => e.code !== 'TS2345');
  }
}

const scanner = new CustomSecurityScanner();
scanner.run();
```

### Integration with CI/CD Pipeline

#### GitHub Actions

```yaml
# .github/workflows/security-scan.yml
name: Weekly Security Scan

on:
  schedule:
    - cron: '0 2 * * 6'  # Saturday 2 AM
  workflow_dispatch:

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run Agent 7 Security Scan
        run: npm run agent7:weekly
      
      - name: Upload security report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: agents/agent7/reports/
```

### Scheduled Automated Fixes

```bash
#!/bin/bash
# agents/agent7/auto-fix.sh

set -e

echo "🚀 Running automated security fixes..."

# Scan for issues
npm run scan

# Fix TypeScript errors
npm run fix-typescript

# Fix CVEs (safe only)
npm run fix-cve

# Run tests
npm test

# Commit if all tests pass
if [ $? -eq 0 ]; then
  git add .
  git commit -m "chore: Agent 7 automated security fixes"
  git push
  echo "✅ Fixes applied and pushed"
else
  echo "❌ Tests failed, rolling back"
  git checkout .
  exit 1
fi
```

### Monitoring and Alerting

```typescript
// monitor.ts
import { SecurityScanner } from './agents/agent7/src/security-scanner';

async function monitorSecurity() {
  const scanner = new SecurityScanner();
  const vulns = scanner.scanSecurityVulnerabilities();
  
  const critical = vulns.filter(v => v.severity === 'critical');
  const high = vulns.filter(v => v.severity === 'high');
  
  if (critical.length > 0 || high.length > 0) {
    // Send to monitoring service
    await sendToDatadog({
      metric: 'security.vulnerabilities',
      value: critical.length + high.length,
      tags: ['severity:critical', 'severity:high']
    });
    
    // Send alert
    await sendSlackAlert(`🚨 ${critical.length} critical and ${high.length} high severity vulnerabilities detected!`);
  }
}

setInterval(monitorSecurity, 3600000); // Check hourly
```

---

## Best Practices

1. **Run weekly scans** - Schedule Agent 7 to run automatically every week
2. **Review reports** - Don't just run scans, review and act on findings
3. **Test after fixes** - Always run tests after applying automatic fixes
4. **Monitor trends** - Track vulnerability counts over time
5. **Integrate with CI/CD** - Block deployments if critical issues detected
6. **Document exceptions** - If you can't fix a vulnerability, document why

---

## Related Documentation

- [Agent 7 README](./README.md) - Overview and features
- [Agent Prompt](./agent-prompt.yml) - Agent configuration
- [Security Best Practices](../../docs/security/BEST_PRACTICES.md)
- [Integration with Agent 5](../agent5/README.md) - DevOps integration
- [Integration with Agent 8](../agent8/README.md) - Error assessment

---

**Last Updated**: November 27, 2025  
**Version**: 1.0.0  
**Maintainer**: Agent 7 Security Team
