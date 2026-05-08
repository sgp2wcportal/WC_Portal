from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.expense_service import get_expense_analytics
from app.services.donation_service import get_donation_analytics
from app.services.subscription_service import get_subscription_analytics

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/treasury-dashboard")
async def get_treasury_dashboard(db: Session = Depends(get_db)):
    """Get complete treasury dashboard analytics"""
    
    expenses = get_expense_analytics(db)
    donations = get_donation_analytics(db)
    subscriptions = get_subscription_analytics(db)
    
    total_income = donations["total"] + subscriptions["total_amount"]
    total_expense = expenses["total"]
    balance = total_income - total_expense
    
    return {
        "balance": balance,
        "total_income": total_income,
        "total_expense": total_expense,
        "subscriptions": subscriptions,
        "donations": donations,
        "expenses": expenses
    }
