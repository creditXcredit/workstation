#!/bin/bash
#
# Install Git hooks for workstation repository
#
# This script sets up pre-commit hooks that provide guardrails
# to prevent committing broken code.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_DIR="$(git rev-parse --git-dir)"
HOOKS_DIR="${GIT_DIR}/hooks"

echo "Installing Git hooks..."

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Install pre-commit hook
if [ -f "${SCRIPT_DIR}/pre-commit-hook.sh" ]; then
    echo "Installing pre-commit hook..."
    cp "${SCRIPT_DIR}/pre-commit-hook.sh" "${HOOKS_DIR}/pre-commit"
    chmod +x "${HOOKS_DIR}/pre-commit"
    echo "✓ Pre-commit hook installed"
else
    echo "✗ Warning: pre-commit-hook.sh not found"
fi

echo ""
echo "Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-commit: Runs lint, build, tests, and security checks"
echo ""
echo "To skip hooks temporarily (not recommended): git commit --no-verify"
echo ""
