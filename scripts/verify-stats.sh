#!/bin/bash
# Repository Statistics Verification Script
# Usage: npm run stats:verify

echo "=== Repository Statistics ==="
echo ""
echo "Total tracked files (excluding node_modules, .git, dist):"
find . -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" 2>/dev/null | wc -l

echo ""
echo "TypeScript files in src/:"
find src -type f -name "*.ts" 2>/dev/null | wc -l

echo ""
echo "JavaScript files:"
find . -type f -name "*.js" ! -path "*/node_modules/*" ! -path "*/dist/*" 2>/dev/null | wc -l

echo ""
echo "Test files:"
find . -type f \( -name "*.test.ts" -o -name "*.spec.ts" -o -name "*.test.js" \) ! -path "*/node_modules/*" 2>/dev/null | wc -l

echo ""
echo "Documentation files (.md):"
find . -type f -name "*.md" ! -path "*/node_modules/*" 2>/dev/null | wc -l

echo ""
echo "Lines of TypeScript code in src/:"
find src -type f -name "*.ts" -exec wc -l {} + 2>/dev/null | tail -1 | awk '{print $1}'
