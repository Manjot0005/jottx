#!/bin/bash

echo "========================================="
echo "🚀 Starting Kayak Platform"
echo "========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Kill any existing processes
echo "Cleaning up old processes..."
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

sleep 2

# Start Backend
echo -e "${BLUE}Starting Backend on port 5001...${NC}"
cd ~/Desktop/CodeNest/JotX/kayak-platform/simple-backend
nohup npm start > backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if lsof -i:5001 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend started successfully${NC}"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start Admin Frontend
echo -e "${BLUE}Starting Admin Frontend on port 3000...${NC}"
cd ~/Desktop/CodeNest/JotX/kayak-platform/frontend
nohup npm start > admin.log 2>&1 &
sleep 5

# Start Traveler Frontend  
echo -e "${BLUE}Starting Traveler Frontend on port 3001...${NC}"
cd ~/Desktop/CodeNest/JotX/kayak-platform/traveler-frontend
nohup npm start > traveler.log 2>&1 &
sleep 5

echo ""
echo "========================================="
echo -e "${GREEN}✅ All services started!${NC}"
echo "========================================="
echo ""
echo "📊 Admin Panel:    http://localhost:3000"
echo "   Login: superadmin@kayak.com / Admin@123"
echo ""
echo "🌐 Traveler Site:  http://localhost:3001"
echo ""
echo "🔧 Backend API:    http://localhost:5001/health"
echo ""
echo "========================================="
echo "To stop all services, run:"
echo "  lsof -ti:5001,3000,3001 | xargs kill -9"
echo "========================================="

