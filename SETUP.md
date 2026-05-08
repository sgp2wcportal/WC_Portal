> **Quick Start: Install & Run**
>
> 1. **Backend:**
>    - Open terminal, run:
>      ```powershell
>      cd backend
>      python -m venv venv
>      .\venv\Scripts\Activate.ps1
>      pip install -r requirements.txt
>      python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
>      ```
> 2. **Frontend:**
>    - Open new terminal, run:
>      ```powershell
>      cd frontend
>      npm install
>      npm run dev
>      ```
> 3. **Access:**
>    - Frontend: http://localhost:3000
>    - Backend API: http://localhost:8000
>
> See below for full details.

# Residential Society Portal - Setup Instructions

## 📦 Complete Project Deliverables

Your residential society management portal has been fully implemented with the following:

### ✅ Backend (FastAPI Python)
- Authentication system with 3 roles (Admin, User, Generic)
- 7 API modules:
  - Authentication & Login
  - Announcements Management
  - Subscription Management
  - Donations & Sponsorships
  - Expense Tracking
  - Coupon System with QR generation
  - Treasury Analytics & Reports
- SQLite database with persistent storage
- Hardcoded credentials for MVP (easily replaceable)
- File upload support for receipts
- QR code generation for coupons
- Role-based access control (RBAC)

### ✅ Frontend (React + Vite)
- Modern, responsive UI with Tailwind CSS
- 8 main pages:
  - Login Page with demo credentials
  - Dashboard with tile navigation
  - Announcements (post and view)
  - Subscriptions (record and view)
  - Donations (record and analytics)
  - Expenses (track with receipt upload)
  - Food Coupons (book and manage)
  - Treasury Analytics (charts and visualizations)
- Axios-based API integration
- Zustand state management
- Recharts for beautiful data visualizations
- JWT token-based authentication

### ✅ Database (SQLite)
- Tables for: Users, Announcements, Subscriptions, Donations, Expenses, Coupons, Coupon Menus
- Automatic schema creation
- Persistent storage in `backend/society.db`
- Ready for backups and migrations

### ✅ Documentation
- README.md - Complete feature documentation
- DEPLOYMENT.md - Production deployment guide
- QUICKSTART.md - Quick start guide
- This file - Setup instructions

---

## 🚀 Getting Started

