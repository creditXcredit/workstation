#!/bin/bash
# Startup Verification Script for Workstation
# Verifies all systems are operational before declaring the app ready

set -e

echo "🚀 Workstation Startup Verification"
echo "===================================="
echo ""

# Configuration
PORT=${PORT:-3000}
BASE_URL="http://localhost:${PORT}"
MAX_WAIT=30
WAIT_INTERVAL=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
    fi
}

# Function to wait for server
wait_for_server() {
    echo "⏳ Waiting for server to start on port ${PORT}..."
    local waited=0
    while [ $waited -lt $MAX_WAIT ]; do
        if curl -s "$BASE_URL/health" > /dev/null 2>&1; then
            print_status "ok" "Server is responding"
            return 0
        fi
        sleep $WAIT_INTERVAL
        waited=$((waited + WAIT_INTERVAL))
        echo -n "."
    done
    echo ""
    print_status "error" "Server did not start within ${MAX_WAIT} seconds"
    return 1
}

# Check 1: Environment Variables
echo "📋 Checking Environment Variables..."
if [ -z "$JWT_SECRET" ]; then
    print_status "error" "JWT_SECRET not set"
    echo "   Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    exit 1
else
    SECRET_LENGTH=${#JWT_SECRET}
    if [ $SECRET_LENGTH -lt 32 ]; then
        print_status "warn" "JWT_SECRET is short (${SECRET_LENGTH} chars). Recommended: 64+ chars"
    else
        print_status "ok" "JWT_SECRET configured (${SECRET_LENGTH} chars)"
    fi
fi

if [ "$NODE_ENV" = "production" ]; then
    print_status "ok" "NODE_ENV: production"
    if [ -z "$ALLOWED_ORIGINS" ] || [ "$ALLOWED_ORIGINS" = "*" ]; then
        print_status "warn" "ALLOWED_ORIGINS not properly configured for production"
    else
        print_status "ok" "ALLOWED_ORIGINS configured"
    fi
else
    print_status "ok" "NODE_ENV: ${NODE_ENV:-development}"
fi

echo ""

# Check 2: File System
echo "📁 Checking Required Files..."
REQUIRED_FILES=(
    "dist/index.js"
    "dist/automation/db/schema.sql"
    "docs/index.html"
    "docs/workstation-control-center.html"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "ok" "$file exists"
    else
        print_status "error" "$file missing"
        echo "   Run: npm run build"
        exit 1
    fi
done

echo ""

# Check 3: Wait for server to be ready
wait_for_server || exit 1

echo ""

# Check 4: Health Endpoint
echo "🏥 Checking Health Endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.status' 2>/dev/null || echo "error")

if [ "$HEALTH_STATUS" = "ok" ]; then
    print_status "ok" "System status: OK"
    
    # Check database
    DB_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.database.status' 2>/dev/null || echo "unknown")
    if [ "$DB_STATUS" = "connected" ]; then
        print_status "ok" "Database: connected"
    else
        print_status "warn" "Database: $DB_STATUS"
    fi
    
    # Check memory
    MEMORY_PCT=$(echo "$HEALTH_RESPONSE" | jq -r '.memory.percentage' 2>/dev/null || echo "0")
    if [ "$MEMORY_PCT" -lt 80 ]; then
        print_status "ok" "Memory usage: ${MEMORY_PCT}%"
    else
        print_status "warn" "Memory usage high: ${MEMORY_PCT}%"
    fi
else
    print_status "error" "System status: $HEALTH_STATUS"
    exit 1
fi

echo ""

# Check 5: API Endpoints
echo "🔌 Checking API Endpoints..."

# Demo token endpoint
if curl -s "$BASE_URL/auth/demo-token" | jq -e '.token' > /dev/null 2>&1; then
    print_status "ok" "Auth endpoints working"
    TOKEN=$(curl -s "$BASE_URL/auth/demo-token" | jq -r '.token')
else
    print_status "error" "Auth endpoints failing"
    exit 1
fi

# Protected endpoint
if curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/protected" | jq -e '.message' > /dev/null 2>&1; then
    print_status "ok" "Protected endpoints working"
else
    print_status "error" "Protected endpoints failing"
    exit 1
fi

# Workflow endpoint
if curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/v2/workflows" | jq -e '.success' > /dev/null 2>&1; then
    print_status "ok" "Workflow API working"
else
    print_status "error" "Workflow API failing"
    exit 1
fi

echo ""

# Check 6: Static Files
echo "🌐 Checking UI Files..."
if curl -s -I "$BASE_URL/index.html" | grep -q "200 OK"; then
    print_status "ok" "Main dashboard accessible"
else
    print_status "error" "Main dashboard not accessible"
    exit 1
fi

if curl -s -I "$BASE_URL/workstation-control-center.html" | grep -q "200 OK"; then
    print_status "ok" "Control center accessible"
else
    print_status "error" "Control center not accessible"
    exit 1
fi

echo ""
echo "===================================="
echo -e "${GREEN}✅ All Systems Operational${NC}"
echo ""
echo "🔗 Access Points:"
echo "   Health Check:    $BASE_URL/health"
echo "   Demo Token:      $BASE_URL/auth/demo-token"
echo "   Main Dashboard:  $BASE_URL/index.html"
echo "   Control Center:  $BASE_URL/workstation-control-center.html"
echo "   API Base:        $BASE_URL/api/v2"
echo ""
echo "🎉 Workstation is ready for production use!"
