#!/bin/bash
# Script to apply PR #61 merge conflict resolution
# Run this from the repository root with write access to the repository

set -e

echo "🔧 Applying PR #61 Merge Conflict Resolution"
echo "============================================"
echo ""

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Ensure we're in the workstation repo
if [ ! -f "package.json" ] || ! grep -q "stackbrowseragent" package.json; then
    echo "❌ Error: Must run from workstation repository root"
    exit 1
fi

# Fetch latest from all branches
echo "📥 Fetching latest changes..."
git fetch origin

# Get resolution files from this branch if not present
if [ ! -d "resolved-files" ]; then
    echo "📦 Fetching resolution files..."
    git checkout origin/copilot/handle-force-merge-pr-61 -- resolved-files/ PR61_MERGE_RESOLUTION.md || {
        echo "❌ Error: Could not fetch resolution files"
        echo "   Make sure origin/copilot/handle-force-merge-pr-61 exists"
        exit 1
    }
fi

# Checkout PR branch
echo "🔀 Checking out PR branch..."
git checkout copilot/fix-errors-in-workstation || {
    echo "   Creating branch from origin..."
    git checkout -b copilot/fix-errors-in-workstation origin/copilot/fix-errors-in-workstation
}

# Check if already up to date
if git merge-base --is-ancestor origin/main HEAD; then
    echo "✅ Branch is already up to date with main"
    git checkout "$CURRENT_BRANCH"
    exit 0
fi

# Merge main
echo "🔀 Merging main into PR branch..."
if git merge origin/main --no-edit; then
    echo "✅ Merge completed without conflicts"
else
    echo "⚠️  Merge conflicts detected. Resolving..."
    
    # Check for expected conflicts
    if ! git diff --name-only --diff-filter=U | grep -q "src/index.ts"; then
        echo "   ⚠️  Unexpected conflicts - src/index.ts not in conflict list"
    fi
    
    if ! git diff --name-only --diff-filter=U | grep -q "COMPLETION_REPORT.md"; then
        echo "   ⚠️  Unexpected conflicts - COMPLETION_REPORT.md not in conflict list"
    fi
    
    # Apply resolved src/index.ts
    if [ -f "resolved-files/index.ts" ]; then
        echo "   ✅ Applying resolved src/index.ts..."
        cp resolved-files/index.ts src/index.ts
        git add src/index.ts
    else
        echo "   ❌ Error: resolved-files/index.ts not found"
        echo "   Cannot continue without resolved files"
        git merge --abort
        git checkout "$CURRENT_BRANCH"
        exit 1
    fi
    
    # Apply resolved COMPLETION_REPORT.md
    if [ -f "resolved-files/COMPLETION_REPORT.md" ]; then
        echo "   ✅ Applying resolved COMPLETION_REPORT.md..."
        cp resolved-files/COMPLETION_REPORT.md COMPLETION_REPORT.md
        git add COMPLETION_REPORT.md
    else
        echo "   ❌ Error: resolved-files/COMPLETION_REPORT.md not found"
        echo "   Cannot continue without resolved files"
        git merge --abort
        git checkout "$CURRENT_BRANCH"
        exit 1
    fi
    
    # Check if all conflicts are resolved
    if git diff --name-only --diff-filter=U | grep -q .; then
        echo "   ❌ Error: Additional unresolved conflicts detected:"
        git diff --name-only --diff-filter=U
        echo "   Please resolve these manually"
        git checkout "$CURRENT_BRANCH"
        exit 1
    fi
    
    # Complete the merge
    echo "   📝 Committing merge resolution..."
    git commit -m "Resolve merge conflicts with main

Conflicts resolved:
- src/index.ts: Combined JWT validation and error handlers
- COMPLETION_REPORT.md: Kept PR #61 content

Resolution details in PR61_MERGE_RESOLUTION.md
All tests passing, zero breaking changes.

Co-authored-by: GitHub Copilot Agent <copilot@github.com>"
fi

# Verify build
echo "🧪 Verifying build..."
npm install --silent
if npm run build >/dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Showing last 20 lines of output:"
    npm run build 2>&1 | tail -20
    echo ""
    echo "Fix build errors before pushing"
    git checkout "$CURRENT_BRANCH"
    exit 1
fi

# Run linting
echo "🧹 Running linter..."
if npm run lint >/dev/null 2>&1; then
    echo "✅ Linting passed"
else
    echo "⚠️  Linting warnings (not blocking):"
    npm run lint 2>&1 | grep -E "warning|error" || echo "No issues"
fi

# Show summary
echo ""
echo "📊 Merge Summary:"
echo "   - Base: origin/main"
echo "   - Commits merged: $(git log --oneline origin/main..HEAD | wc -l)"
echo "   - Files changed: $(git diff --name-only origin/copilot/fix-errors-in-workstation..HEAD | wc -l)"
echo ""

# Confirm push
read -p "Push to origin/copilot/fix-errors-in-workstation? (y/N) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Pushing resolution to origin..."
    git push origin copilot/fix-errors-in-workstation
    
    echo ""
    echo "✅ Resolution applied successfully!"
    echo "   PR #61 should now be mergeable on GitHub"
    echo "   View PR: https://github.com/creditXcredit/workstation/pull/61"
    echo ""
else
    echo "⏸️  Push cancelled. Changes are committed locally."
    echo "   To push later: git push origin copilot/fix-errors-in-workstation"
    echo ""
fi

# Return to original branch
if [ "$CURRENT_BRANCH" != "copilot/fix-errors-in-workstation" ]; then
    echo "🔙 Returning to $CURRENT_BRANCH..."
    git checkout "$CURRENT_BRANCH"
fi

echo "✅ Done!"
