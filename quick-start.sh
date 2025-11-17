#!/bin/bash

# Quick Start Script for Workstation
# This script helps you get started with the integrated workstation platform

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Workstation Quick Start Script      ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker Compose not found${NC}"
    echo "Install Docker Compose or use Docker directly"
    USE_COMPOSE=false
else
    USE_COMPOSE=true
fi

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${YELLOW}⚠ Please edit .env and set your JWT_SECRET before proceeding${NC}"
        echo ""
        read -p "Press Enter to continue after editing .env, or Ctrl+C to exit..."
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Found .env file${NC}"
fi

# Check if JWT_SECRET is set
source .env
if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-secure-32-character-minimum-secret-key" ]; then
    echo -e "${RED}Error: JWT_SECRET not set in .env${NC}"
    echo ""
    echo "Generate a secure secret with:"
    echo -e "${BLUE}node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"${NC}"
    echo ""
    echo "Then update JWT_SECRET in .env"
    exit 1
fi

echo -e "${GREEN}✓ JWT_SECRET is configured${NC}"
echo ""

# Ask user how they want to run
echo "How would you like to run Workstation?"
echo "  1) Docker Compose (recommended)"
echo "  2) Docker directly"
echo "  3) Local development (npm)"
echo ""
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        if [ "$USE_COMPOSE" = false ]; then
            echo -e "${RED}Docker Compose not available${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}Building Docker image...${NC}"
        docker-compose -f docker-compose.integrated.yml build
        
        echo -e "${BLUE}Starting services...${NC}"
        docker-compose -f docker-compose.integrated.yml up -d
        
        echo -e "${GREEN}✓ Services started via Docker Compose${NC}"
        ;;
        
    2)
        echo -e "${BLUE}Building Docker image...${NC}"
        docker build -f Dockerfile.integrated -t workstation:latest .
        
        echo -e "${BLUE}Starting container...${NC}"
        docker run -d \
            --name workstation \
            -p 3000:3000 \
            -p 8080:8080 \
            -p 8082:8082 \
            --env-file .env \
            workstation:latest
        
        echo -e "${GREEN}✓ Container started${NC}"
        ;;
        
    3)
        echo -e "${BLUE}Installing dependencies...${NC}"
        npm install
        
        echo -e "${BLUE}Installing agent-server dependencies...${NC}"
        cd agent-server/nodejs && npm install && cd ../..
        
        echo -e "${BLUE}Building TypeScript...${NC}"
        npm run build
        
        echo -e "${BLUE}Starting services...${NC}"
        echo -e "${YELLOW}Note: You'll need to start services in separate terminals:${NC}"
        echo "  Terminal 1: npm start"
        echo "  Terminal 2: cd agent-server && node start.js"
        
        npm start
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Workstation Started Successfully!    ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Wait for services to be ready
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Test endpoints
echo -e "${BLUE}Testing endpoints...${NC}"

# Test JWT Auth API
if curl -sf http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ JWT Auth API is healthy${NC}"
else
    echo -e "${RED}✗ JWT Auth API not responding${NC}"
fi

# Get demo token
echo ""
echo -e "${GREEN}Getting demo token...${NC}"
TOKEN_RESPONSE=$(curl -s http://localhost:3000/auth/demo-token)
echo "$TOKEN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TOKEN_RESPONSE"

echo ""
echo -e "${GREEN}Service URLs:${NC}"
echo -e "  • JWT Auth API:        ${BLUE}http://localhost:3000${NC}"
echo -e "  • Agent Server HTTP:   ${BLUE}http://localhost:8080${NC}"
echo -e "  • Agent Server WS:     ${BLUE}ws://localhost:8082${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "  1. Test JWT Auth: curl http://localhost:3000/health"
echo "  2. Get demo token: curl http://localhost:3000/auth/demo-token"
echo "  3. Read deployment guide: cat DEPLOYMENT_INTEGRATED.md"
echo "  4. Set up Chrome for MCP (see DEPLOYMENT_INTEGRATED.md)"
echo ""
echo -e "${GREEN}To stop services:${NC}"
if [ $choice -eq 1 ]; then
    echo "  docker-compose -f docker-compose.integrated.yml down"
elif [ $choice -eq 2 ]; then
    echo "  docker stop workstation && docker rm workstation"
else
    echo "  Press Ctrl+C in the terminal running npm start"
fi
echo ""
