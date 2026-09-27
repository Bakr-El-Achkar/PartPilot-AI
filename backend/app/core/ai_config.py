from functools import lru_cache

from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


class AISettings(BaseSettings):
    # ========================================================
    # OLLAMA / QWEN
    # ========================================================

    ollama_host: str = (
        "http://localhost:11434"
    )

    ollama_model: str = (
        "vehnexa-qwen3"
    )

    ollama_timeout_seconds: float = (
        300.0
    )

    # ========================================================
    # PROTECTED VEH NEXA AI GATEWAY
    # ========================================================

    vehnexa_ai_proxy_token: str = ""

    # ========================================================
    # ENVIRONMENT
    # ========================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_ai_settings() -> AISettings:
    return AISettings()


ai_settings = get_ai_settings()