from functools import cached_property
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Runtime configuration, read from environment variables or a `.env` file."""

    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    project_name: str = "Climber API"
    version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"

    database_url: str = f"sqlite:///{BACKEND_DIR / 'climber.db'}"
    seed_on_startup: bool = True

    # Comma separated list, e.g. "http://localhost:3000,https://climber.app"
    cors_origins: str = "http://localhost:3000"

    @cached_property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
