#!/bin/bash
#
# Pre-commit hook for workstation repository
# Provides guardrails to prevent committing broken code
#
# This hook runs automatically before each commit and performs:
# 1. Linting checks
# 2. TypeScript compilation
# 3. Unit tests (fast only)
# 4. Security checks (basic)
#
# To skip this hook temporarily (not recommended): git commit --no-verify
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Running pre-commit checks...${NC}\n"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Track overall success
CHECKS_FAILED=0

# Check 1: Lint
print_section "1. Linting Code"
if npm run lint; then
    print_success "Linting passed"
else
    print_error "Linting failed"
    CHECKS_FAILED=1
fi

# Check 2: TypeScript Compilation
print_section "2. TypeScript Compilation"
if npm run build; then
    print_success "TypeScript compilation passed"
else
    print_error "TypeScript compilation failed"
    CHECKS_FAILED=1
fi

# Check 3: Fast Unit Tests (skip slow integration tests)
print_section "3. Fast Unit Tests"
if npm test -- --testPathIgnorePatterns="integration" --maxWorkers=4 --bail; then
    print_success "Unit tests passed"
else
    print_error "Unit tests failed"
    CHECKS_FAILED=1
fi

# Check 4: Security - Check for secrets in staged files
print_section "4. Security Checks"
SECRETS_FOUND=0

# Common secret patterns
SECRET_PATTERNS=(
    "password\s*=\s*['\"].*['\"]"
    "api[_-]?key\s*=\s*['\"].*['\"]"
    "secret\s*=\s*['\"].*['\"]"
    "token\s*=\s*['\"].*['\"]"
    "private[_-]?key"
    "-----BEGIN (RSA|DSA|EC) PRIVATE KEY-----"
    "AKIA[0-9A-Z]{16}"  # AWS Access Key
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    if git diff --cached --name-only | xargs grep -iE "$pattern" 2>/dev/null; then
        print_warning "Potential secret detected matching pattern: $pattern"
        SECRETS_FOUND=1
    fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
    print_success "No obvious secrets detected"
else
    print_error "Potential secrets detected in staged files"
    print_warning "Review the matches above and ensure no sensitive data is being committed"
    CHECKS_FAILED=1
fi

# Check 5: File Size Check
print_section "5. File Size Check"
LARGE_FILES=$(git diff --cached --name-only | xargs ls -lh 2>/dev/null | awk '$5 ~ /M$/ && $5+0 > 1 {print $9 " (" $5 ")"}')

if [ -n "$LARGE_FILES" ]; then
    print_warning "Large files detected:"
    echo "$LARGE_FILES"
    print_warning "Consider using Git LFS for large files"
else
    print_success "No unusually large files detected"
fi

# Check 6: Package.json and package-lock.json sync
print_section "6. Dependency Check"
if git diff --cached --name-only | grep -q "package.json"; then
    if ! git diff --cached --name-only | grep -q "package-lock.json"; then
        print_warning "package.json changed but package-lock.json not updated"
        print_warning "Run 'npm install' to sync package-lock.json"
    else
        print_success "package.json and package-lock.json are in sync"
    fi
fi

# Check 7: TODO/FIXME tracking
print_section "7. Code Quality Markers"
TODO_COUNT=$(git diff --cached | grep -i "^+.*TODO" | wc -l)
FIXME_COUNT=$(git diff --cached | grep -i "^+.*FIXME" | wc -l)

if [ "$TODO_COUNT" -gt 0 ] || [ "$FIXME_COUNT" -gt 0 ]; then
    print_warning "Found $TODO_COUNT TODOs and $FIXME_COUNT FIXMEs in this commit"
    print_warning "Consider creating issues for these items"
fi

# Summary
print_section "Pre-commit Check Summary"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                   ║${NC}"
    echo -e "${GREEN}║  ✓  ALL PRE-COMMIT CHECKS PASSED                  ║${NC}"
    echo -e "${GREEN}║                                                   ║${NC}"
    echo -e "${GREEN}║  Your code is ready to be committed!              ║${NC}"
    echo -e "${GREEN}║                                                   ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                   ║${NC}"
    echo -e "${RED}║  ✗  PRE-COMMIT CHECKS FAILED                      ║${NC}"
    echo -e "${RED}║                                                   ║${NC}"
    echo -e "${RED}║  Please fix the errors above before committing    ║${NC}"
    echo -e "${RED}║                                                   ║${NC}"
    echo -e "${RED}║  To skip this hook (NOT RECOMMENDED):            ║${NC}"
    echo -e "${RED}║  git commit --no-verify                           ║${NC}"
    echo -e "${RED}║                                                   ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}"
    exit 1
fi
