from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import secrets


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    database_url: str = "sqlite:///./data/vector-observatory.db"

    # Application
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_env: str = "development"
    secret_key: str = secrets.token_urlsafe(32)

    # LLM Configuration
    llm_api_key: Optional[str] = None
    llm_provider: str = "openai-compatible"
    llm_model: str = "gpt-4o-mini"
    llm_base_url: str = "https://api.openai.com/v1"

    # Keycloak / OIDC
    keycloak_url: str = "http://localhost:8080"
    keycloak_realm: str = "vector-observatory"
    keycloak_client_id: str = "vector-observatory-client"
    keycloak_client_secret: Optional[str] = None
    keycloak_admin_user: str = "admin"
    keycloak_admin_password: str = "admin"

    # Frontend (for CORS)
    frontend_url: str = "http://localhost:5173"

    # MCP Proxy
    mcp_proxy_enabled: bool = True
    mcp_proxy_port: int = 8787

    # Compression Settings
    default_compression_mode: str = "compress"
    compression_profile: str = "full-safe"

    @property
    def is_production(self) -> bool:
        return self.app_env.lower() == "production"

    @property
    def database_url_async(self) -> str:
        if self.database_url.startswith("sqlite:///"):
            return self.database_url.replace("sqlite:///", "sqlite+aiosqlite:///")
        return self.database_url


settings = Settings()