### Prerequisites
- Windows 10/11 or Windows Server 2016+
- Python 3.10 or higher (https://www.python.org/)
- Node.js 18 LTS or higher (https://nodejs.org/)
- Git (recommended, https://git-scm.com/)

### Step 1: Clone/Extract Project

If you have the project files, navigate to the project directory:
```powershell
cd C:\Users\YourUsername\Downloads\SGP2
# Or wherever you've placed the project
```

### Step 2: Install Python Packages (Backend)

```powershell
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# If you get an execution policy error, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Install dependencies
pip install -r requirements.txt
```

**Verify Installation:**
```powershell
pip list
# You should see: fastapi, uvicorn, sqlalchemy, pydantic, python-jose, etc.
```

### Step 3: Install Node Packages (Frontend)

```powershell
cd frontend

# Install dependencies
npm install
```

**Verify Installation:**
```powershell
npm list
# Should show react, react-router-dom, axios, recharts, etc.
```

### Step 4: Start the Application

You have 3 options:

**Option A: Double-click start script (Easiest)**
- Windows: Double-click `start.bat`
- This opens both backend and frontend in new terminal windows

**Option B: PowerShell script**
```powershell
.\start.ps1
```

**Option C: Manual startup (Most control)**

Terminal 1 - Backend:
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
```

### Step 5: Access the Application

Once both servers are running:

**Frontend:** http://localhost:3000
**Backend API:** http://localhost:8000
**API Documentation:** http://localhost:8000/docs

### Step 6: Login

Use any of these demo credentials:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| User | user | user123 |
| Generic | generic | generic123 |

---

## 📊 Feature Overview

### 1. Dashboard
- Welcome screen with role-based tile menu
- Quick access to all modules

### 2. Announcements
- **Admin:** Create and post announcements
- **All Users:** View latest announcements

### 3. Subscriptions
- Record flat subscriptions for current year
- Track owner/rented person details
- Store contact information and family size
- View all subscriptions in table format

### 4. Donations & Sponsorships
- Record donation/sponsorship received
- Track donor details
- Categorize donation type
- View analytics

### 5. Expense Management
- Track all society expenses
- Categorize: Miscellaneous, Decorator, Caterer, Internal Meetings, Maintenance
- Classify by occasion: Puja, Meetings, Events, etc.
- Upload receipt/bill images
- View expense analytics

### 6. Food Coupons
- **Admin/Generic:** Create event menus with veg/non-veg options and prices
- **All Users:** Book coupons for events
- Automatic price calculation
- QR code generation and email delivery
- **Admin/Generic:** Verify coupons on event day
- Coupon redemption tracking

### 7. Treasury Analytics
- Income vs Expense dashboard
- Breakdown by category and occasion
- Donation analytics
- Subscription collection overview
- Balance calculation
- Beautiful Recharts visualizations

---

## 💾 Database & Persistence

### Location
- Database file: `backend/society.db`
- Created automatically on first backend startup
- All data persists across restarts

### Reset Database (if needed)
```powershell
# Stop backend first
# Then:
Remove-Item backend/society.db
# Restart backend to create fresh database
```

### Backup Database
```powershell
# Simple copy
Copy-Item backend/society.db "backup/society_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"
```

---

## ⚙️ Configuration

### Backend Configuration (.env file)

The `.env` file in `backend/` directory controls backend settings:

```ini
DATABASE_URL=sqlite:///./society.db    # Database location
SECRET_KEY=your-secret-key             # Change for production!
ALGORITHM=HS256                         # JWT algorithm
ACCESS_TOKEN_EXPIRE_MINUTES=30          # Session timeout
DEBUG=True                              # False for production
```

### Frontend Configuration (vite.config.js)

The frontend automatically proxies API calls to backend:
- Frontend URL: http://localhost:3000
- Backend URL: http://localhost:8000
- Proxy: /api/* → http://localhost:8000

---

## 🔐 Security Notes

### For MVP/Development
- Credentials are hardcoded (in `auth_service.py`)
- CORS is open to all origins
- Debug mode is enabled

### For Production Deployment
1. Change `SECRET_KEY` in `.env`
2. Set `DEBUG=False`
3. Implement real user registration/authentication
4. Use HTTPS with SSL certificate
5. Restrict CORS origins
6. Hash passwords with bcrypt
7. Implement rate limiting
8. Use environment variables for sensitive data
9. Set up firewalls and security groups
10. Regular backups and monitoring

See `DEPLOYMENT.md` for production deployment guide.

---

## 🛠️ Troubleshooting

### Backend Issues

**"ModuleNotFoundError: No module named 'fastapi'"**
- Solution: Activate virtual environment
  ```powershell
  cd backend
  .\venv\Scripts\Activate.ps1
  ```

**"Address already in use: port 8000"**
- Solution: Either stop other process or change port
  ```powershell
  # Change port in backend startup
  python -m uvicorn app.main:app --port 8001
  ```

**"database is locked"**
- Solution: Restart backend (SQLite locks on errors)

### Frontend Issues

**"Cannot GET /api/..."**
- Ensure backend is running on port 8000
- Check browser Network tab for errors

**"npm ERR! EACCES: permission denied"**
- Solution: Run as administrator or fix npm permissions

**Blank page or "Cannot connect to API"**
- Check browser console (F12)
- Verify backend is running
- Clear browser cache (Ctrl+Shift+Delete)

### General Issues

**Both servers running but can't login**
- Check if credentials are correct (admin/admin123, etc.)
- Check browser console for JavaScript errors
- Check terminal for backend errors

**Ports already in use**
```powershell
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill that process (replace PID)
taskkill /PID <PID> /F
```

---

## 📁 Project Structure

```
residential-society-portal/
├── backend/                           # FastAPI backend
│   ├── app/
│   │   ├── main.py                   # App entry point
│   │   ├── config.py                 # Configuration
│   │   ├── database.py               # DB setup
│   │   ├── models/                   # Database models
│   │   │   ├── user.py
│   │   │   ├── announcement.py
│   │   │   ├── subscription.py
│   │   │   ├── donation.py
│   │   │   ├── expense.py
│   │   │   └── coupon.py
│   │   ├── schemas/                  # Request/response schemas
│   │   ├── routes/                   # API endpoints
│   │   ├── services/                 # Business logic
│   │   └── utils/                    # Utilities
│   ├── requirements.txt              # Python dependencies
│   ├── .env                          # Configuration (don't commit)
│   ├── .env.example                  # Configuration template
│   ├── .gitignore
│   ├── venv/                         # Virtual environment
│   └── society.db                    # SQLite database (auto-created)
│
├── frontend/                          # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── AnnouncementsPage.jsx
│   │   │   ├── SubscriptionsPage.jsx
│   │   │   ├── DonationsPage.jsx
│   │   │   ├── ExpensesPage.jsx
│   │   │   ├── CouponsPage.jsx
│   │   │   └── TreasuryPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   └── [other services]
│   │   ├── store/
│   │   │   └── authStore.js          # State management
│   │   ├── App.jsx                   # Main app component
│   │   ├── main.jsx                  # React entry point
│   │   └── index.css                 # Tailwind CSS
│   ├── index.html
│   ├── package.json                  # Node dependencies
│   ├── vite.config.js                # Build config
│   ├── tailwind.config.js            # Tailwind config
│   ├── .gitignore
│   └── node_modules/                 # Installed packages
│
├── storage/                           # File uploads
│   ├── receipts/                     # Receipt images
│   │   └── YYYY/MM/...               # Organized by date
│   └── qrcodes/                      # Generated QR codes
│
├── backup/                            # Database backups
│
├── README.md                          # Full documentation
├── QUICKSTART.md                      # Quick start guide
├── DEPLOYMENT.md                      # Production deployment
├── SETUP.md                           # This file
├── start.bat                          # Windows batch starter
├── start.ps1                          # PowerShell starter
├── start.sh                           # Bash starter
└── .gitignore                         # Git ignore rules
```

---

## 📚 API Quick Reference

### Authentication
```
POST /api/auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "access_token": "...", "token_type": "bearer", "role": "admin" }
```

### Announcements
```
GET /api/announcements/              # List all
POST /api/announcements/             # Create (admin only)
GET /api/announcements/{id}          # Get one
PUT /api/announcements/{id}          # Update (admin only)
DELETE /api/announcements/{id}       # Delete (admin only)
```

### Subscriptions
```
GET /api/subscriptions/              # List all
POST /api/subscriptions/             # Create
GET /api/subscriptions/{id}          # Get one
GET /api/subscriptions/analytics     # Get stats
```

### Donations
```
GET /api/donations/                  # List all
POST /api/donations/                 # Create
GET /api/donations/{id}              # Get one
GET /api/donations/analytics         # Get stats
```

### Expenses
```
GET /api/expenses/                   # List all
POST /api/expenses/                  # Create
POST /api/expenses/with-receipt      # Create with file
GET /api/expenses/analytics          # Get stats
```

### Coupons
```
GET /api/coupons/menus/              # List menus
POST /api/coupons/menus/             # Create menu (admin/generic)
POST /api/coupons/                   # Book coupon
POST /api/coupons/{id}/verify        # Verify (admin/generic)
GET /api/coupons/event/{name}        # Get event coupons
```

### Reports
```
GET /api/reports/treasury-dashboard  # Complete analytics
```

---

## 🎓 Next Steps

1. **Explore the UI** - Login and navigate through all pages
2. **Try creating records** - Add announcements, subscriptions, etc.
3. **View database** - Check `backend/society.db` (use DB browser)
4. **Read the docs** - Check README.md for detailed features
5. **Plan customization** - Note what you want to change for production

---

## 🚀 Production Deployment

When ready for production deployment:

1. Review `DEPLOYMENT.md` for Windows server setup
2. Change `SECRET_KEY` in `.env`
3. Set `DEBUG=False`
4. Set up SSL/HTTPS
5. Configure backups and monitoring
6. Use a process manager (NSSM) for auto-restart
7. Set up Nginx as reverse proxy
8. Implement proper logging

---

## 📞 Support Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **React Docs:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **Recharts:** https://recharts.org/
- **SQLAlchemy:** https://docs.sqlalchemy.org/

---

## ✨ Features Implemented

✅ Multi-role authentication (Admin, User, Generic)
✅ Announcements with admin posting
✅ Subscription management
✅ Donation/sponsorship tracking
✅ Expense tracking with categories
✅ Receipt image uploads
✅ Food coupon system with QR codes
✅ Coupon verification workflow
✅ Treasury analytics and charts
✅ Persistent SQLite database
✅ Role-based access control
✅ Modern responsive UI
✅ Automatic database initialization
✅ API documentation (Swagger)
✅ Error handling
✅ Input validation

---

**You now have a fully functional residential society management portal!**

For any questions or issues, refer to the detailed documentation in README.md, QUICKSTART.md, and DEPLOYMENT.md.

**Happy managing! 🏢**
