from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+psycopg2://ftuser:ftpassword@localhost:5432/fortunetelling"
    
    # LLM & OpenRouter
    LLM_BASE_URL: str = "https://openrouter.ai/api/v1"
    OPENROUTER_API_KEY: str = ""
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    
    # Models
    EXTRACTION_MODEL: str = "stepfun/step-3.5-flash:free"
    GENERATION_MODEL: str = "deepseek/deepseek-r1:free"
    
    # Collection settings
    COLLECT_MAX_ARTICLES: int = 20
    COLLECT_TOKEN_LIMIT: int = 800

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
