from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "ApexiveAI Community connected "
        "Multi-Vendor Marketplace Platform"
    ),
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": settings.app_name,
        "status": "running",
        "environment": settings.app_env,
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": settings.app_name,
        "community": "CONNECTED_BY_AUTH_ADAPTER",
    }


app.include_router(
    api_router,
    prefix=settings.api_prefix,
)