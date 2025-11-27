# Agent 7: Security & Penetration Testing

**Status:** ✅ Production Ready  
**Schedule:** Saturday 2:00 AM MST  
**Duration:** 90 minutes  
**Dependencies:** None (runs first)

## Overview

Agent 7 is a comprehensive security scanner that automatically detects and fixes TypeScript compilation errors and security vulnerabilities (CVEs) in the workstation system.

## Features

### 1. TypeScript Error Detection
- ✅ Automatic detection of TypeScript compilation errors
- ✅ Detailed error reporting with file, line, and column information
- ✅ Auto-fix capabilities for common errors (missing commas, implicit any types)
- ✅ Validation and re-checking after fixes

### 2. Security Vulnerability Scanning
- ✅ npm audit integration for dependency vulnerability detection
- ✅ CVE detection with severity classification (Critical, High, Medium, Low)
- ✅ Automatic vulnerability fixing using npm audit fix
- ✅ Force-fix option for critical/high severity vulnerabilities

### 3. Comprehensive Reporting
- ✅ Detailed security reports in Markdown format
- ✅ Executive summary with vulnerability counts by severity
- ✅ File-specific error information
- ✅ Handoff artifacts for downstream agents (Agent 8)

## Quick Start

### Install Dependencies
```bash
cd agents/agent7
npm install
```

### Build Agent
```bash
npm run build
```

### Run Security Scan
```bash
npm run scan
```

### Fix TypeScript Errors
```bash
npm run fix-typescript
```

### Fix Security Vulnerabilities
```bash
npm run fix-cve

# Force fix for critical/high vulnerabilities
npm run fix-cve -- --force
```

## Usage

### 1. Weekly Automated Scan
Run via npm from project root:
```bash
npm run agent7:weekly
```

Or run the script directly:
```bash
./agents/agent7/run-weekly-security.sh
```

### 2. Manual Security Scan
```bash
cd agents/agent7
npm run scan
```

This will:
1. Scan for TypeScript compilation errors
2. Scan for security vulnerabilities
3. Generate a detailed security report
4. Create a handoff artifact for Agent 8

### 3. Fix TypeScript Errors
```bash
cd agents/agent7
npm run fix-typescript
```

Automatically fixes common TypeScript errors:
- Missing commas in object literals
- Implicit 'any' types in function parameters

### 4. Fix Security Vulnerabilities
```bash
cd agents/agent7
npm run fix-cve
```

Uses `npm audit fix` to automatically update vulnerable dependencies.

For critical/high severity vulnerabilities that require breaking changes:
```bash
npm run fix-cve -- --force
```

## Output

### Security Report
Location: `agents/agent7/reports/{timestamp}/SECURITY_REPORT.md`

Contains:
- Executive summary with counts
- Detailed TypeScript errors (if any)
- Security vulnerabilities by severity
- Fix recommendations

### Handoff Artifact
Location: `.agent7-handoff.json` (project root)

Contains:
- Scan timestamp
- Total findings count
- Vulnerabilities by severity
- Report path
- Next agent reference (Agent 8)

Example:
```json
{
  "agent": 7,
  "name": "Security & Penetration Testing",
  "timestamp": "2025-11-27T01:11:53.051Z",
  "status": "success",
  "report_path": "agents/agent7/reports/...",
  "findings": {
    "typescriptErrors": 0,
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0
  },
  "next_agent": 8
}
```

## Integration with Other Agents

### Agent 5 (DevOps & Containerization)
Agent 7 complements Agent 5 by providing security scanning for the containerized environment.

### Agent 8 (Error Assessment)
Agent 7 creates a handoff artifact consumed by Agent 8 for error prioritization and assessment.

## Architecture

### Core Components

1. **security-scanner.ts** - Main scanning engine
   - Coordinates TypeScript error detection
   - Runs npm audit for CVE scanning
   - Generates comprehensive reports
   - Creates handoff artifacts

2. **typescript-fixer.ts** - Automatic TypeScript error fixer
   - Detects and categorizes TypeScript errors
   - Applies automatic fixes for common patterns
   - Validates fixes by re-running compiler

3. **cve-fixer.ts** - Security vulnerability fixer
   - Runs npm audit fix
   - Handles force-fix for critical vulnerabilities
   - Reports on fixed and remaining vulnerabilities

## Development

### Build
```bash
npm run build
```

### Run in Development Mode
```bash
npm run dev
```

### Project Structure
```
agents/agent7/
├── src/
│   ├── security-scanner.ts    # Main scanner
│   ├── typescript-fixer.ts    # TS error fixer
│   └── cve-fixer.ts           # CVE fixer
├── dist/                      # Compiled output
├── reports/                   # Generated reports
├── memory/                    # Agent memory (future)
├── package.json
├── tsconfig.json
└── README.md
```

## Future Enhancements

1. **Static Code Analysis**
   - Semgrep integration
   - OWASP rule set scanning
   - Secret detection (TruffleHog)

2. **Container Security**
   - Trivy image scanning
   - Dockerfile linting
   - CIS benchmark validation

3. **API Security Testing**
   - OWASP ZAP integration
   - Authentication bypass testing
   - Rate limiting verification

4. **Compliance Validation**
   - OWASP Top 10 compliance
   - SANS Top 25 coverage
   - GDPR/CCPA data handling

## Troubleshooting

### TypeScript errors not detected
- Ensure TypeScript is installed: `npm install -g typescript`
- Check tsconfig.json exists in project root
- Verify paths in scanner configuration

### CVE scan not working
- Ensure npm is installed and up-to-date
- Run `npm install` in project root
- Check npm audit is accessible: `npm audit --help`

### Fixes not applying
- Check file permissions
- Verify Git repository is clean
- Review error messages in output

## Support

For issues or questions:
- Check documentation in `.github/agents/`
- Review agent prompt: `agent-prompt.yml`
- See HOW_TO_USE_AGENT7.md for detailed guide

## License

Part of the workstation project - See repository LICENSE file

---

**Last Updated**: November 27, 2025  
**Version**: 1.0.0  
**Status**: Production Ready ✅
