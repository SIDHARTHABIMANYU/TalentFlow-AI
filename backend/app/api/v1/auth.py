from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, verify_password, hash_password
from pydantic import BaseModel

router = APIRouter()

class LoginRequest(BaseModel):
    username: str
    password: str

# Simple hardcoded HR login for Phase 1
HR_USERNAME = "admin"
HR_PASSWORD = "inceptrac2026"

@router.post("/login")
def login(request: LoginRequest):
    # Check username
    if request.username != HR_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check password directly
    if request.password != HR_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create JWT token
    token = create_access_token(data={"sub": request.username})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "message": "Login successful"
    }

    