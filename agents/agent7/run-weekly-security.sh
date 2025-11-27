#!/bin/bash
##############################################################################
# Agent 7: Security & Penetration Testing - Weekly Script
# 
# Purpose: Perform weekly security scans and penetration tests
# Schedule: Saturday 2:00 AM MST (cron: 0 2 * * 6)
# Duration: 90 minutes
# Dependencies: None (runs first in sequence)
#
# Workflow:
# 1. Run security scans
# 2. Generate security report
# 3. Create handoff artifacts for Agent 8
# 4. Update MCP memory
# 5. Create Docker snapshot
##############################################################################

set -e  # Exit on error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WEEK=$(date +%U)
YEAR=$(date +%Y)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# ============================================
# MAIN EXECUTION
# ============================================
main() {
    log "Starting Agent 7: Security & Penetration Testing"
    log "Week $WEEK, $YEAR - Timestamp: $TIMESTAMP"
    
    # Navigate to agent directory
    cd "$SCRIPT_DIR"
    
    # Ensure dependencies are installed
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install
    fi
    
    # Ensure agent is built
    if [ ! -d "dist" ]; then
        log "Building agent..."
        npm run build
    fi
    
    # Run security scan
    log "Running security scan..."
    npm run scan
    
    if [ $? -eq 0 ]; then
        success "Security scan completed successfully"
    else
        warning "Security scan completed with warnings"
    fi
    
    # Check if handoff artifact was created
    if [ -f "$PROJECT_ROOT/.agent7-handoff.json" ]; then
        success "Handoff artifact created for Agent 8"
    else
        warning "Handoff artifact not found"
    fi
    
    log "Agent 7 execution completed"
}

# Execute main function
main
