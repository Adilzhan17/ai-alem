from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Real Estate Platform"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str = "postgresql://user:password@localhost/realestate"
    
    # AI Keys
    OPENAI_API_KEY: Optional[str] = None
    
    # Storage
    S3_BUCKET: str = "realestate-assets"
    
    class Config:
        env_file = ".env"

settings = Settings()
