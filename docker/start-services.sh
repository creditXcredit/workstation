#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Workstation Multi-Service Startup   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Start main JWT Auth API in background
echo -e "${GREEN}[1/3] Starting JWT Auth API...${NC}"
cd /app
node dist/index.js &
AUTH_PID=$!
echo -e "${GREEN}      → JWT Auth API running on http://localhost:${PORT:-3000}${NC}"
echo -e "${GREEN}      → PID: ${AUTH_PID}${NC}"
sleep 2

# Start Agent Server in background
echo -e "${GREEN}[2/3] Starting Agent Server...${NC}"
cd /app/agent-server
node start.js &
AGENT_PID=$!
echo -e "${GREEN}      → Agent Server WebSocket on ws://localhost:${AGENT_SERVER_WS_PORT:-8082}${NC}"
echo -e "${GREEN}      → Agent Server HTTP API on http://localhost:${AGENT_SERVER_HTTP_PORT:-8080}${NC}"
echo -e "${GREEN}      → PID: ${AGENT_PID}${NC}"
sleep 2

# Health check
echo -e "${GREEN}[3/3] Running health checks...${NC}"

# Check JWT Auth API
if curl -sf http://localhost:${PORT:-3000}/health > /dev/null 2>&1; then
    echo -e "${GREEN}      ✓ JWT Auth API is healthy${NC}"
else
    echo -e "${RED}      ✗ JWT Auth API health check failed${NC}"
fi

# Check Agent Server (if it exposes a status endpoint)
if curl -sf http://localhost:${AGENT_SERVER_HTTP_PORT:-8080}/status > /dev/null 2>&1; then
    echo -e "${GREEN}      ✓ Agent Server is healthy${NC}"
else
    echo -e "${GREEN}      ⚠ Agent Server status endpoint not available (may be normal)${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   All Services Started Successfully   ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo -e "  • JWT Auth API:        http://localhost:${PORT:-3000}"
echo -e "  • Agent Server HTTP:   http://localhost:${AGENT_SERVER_HTTP_PORT:-8080}"
echo -e "  • Agent Server WS:     ws://localhost:${AGENT_SERVER_WS_PORT:-8082}"
echo ""
echo -e "${GREEN}API Documentation:${NC}"
echo -e "  • JWT Auth:            /health, /auth/demo-token, /api/protected"
echo -e "  • Agent Server:        /v1/responses, /page/screenshot, /page/content"
echo ""
echo -e "${GREEN}MCP Integration:${NC}"
echo -e "  • CDP Host:            ${CDP_HOST:-host.docker.internal}"
echo -e "  • CDP Port:            ${CDP_PORT:-9222}"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"
echo ""

# Trap SIGTERM and SIGINT to gracefully shutdown
trap "echo -e '${RED}\n\nShutting down services...${NC}'; kill $AUTH_PID $AGENT_PID 2>/dev/null || true; exit 0" SIGTERM SIGINT

# Wait for either process to exit
wait -n $AUTH_PID $AGENT_PID

# If one exits, kill the other
echo -e "${RED}One service has stopped. Shutting down remaining services...${NC}"
kill $AUTH_PID $AGENT_PID 2>/dev/null || true

exit 1
