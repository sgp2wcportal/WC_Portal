# Residential Society Management Portal

## Project Overview

**Siddha Galaxia Phase 2 Welfare Committee Portal 2026-27**

A comprehensive residential society management application built with FastAPI (Python backend) and React (frontend) on a single server with SQLite database.

## Features

### 1. Authentication
- Three-role login system (Admin, User, Generic)
- JWT-based authentication
- Hardcoded credentials for MVP

### 2. Announcements
- Admin posts announcements
- All users can view latest updates
- Active/inactive status management

### 3. Subscriptions
- Record flat ownership subscriptions
- Owner/rented person details
- Contact information and family size
- Persistent storage in database

### 4. Donations & Sponsorships
- Record all donations and sponsorships
- Track donor information
- Categorize donation types

### 5. Expenses
- Track all society expenses
- Category management (Miscellaneous, Decorator, Caterer, Internal Meetings, Maintenance)
- Occasion-based classification
- Receipt image upload capability
- Financial breakdown by category

### 6. Treasury Analytics
- Comprehensive dashboard with charts and visualizations
- Income vs Expense analysis
- Expense breakdown by category and occasion
- Donation tracking and analytics
- Subscription collection overview
- Balance calculation

### 7. Food Coupons
- Event-based coupon system
- Veg/Non-Veg menu management with prices
- Automatic price calculation
- QR code generation for each coupon
- Email delivery of QR codes
- Coupon verification and redemption tracking
- Admin scanning support for event day validation

### 8. Data Persistence
- SQLite database with WAL mode for better concurrency
- All data persisted locally
- Automatic backup capabilities

## Technology Stack

### Backend
- **Framework:** FastAPI
- **Database:** SQLite
- **ORM:** SQLAlchemy
- **Authentication:** JWT + python-jose
- **File Storage:** Local filesystem with metadata in DB
- **QR Codes:** python-qrcode

### Frontend
- **Framework:** React 18
- **Routing:** React Router v6
- **State Management:** Zustand
- **UI Styling:** Tailwind CSS
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Build Tool:** Vite

## Project Structure

```
residential-society-portal/
├── backend/
│   ├── app/
│   │   ├── main.py (FastAPI app entry)
│   │   ├── config.py (Settings)
│   │   ├── database.py (DB connection)
│   │   ├── models/ (Database models)
│   │   ├── schemas/ (Pydantic validation)
│   │   ├── routes/ (API endpoints)
│   │   ├── services/ (Business logic)
│   │   └── utils/ (Helpers)
│   ├── requirements.txt
│   ├── .env.example
│   └── .gitignore
├── frontend/
│   ├── src/
│   │   ├── components/ (Reusable components)
│   │   ├── pages/ (Page components)
│   │   ├── services/ (API calls)
│   │   ├── store/ (State management)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .gitignore
├── storage/ (File uploads - not in git)
│   ├── receipts/
│   └── qrcodes/
├── backup/ (Database backups - not in git)
└── README.md
```

## Setup & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Backend Setup

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Create .env file (copy from .env.example):
```bash
cp .env.example .env
```

3. Run the FastAPI server:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Usage

### Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| User | user | user123 |
| Generic | generic | generic123 |

### Role-Based Access

**Admin:**
- Create/update announcements
- Manage food coupon menus
- Create expenses with receipts
- Record donations
- View treasury analytics
- Verify/redeem coupons

**User:**
- View announcements
- Book food coupons
- Record subscriptions
- View treasury data
- View donations

**Generic:**
- All admin privileges for events
- Create announcements
- Manage coupons
- Record expenses
- View analytics

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Announcements
- `GET /api/announcements/` - List announcements
- `POST /api/announcements/` - Create announcement (Admin only)
- `PUT /api/announcements/{id}` - Update announcement (Admin only)
- `DELETE /api/announcements/{id}` - Delete announcement (Admin only)

### Subscriptions
- `GET /api/subscriptions/` - List subscriptions
- `POST /api/subscriptions/` - Create subscription
- `GET /api/subscriptions/analytics` - Subscription analytics

### Donations
- `GET /api/donations/` - List donations
- `POST /api/donations/` - Create donation
- `GET /api/donations/analytics` - Donation analytics

### Expenses
- `GET /api/expenses/` - List expenses
- `POST /api/expenses/` - Create expense
- `POST /api/expenses/with-receipt` - Create expense with receipt
- `GET /api/expenses/analytics` - Expense analytics

### Coupons
- `GET /api/coupons/menus/` - List coupon menus
- `POST /api/coupons/menus/` - Create menu (Admin/Generic)
- `POST /api/coupons/` - Book coupon
- `POST /api/coupons/{id}/verify` - Verify coupon (Admin/Generic)

### Reports
- `GET /api/reports/treasury-dashboard` - Treasury dashboard data

## Database Schema

### Tables
- `users` - User login records
- `announcements` - Society announcements
- `subscriptions` - Flat subscription records
- `donations` - Donations and sponsorships
- `expenses` - Expense records
- `coupon_menus` - Food coupon menus
- `coupons` - Individual coupon bookings

## Data Persistence & Backup

### SQLite Persistence
- WAL (Write-Ahead Logging) mode enabled for better concurrency
- All data stored locally in `society.db`
- Database file preserved across restarts

### Backup Strategy
Create a scheduled backup script (Windows batch or PowerShell):

```powershell
# backup.ps1
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupPath = "backup/society_$timestamp.db"
Copy-Item "backend/society.db" $backupPath
Write-Host "Backup created: $backupPath"
```

Schedule this to run daily via Task Scheduler.

## Deployment

### Single Server Setup

1. Install Python and Node.js on server
2. Clone repository
3. Set up backend virtual environment
4. Install dependencies (backend & frontend)
5. Build frontend: `npm run build`
6. Set up reverse proxy (Nginx) to route:
   - `/api/*` → FastAPI (port 8000)
   - `/` → React build (port 3000 or serve as static)
7. Use systemd or supervisor for process management
8. Set up SSL with Let's Encrypt

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

## Performance Considerations

- SQLite suitable for up to 100 concurrent users
- For larger societies, migrate to PostgreSQL
- Enable database indexing on frequently queried fields
- Implement caching for analytics queries
- Use connection pooling in SQLAlchemy

## Security Considerations

- Change `SECRET_KEY` in `.env` for production
- Use HTTPS/SSL for all communications
- Implement rate limiting on API endpoints
- Hash passwords in production (use bcrypt)
- Validate all file uploads
- Implement CSRF protection
- Use environment variables for sensitive data

## Future Enhancements

1. **Phase 2:** UPI payment integration, email automation
2. **Phase 3:** Mobile app for coupon scanning
3. **Phase 4:** Advanced reporting and forecasting
4. **Phase 5:** Multi-property support, scalability improvements

## Troubleshooting

### Backend Issues
- Check database connectivity: `python -c "from app.database import engine; print(engine.url)"`
- Verify environment variables in `.env`
- Check logs in terminal

### Frontend Issues
- Clear browser cache and localStorage
- Check API proxy in `vite.config.js`
- Verify backend is running on port 8000

### Database Issues
- SQLite locking: Restart backend
- Reset database: Delete `society.db` and restart
- Check database permissions: Must have write access to backend folder

## Support & Documentation

API Swagger documentation: `http://localhost:8000/docs`
ReDoc documentation: `http://localhost:8000/redoc`

## License

This project is proprietary to Siddha Galaxia Phase 2 Welfare Committee.

---

**Last Updated:** May 2026
**Version:** 1.0.0
