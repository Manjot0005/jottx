#!/bin/bash

echo "========================================="
echo "🚀 Starting Admin & Traveler Frontends"
echo "========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill existing processes on ports 3000 and 3001
echo "Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 2

# Check if backend is running
if ! lsof -i:5001 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend not running! Starting it first...${NC}"
    cd ~/Desktop/CodeNest/JotX/kayak-platform/simple-backend
    nohup npm start > backend.log 2>&1 &
    sleep 3
    echo -e "${GREEN}✅ Backend started${NC}"
fi

# Start Admin Frontend
echo -e "${BLUE}Starting Admin Frontend on port 3000...${NC}"
cd ~/Desktop/CodeNest/JotX/kayak-platform/frontend

# Open in browser after 10 seconds
(sleep 10 && open http://localhost:3000) &

# Start admin (this will block until you Ctrl+C)
npm start


