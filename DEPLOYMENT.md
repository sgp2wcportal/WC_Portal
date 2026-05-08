# Deployment Guide - Windows

## Prerequisites
- Windows Server 2016 or later (or Windows 10/11 for development)
- Python 3.10+ installed and added to PATH
- Node.js 18+ installed and added to PATH
- Administrator access

## Step 1: Install Required Software

### Python Setup
1. Download Python 3.10+ from python.org
2. Install with "Add Python to PATH" option checked
3. Verify: Open PowerShell and run `python --version`

### Node.js Setup
1. Download Node.js LTS from nodejs.org
2. Install with default settings
3. Verify: Open PowerShell and run `node --version` and `npm --version`

## Step 2: Clone/Setup Project

```powershell
cd C:\projects  # or your desired location
# If using git:
# git clone <repository-url> residential-society-portal
cd residential-society-portal
```

## Step 3: Backend Setup

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from example)
Copy-Item .env.example .env

# Edit .env with your settings if needed
```

## Step 4: Frontend Setup

```powershell
cd ..\frontend

# Install dependencies
npm install

# Build for production
npm run build
```

## Step 5: Start Services

### Terminal 1 - Backend
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend (Development)
```powershell
cd frontend
npm run dev
```

Or for production, use the built files served by backend or Nginx.

## Step 6: Database Initialization

The database will be created automatically on first run. To verify:

```powershell
# Check if society.db was created
Test-Path .\backend\society.db
```

## Step 7: Setup Windows Scheduled Task for Backups

Create a PowerShell script `backup.ps1`:

```powershell
# C:\projects\residential-society-portal\backup\backup.ps1

$backupDir = "C:\projects\residential-society-portal\backup"
$dbSource = "C:\projects\residential-society-portal\backend\society.db"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "$backupDir\society_backup_$timestamp.db"

# Create backup directory if not exists
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Copy database
Copy-Item -Path $dbSource -Destination $backupPath -Force

# Keep only last 30 days of backups
$cutoffDate = (Get-Date).AddDays(-30)
Get-Item "$backupDir\society_backup_*.db" | 
    Where-Object { $_.CreationTime -lt $cutoffDate } | 
    Remove-Item -Force

Write-Host "Backup created: $backupPath"
```

Schedule via Task Scheduler:
1. Open Task Scheduler
2. Create Basic Task: "Society Portal Backup"
3. Trigger: Daily at 3:00 AM
4. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\projects\residential-society-portal\backup\backup.ps1"`

## Step 8: Production Deployment with Nginx

### Install Nginx

Download from https://nginx.org/en/download.html (Windows binary)

### Configure Nginx

Edit `conf\nginx.conf`:

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name localhost;

    # API proxy
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Run Nginx
```powershell
cd C:\nginx
.\nginx.exe
```

## Step 9: Setup Process Management with NSSM

Install NSSM (Non-Sucking Service Manager):

```powershell
# Download and extract NSSM
# Add to PATH or run from installation directory

# Create service for Backend
nssm install SocietyPortalBackend "C:\projects\residential-society-portal\backend\venv\Scripts\python.exe" `
    "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set SocietyPortalBackend AppDirectory "C:\projects\residential-society-portal\backend"
nssm set SocietyPortalBackend AppExit Default Restart

# Start the service
nssm start SocietyPortalBackend

# Create service for Nginx
nssm install SocietyPortalNginx "C:\nginx\nginx.exe"
nssm set SocietyPortalNginx AppDirectory "C:\nginx"
nssm start SocietyPortalNginx
```

## Step 10: Access Application

- **Development:** http://localhost:3000
- **Production:** http://localhost:80 (via Nginx)

Login with demo credentials:
- Admin: admin/admin123
- User: user/user123
- Generic: generic/generic123

## Troubleshooting

### Backend won't start
```powershell
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process using that port (replace PID)
taskkill /PID <PID> /F
```

### Frontend issues
```powershell
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -r node_modules
npm install
```

### Database locked
```powershell
# Restart backend service
nssm stop SocietyPortalBackend
nssm start SocietyPortalBackend
```

### Check service logs
```powershell
# View NSSM logs
nssm query SocietyPortalBackend
```

## Maintenance

### Regular Backups
- Automated daily at 3:00 AM
- Manual backup: Run `backup.ps1`
- Store backups on external drive or cloud

### Log Files
- Backend logs: Check terminal/service log
- Frontend: Browser console

### Database Optimization
Periodically optimize SQLite:
```powershell
python
>>> from app.database import engine
>>> engine.execute("VACUUM;")
```

## Monitoring

### Check Services Status
```powershell
# Backend
nssm status SocietyPortalBackend

# Nginx
tasklist | findstr nginx

# Ports in use
netstat -ano | findstr :8000
netstat -ano | findstr :80
```

### Performance
Monitor with Windows Task Manager or PowerShell:
```powershell
Get-Process | Where-Object {$_.Name -like "python*" -or $_.Name -like "node*"}
```

## Security Recommendations

1. Change SECRET_KEY in .env (production)
2. Use HTTPS with Let's Encrypt for Windows
3. Enable Windows Firewall
4. Run services with limited user account
5. Regular security patches for Windows, Python, Node.js
6. Keep database backups encrypted
7. Use strong passwords for admin account

## Scaling for More Users

- SQLite: Good for up to 100 concurrent users
- For 100+ users: Migrate to PostgreSQL
- Add database indexing
- Implement caching layer (Redis)
- Load balancing if needed

---

**Deployment Complete!** 

Your residential society portal is now running on Windows with automatic backups and process management.
