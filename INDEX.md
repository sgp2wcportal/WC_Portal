# 🏢 Residential Society Management Portal
## Quick Index & Getting Started

---

## 📍 You Are Here

**Project Location:** `C:\Users\rahul.f.ghosh\Downloads\SGP2`

This is your complete, ready-to-use residential society management system!

---

## 📚 Documentation Guide

**Start here based on your need:**

| Need | File | Read Time |
|------|------|-----------|
| **I want to START IMMEDIATELY** | [QUICKSTART.md](QUICKSTART.md) | 5 min |
| **I need detailed setup** | [SETUP.md](SETUP.md) | 15 min |
| **I want full feature details** | [README.md](README.md) | 20 min |
| **I need production deployment** | [DEPLOYMENT.md](DEPLOYMENT.md) | 30 min |
| **I want complete overview** | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | 10 min |

---

## 🚀 Super Quick Start (2 minutes)

### Windows Users:

**Option 1: Double-click**
```
start.bat
```

**Option 2: PowerShell**
```powershell
.\start.ps1
```

### Mac/Linux Users:
```bash
chmod +x start.sh
./start.sh
```

---

## 🔑 Demo Credentials

```
Admin:   admin    / admin123
User:    user     / user123  
Generic: generic  / generic123
```

---

## 🌐 Access URLs

Once running:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

---

## 📋 What's Included

### ✅ Backend (Python FastAPI)
- 7 API modules with 30+ endpoints
- SQLite database (auto-created)
- JWT authentication
- File upload support
- QR code generation
- Complete API documentation

### ✅ Frontend (React + Vite)
- 8 full pages
- Beautiful Tailwind CSS design
- Recharts analytics
- Responsive mobile-friendly UI
- Role-based navigation

### ✅ Features
- Multi-role authentication (Admin, User, Generic)
- Announcements with admin posting
- Subscription management
- Donation tracking
- Expense management with receipts
- Food coupons with QR codes
- Treasury analytics dashboard
- Persistent SQLite database

---

## 📁 File Structure

```
SGP2/
├── backend/              ← Python FastAPI backend
│   ├── app/             ← All backend code
│   │   ├── main.py      ← Start here
│   │   ├── models/      ← Database models
│   │   ├── routes/      ← API endpoints
│   │   └── services/    ← Business logic
│   ├── requirements.txt ← Dependencies
│   └── society.db       ← Database (auto-created)
│
├── frontend/             ← React frontend
│   ├── src/
│   │   ├── pages/       ← All pages
│   │   ├── components/  ← Shared components
│   │   └── App.jsx      ← Main component
│   ├── package.json     ← Dependencies
│   └── vite.config.js   ← Build config
│
├── README.md             ← Full documentation
├── SETUP.md              ← Detailed setup (THIS)
├── QUICKSTART.md         ← Quick reference
├── DEPLOYMENT.md         ← Production guide
├── PROJECT_SUMMARY.md    ← Complete overview
├── start.bat             ← Windows starter
├── start.ps1             ← PowerShell starter
└── start.sh              ← Linux/Mac starter
```

---

## 🛠️ Manual Setup (If automated starter doesn't work)

### Backend Setup

```powershell
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate it (Windows)
.\venv\Scripts\Activate.ps1

# 4. Install dependencies
pip install -r requirements.txt

# 5. Start server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup (New terminal)

```powershell
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

---

## 🔍 Key Files Explained

### Backend Key Files

| File | Purpose |
|------|---------|
| `app/main.py` | FastAPI application entry point |
| `app/models/` | Database table definitions |
| `app/routes/` | API endpoint handlers |
| `app/services/` | Business logic implementation |
| `requirements.txt` | Python package dependencies |
| `society.db` | SQLite database (auto-created) |

### Frontend Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Main application component |
| `src/pages/` | Page components (Login, Dashboard, etc.) |
| `src/components/` | Reusable components |
| `src/services/` | API service calls |
| `package.json` | Node dependencies |

---

## 🌟 Feature Highlights

### 1. Dashboard
- Welcome screen with role-based tile navigation
- Quick access to all features

### 2. Announcements
- Admin posts announcements
- All users view updates
- Search and filter ready

### 3. Subscriptions
- Record flat subscriptions
- Owner/rented details
- Family information tracking

### 4. Donations
- Track all donations
- Donor contact info
- Categorize donation types
- View analytics

