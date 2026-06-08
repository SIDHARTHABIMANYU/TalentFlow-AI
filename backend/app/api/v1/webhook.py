from fastapi import APIRouter
from typing import Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter()

class TelegramUpdate(BaseModel):
    callback_query: Optional[Dict[str, Any]] = None
    message: Optional[Dict[str, Any]] = None

@router.post("/telegram")
async def telegram_webhook(update: TelegramUpdate):
    data = update.dict()
    
    if "callback_query" in data and data["callback_query"]:
        callback = data["callback_query"]
        callback_data = callback["data"]
        
        parts = callback_data.split("_", 1)
        action = parts[0]
        candidate_id = parts[1] if len(parts) > 1 else None
        
        if not candidate_id:
            return {"status": "error", "message": "No candidate ID"}
        
        from app.core.database import SessionLocal
        from app.models.candidate import Candidate
        from app.modules.email_sender.smtp_sender import send_interview_invite, send_rejection_email
        
        db = SessionLocal()
        try:
            candidate = db.query(Candidate).filter(
                Candidate.id == candidate_id
            ).first()
            
            if not candidate:
                return {"status": "error", "message": "Candidate not found"}
            
            if action == "approve":
                send_interview_invite(
                    candidate.email,
                    candidate.full_name,
                    "Open Position"
                )
                candidate.status = "approved"
                db.commit()
                return {"status": "approved"}
            
            elif action == "reject":
                send_rejection_email(
                    candidate.email,
                    candidate.full_name,
                    "Open Position"
                )
                candidate.status = "rejected"
                db.commit()
                return {"status": "rejected"}
        
        finally:
            db.close()
    
    return {"status": "ok"}

@router.post("/trigger")
async def manual_trigger(required_skills: str = "Python, SQL, Machine Learning"):
    from celery_app.tasks import poll_emails
    poll_emails.delay()
    return {"status": "triggered", "message": "Email polling started!"}