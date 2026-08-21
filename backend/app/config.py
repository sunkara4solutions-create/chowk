from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://chowk:chowk123@localhost:5432/chowk_db"
    SECRET_KEY: str = "dev-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days

    WHATSAPP_PROVIDER: Literal["meta", "twilio", "mock"] = "mock"

    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_FROM: str = "whatsapp:+14155238886"

    META_PHONE_NUMBER_ID: str = ""
    META_ACCESS_TOKEN: str = ""
    META_WEBHOOK_VERIFY_TOKEN: str = "chowk_verify_token"

    TWILIO_VERIFY_SID: str = ""  # Create at console.twilio.com → Verify → Services

    APP_NAME: str = "Chowk"
    APP_ENV: str = "development"
    FRONTEND_URL: str = "http://localhost:3000"

    ANTHROPIC_API_KEY: str = ""

    SENTRY_DSN: str = ""

    ADMIN_PHONE: str = "9999999999"
    ADMIN_PASSWORD: str = "changeme123"

    class Config:
        env_file = ".env"


settings = Settings()