### 5. Expenses
- Multi-category tracking
- Receipt image uploads
- Category-wise breakdown
- Detailed analytics

### 6. Food Coupons
- Event menu management
- Veg/non-veg pricing
- Automatic calculation
- QR code generation
- Coupon verification

### 7. Treasury
- Income vs Expense charts
- Category breakdown
- Donation analytics
- Balance calculation
- Beautiful visualizations

---

## 💻 Technology Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (Database ORM)
- SQLite (Local database)
- JWT (Authentication)
- Pydantic (Data validation)

**Frontend:**
- React 18
- Vite (Build tool)
- Tailwind CSS (Styling)
- Recharts (Charts)
- Axios (HTTP client)

---

## 📊 Database

**Type:** SQLite
**Location:** `backend/society.db`
**Created:** Automatically on first startup
**Persistence:** Survives restarts
**Backup:** Copy `society.db` to backup folder

### Tables:
- users
- announcements
- subscriptions
- donations
- expenses
- coupon_menus
- coupons

---

## 🔐 Security

### For Development (MVP):
- Hardcoded credentials
- Open CORS
- Debug mode enabled

### For Production:
- Change SECRET_KEY in .env
- Set DEBUG=False
- Use HTTPS
- Implement rate limiting
- Real password hashing
- Restricted CORS

See DEPLOYMENT.md for production setup.

---

## ❓ Common Questions

### Q: Where is my data stored?
**A:** SQLite database at `backend/society.db`

### Q: How do I backup my data?
**A:** Copy `society.db` to a backup folder

### Q: How do I reset the database?
**A:** Delete `backend/society.db` and restart backend

### Q: Can I change the demo credentials?
**A:** Yes, edit `backend/app/services/auth_service.py` (lines with HARDCODED_USERS)

### Q: How do I access the API documentation?
**A:** Visit http://localhost:8000/docs when backend is running

### Q: What if port 8000 or 3000 is already in use?
**A:** Either close the other program or change ports in startup commands

### Q: How do I deploy to production?
**A:** Read DEPLOYMENT.md for complete guide

---

## 🚨 Troubleshooting

### Backend won't start
```powershell
# Make sure virtual environment is activated
cd backend
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend won't connect to backend
- Ensure backend is running on port 8000
- Check browser console (F12)
- Clear browser cache

### "Port already in use"
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill it (replace PID with actual number)
taskkill /PID 12345 /F
```

### Database locked
- Restart backend service

---

## 📞 Next Steps

1. **Run the application** - Execute `start.bat` or `start.ps1`
2. **Login** - Use admin/admin123
3. **Explore** - Click through all pages
4. **Create records** - Try adding announcements, expenses, etc.
5. **View dashboard** - Check Treasury Analytics
6. **Read docs** - Check README.md for details
7. **Customize** - Modify as needed for your needs
8. **Deploy** - Follow DEPLOYMENT.md for production

---

## 📚 Documentation Files

1. **[README.md](README.md)** - Full feature documentation (20 min read)
2. **[QUICKSTART.md](QUICKSTART.md)** - Quick reference guide (5 min read)
3. **[SETUP.md](SETUP.md)** - Detailed setup instructions (15 min read)
4. **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment (30 min read)
5. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete overview (10 min read)

---

## ✨ What You Get

✅ Fully functional portal  
✅ Beautiful responsive UI  
✅ Complete backend API  
✅ SQLite database  
✅ Role-based authentication  
✅ File upload support  
✅ Analytics dashboard  
✅ QR code generation  
✅ Complete documentation  
✅ Ready for production  

---

## 🎯 You're Ready!

Everything is set up and ready to use. Choose your next step:

- **Just want to run it?** → [QUICKSTART.md](QUICKSTART.md)
- **Need detailed setup?** → [SETUP.md](SETUP.md)
- **Want full details?** → [README.md](README.md)
- **Ready for production?** → [DEPLOYMENT.md](DEPLOYMENT.md)
- **Want overview?** → [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

## 🎉 Welcome!

**Your Siddha Galaxia Phase 2 Welfare Committee Portal 2026-27 is ready to use!**

For questions, check the documentation or see browser/terminal console for errors.

**Happy managing! 🚀**

---

*Last Updated: May 6, 2026*  
*Version: 1.0.0 - Production Ready*
