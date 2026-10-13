from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):

    PROJECT_NAME: str = "Multi-Tenant Project & Workflow Management platform"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = (
        "postgresql+psycopg://postgres:postgres@localhost:5432/"
        "multi_tenant_workflow_db"
    )

    SECRET_KEY: str = "CHANGE_THIS_TO_A_LONG_RAMDOM_SECRET_KEY"
    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = Field(
        default = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    )

    model_config = SettingsConfigDict(
        env_file = ".env",
        env_file_encoding = "utf-8",
        case_sensitive = True,
        extra = "ignore",
    )

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()