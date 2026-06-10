from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api.v1 import candidates, jobs, auth, webhook

Base.metadata.create_all(bind=engine)

# Load company knowledge into ChromaDB on startup
try:
    from app.modules.rag.company_knowledge import load_company_knowledge
    load_company_knowledge()
    print("✅ Company knowledge loaded!")
except Exception as e:
    print(f"⚠ ChromaDB load failed: {str(e)}")

app = FastAPI(
    title="Inceptrac AI Recruitment System",
    description="AI powered recruitment email automation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://13.126.76.141", "http://13.126.76.141:80", "https://recruitment.inceptarc.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(candidates.router, prefix="/api/v1/candidates", tags=["Candidates"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["Jobs"])
app.include_router(webhook.router, prefix="/api/v1/webhook", tags=["Webhook"])

@app.get("/")
def home():
    return {
        "message": "Inceptrac AI Recruitment System is Running!",
        "status": "ok",
        "version": "1.0.0"
    }
