from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ApexiveAI Multi-Vendor Marketplace"
    app_env: str = "development"
    api_prefix: str = "/api/v1"

    database_url: str

    community_api_url: str
    community_jwt_secret: str
    community_jwt_algorithm: str = "HS256"
    community_jwt_issuer: str = "ApexiveAI"

    marketplace_product_code: str = "MULTI_VENDOR_MARKETPLACE"

    cors_origins: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            item.strip()
            for item in self.cors_origins.split(",")
            if item.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()