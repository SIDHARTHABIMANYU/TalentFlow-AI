from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.job import Job
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class JobCreate(BaseModel):
    title: str
    department: Optional[str] = None
    required_skills: str
    min_experience_years: Optional[float] = 0.0

@router.get("/")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    return jobs

@router.post("/")
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    new_job = Job(
        title=job.title,
        department=job.department,
        required_skills=job.required_skills,
        min_experience_years=job.min_experience_years
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@router.delete("/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}