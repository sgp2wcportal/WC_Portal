# Residential Society Portal - Quick Start Guide

## 🚀 Quick Start

### Windows Users

**Option 1: Batch Script**
```bash
start.bat
```

**Option 2: PowerShell Script**
```powershell
.\start.ps1
```

**Option 3: Manual Start**

Terminal 1 (Backend):
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

### Mac/Linux Users

```bash
chmod +x start.sh
./start.sh
```

Or manually:

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## 🔑 Demo Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| User | user | user123 |
| Generic | generic | generic123 |

## 📱 Access URLs

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation (Swagger): http://localhost:8000/docs
- API Documentation (ReDoc): http://localhost:8000/redoc

## 📋 First-Time Setup

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (if not exists)
cp .env.example .env
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## 🗄️ Database

- **Type:** SQLite
- **File:** `backend/society.db`
- **Created:** Automatically on first backend startup
- **Persistence:** Data persists across restarts

### Database Management

View database info:
```bash
# From backend directory
python
>>> from app.database import engine
>>> print(engine.url)
>>> from app.models import user, expense, donation, subscription, announcement, coupon
>>> # Tables are created automatically
```

Reset database (delete all data):
```bash
# From project root
rm backend/society.db
# Restart backend to recreate empty database
```

## 📁 Project Structure

```
residential-society-portal/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── main.py      # Entry point
│   │   ├── models/      # Database models
│   │   ├── routes/      # API endpoints
│   │   └── services/    # Business logic
│   ├── requirements.txt
│   └── venv/            # Virtual environment
├── frontend/            # React Frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/  # Reusable components
│   │   ├── services/    # API calls
│   │   └── App.jsx      # Main component
│   ├── package.json
│   └── node_modules/
├── storage/             # File uploads (receipts, QR codes)
├── backup/              # Database backups
└── README.md            # Full documentation
```

## 🎯 Features Overview

1. **Announcements** - Post and view updates
2. **Subscriptions** - Manage flat subscriptions
3. **Donations** - Record donations and sponsorships
4. **Expenses** - Track society expenses
5. **Food Coupons** - Book event coupons with QR codes
6. **Treasury** - View financial analytics and reports

## ⚙️ Configuration

### Backend Config (.env)

```
DATABASE_URL=sqlite:///./society.db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
```

### Frontend Config (vite.config.js)

Proxy is configured to forward API calls to backend:
```
/api/* → http://localhost:8000
```

## 🛠️ Common Issues

### Backend won't start

**"ModuleNotFoundError"**
- Solution: Activate virtual environment and reinstall dependencies
```bash
source venv/bin/activate  # or .\venv\Scripts\activate.ps1 on Windows
pip install -r requirements.txt
```

**"Port 8000 already in use"**
- Solution: Kill process using port 8000 or change port in startup command

### Frontend won't connect to backend

**"Cannot connect to API"**
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify API proxy in `vite.config.js`

### Database issues

**"database is locked"**
- Restart backend
- Check if multiple backend instances are running

## 📊 API Endpoints Cheat Sheet

### Auth
- `POST /api/auth/login` - Login

### Announcements
- `GET /api/announcements/` - List
- `POST /api/announcements/` - Create (Admin)

### Subscriptions
- `GET /api/subscriptions/` - List
- `POST /api/subscriptions/` - Create

### Donations
- `GET /api/donations/` - List
- `POST /api/donations/` - Create

### Expenses
- `GET /api/expenses/` - List
- `POST /api/expenses/` - Create
- `POST /api/expenses/with-receipt` - Create with file

### Coupons
- `GET /api/coupons/menus/` - List menus
- `POST /api/coupons/` - Book coupon
- `POST /api/coupons/{id}/verify` - Verify (Admin)

### Reports
- `GET /api/reports/treasury-dashboard` - Analytics

## 🔐 Security Notes

For production deployment:
1. Change `SECRET_KEY` in `.env`
2. Set `DEBUG=False`
3. Use HTTPS
4. Implement proper password hashing
5. Set up firewall rules

## 📞 Support

For detailed documentation, see:
- **README.md** - Full feature documentation
- **DEPLOYMENT.md** - Production deployment guide
- **Backend Docs** - http://localhost:8000/docs

## 🎓 Learning Resources

### FastAPI
- Official Docs: https://fastapi.tiangolo.com/
- Tutorial: https://fastapi.tiangolo.com/tutorial/

### React
- Official Docs: https://react.dev/
- React Router: https://reactrouter.com/

### Tailwind CSS
- Official Docs: https://tailwindcss.com/
- Components: https://tailwindcss.com/docs/components

---

**Happy coding! 🚀**

For issues or questions, check the logs in the terminal or browser console.
