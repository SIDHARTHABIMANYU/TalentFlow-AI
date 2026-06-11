from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.security import create_access_token
import logging
import requests

logger = logging.getLogger(__name__)
router = APIRouter()

ALLOWED_DOMAIN = "inceptarc.com"

class GoogleTokenRequest(BaseModel):
    token: str

@router.post("/google")
def google_login(request: GoogleTokenRequest):
    try:
        response = requests.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={request.token}"
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        idinfo = response.json()
        email = idinfo.get("email")
        name = idinfo.get("name", "")

        if not email.endswith(f"@{ALLOWED_DOMAIN}"):
            raise HTTPException(status_code=403, detail="Access denied. Only @inceptarc.com emails allowed.")

        token = create_access_token(data={"sub": email, "name": name})
        return {
            "access_token": token,
            "token_type": "bearer",
            "email": email,
            "name": name
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Auth failed: {str(e)}")
