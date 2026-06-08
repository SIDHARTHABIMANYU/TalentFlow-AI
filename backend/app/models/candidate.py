from sqlalchemy import Column, String, Float, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.core.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(30), nullable=True)
    skills = Column(Text, nullable=True)
    experience_years = Column(Float, nullable=True)
    education = Column(Text, nullable=True)
    resume_text = Column(Text, nullable=True)
    ocr_used = Column(Boolean, default=False)
    match_score = Column(Float, nullable=True)
    status = Column(String(50), default="pending")
    email_subject = Column(String(500), nullable=True)
    sender_email = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)