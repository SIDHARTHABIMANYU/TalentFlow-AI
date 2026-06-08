from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str
    
    # JWT
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Gemini AI
    gemini_api_key: str
    
    # Gmail
    gmail_user: str
    gmail_password: str
    recruitment_emails: str
    
    # Matching
    min_match_score: int = 50
    hr_notify_score: int = 70

    # Telegram
    telegram_bot_token: str
    telegram_chat_id: str

    # Celery
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/0"

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()