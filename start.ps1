# Start Residential Society Portal (PowerShell)

Write-Host "Starting Siddha Galaxia Phase 2 Welfare Committee Portal..." -ForegroundColor Green
Write-Host ""

# Check if running from correct directory
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: Please run this script from the project root directory!" -ForegroundColor Red
    exit 1
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd backend; .\venv\Scripts\Activate.ps1; python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" `
    -WindowStyle Normal

# Wait a bit before starting frontend
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    "cd frontend; npm run dev" `
    -WindowStyle Normal

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin / admin123"
Write-Host "  User: user / user123"
Write-Host "  Generic: generic / generic123"
Write-Host ""
