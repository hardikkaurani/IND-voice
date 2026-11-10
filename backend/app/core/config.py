"""Application Settings and Configuration."""
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "IND-voice"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    PORT: int = 8000
    
    # Database
    DATABASE_URL: str = "sqlite:///./ind_voice.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ind-voice.vercel.app"
    ]
    
    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            import json
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # Gnani AI (Vachana Platform)
    GNANI_API_KEY: str = "vach_1ytE2CY5X2PpTSkjUGV8kLW9KIHYQyCNYAPKS31WjE32KBAvotI9UTwi4PwPRvadmUJMjyeZstmsiHn8jpAeYnwHHftXoyiu_c33505d73045cfb8a72723c706a18da5"
    GNANI_BASE_URL: str = "https://api.vachana.ai"
    GNANI_TIMEOUT_SECONDS: float = 30.0

    # Evon Foundation Model (OpenAI-compatible inference endpoint)
    EVON_API_BASE_URL: str = ""
    EVON_API_KEY: str = ""
    EVON_MODEL_NAME: str = "gnani/gnani-evon-v3.3-30B-A3B"

    # Audio Constraints
    MAX_AUDIO_SIZE_MB: int = 15
    MAX_AUDIO_DURATION_SECONDS: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
