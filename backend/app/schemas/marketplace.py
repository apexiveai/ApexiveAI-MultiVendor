from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TenantCreate(BaseModel):
    community_tenant_id: str
    name: str
    currency: str = "MMK"


class TenantResponse(TenantCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    active: bool


class SellerCreate(BaseModel):
    community_user_id: str
    seller_code: str
    shop_name: str
    description: str | None = None
    commission_rate: Decimal = Field(
        default=Decimal("10.00"),
        ge=0,
        le=100,
    )


class SellerResponse(SellerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    active: bool


class BuyerCreate(BaseModel):
    community_user_id: str
    buyer_code: str
    display_name: str


class BuyerResponse(BuyerCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    active: bool


class SellerProfileCreate(BaseModel):
    seller_code: str = Field(min_length=2, max_length=100)
    shop_name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    commission_rate: Decimal = Field(
        default=Decimal("10.00"),
        ge=0,
        le=100,
    )


class BuyerProfileCreate(BaseModel):
    buyer_code: str = Field(min_length=2, max_length=100)
    display_name: str = Field(min_length=2, max_length=255)


class MarketplaceAccountProvision(BaseModel):
    community_tenant_id: str = Field(min_length=1, max_length=100)
    tenant_name: str = Field(min_length=1, max_length=255)
    community_user_id: str = Field(min_length=1, max_length=100)
    role: Literal["SELLER", "BUYER"]
    seller: SellerProfileCreate | None = None
    buyer: BuyerProfileCreate | None = None


class CategoryCreate(BaseModel):
    name: str
    slug: str


class CategoryResponse(CategoryCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    active: bool


class ProductCreate(BaseModel):
    sku: str
    name: str
    slug: str
    description: str | None = None
    price: Decimal = Field(gt=0)
    stock_quantity: int = Field(default=0, ge=0)
    category_id: int | None = None
    image_url: str | None = None


class ProductResponse(ProductCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tenant_id: int
    seller_id: int
    approved: bool
    active: bool


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    items: list[CartItemCreate] = Field(min_length=1)


class OrderResponse(BaseModel):
    order_number: str
    subtotal: Decimal
    commission_amount: Decimal
    total_amount: Decimal
    currency: str
    status: str