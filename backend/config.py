from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    # Define your application settings here.
    # These will be loaded from environment variables or a .env file.
    DATABASE_URL: str = "sqlite:////tmp/garden_data.db"
    CORS_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8444",
    ]

    # Pydantic-settings configuration
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding='utf-8')

# Create a single instance of the settings to be imported in other files
settings = Settings()
