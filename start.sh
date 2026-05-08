#!/bin/bash
# Start Residential Society Portal (Linux/Mac)

echo "Starting Siddha Galaxia Phase 2 Welfare Committee Portal..."
echo ""

# Check if running from correct directory
if [ ! -d "backend" ]; then
    echo "ERROR: Please run this script from the project root directory!"
    exit 1
fi

# Create virtual environment if not exists
if [ ! -d "backend/venv" ]; then
    echo "Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    cd ..
fi

# Start Backend
echo "Starting Backend Server..."
(
    cd backend
    source venv/bin/activate
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
echo "Starting Frontend Server..."
(
    cd frontend
    npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "================================"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo "================================"
echo ""
echo "Demo Credentials:"
echo "  Admin: admin / admin123"
echo "  User: user / user123"
echo "  Generic: generic / generic123"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait
