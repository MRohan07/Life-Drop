#!/usr/bin/env bash
# LifeDrop Cross-Platform Development Launcher (macOS & Linux)
set -e

echo "=========================================="
echo " Starting LifeDrop Platform (macOS/Linux) "
echo "=========================================="

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js (v18+ or v20+)."
    exit 1
fi

echo "1. Checking Backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "2. Applying database migrations & generating Prisma client..."
npx prisma generate
npx prisma migrate deploy || echo "Database not reachable yet. Please ensure PostgreSQL is running."

echo "3. Starting Backend API on http://localhost:5001..."
npm run dev &
BACKEND_PID=$!
cd ..

echo "4. Checking Frontend dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo "5. Starting Frontend on http://localhost:3000..."
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

npm run dev

