from fastapi import APIRouter

from app.api.v1 import (
    admin,
    products,
    catalog,
    orders,
)


api_router = APIRouter()

api_router.include_router(
    admin.router,
)

api_router.include_router(
    products.router,
)

api_router.include_router(
    catalog.router,
)

api_router.include_router(
    catalog.buyer_router,
)

api_router.include_router(
    orders.router,
)