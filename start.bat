@echo off
REM Startup script for Residential Society Portal (Windows)

echo Starting Siddha Galaxia Phase 2 Welfare Committee Portal...
echo.

REM Check if running from correct directory
if not exist "backend" (
    echo ERROR: Please run this script from the project root directory!
    pause
    exit /b 1
)

REM Start Backend
echo Starting Backend Server...
start "Backend - FastAPI" cmd /k "cd backend && .\venv\Scripts\activate.ps1 && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Start Frontend
echo Starting Frontend Server...
timeout /t 3 /nobreak
start "Frontend - React" cmd /k "cd frontend && npm run dev"

echo.
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo API Documentation at: http://localhost:8000/docs
echo.
echo Demo Credentials:
echo   Admin: admin / admin123
echo   User: user / user123
echo   Generic: generic / generic123
echo.
pause
