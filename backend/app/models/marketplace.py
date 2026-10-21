from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class MarketplaceTenant(Base):
    __tablename__ = "marketplace_tenants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    community_tenant_id: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255))

    currency: Mapped[str] = mapped_column(
        String(10),
        default="MMK",
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    sellers = relationship(
        "Seller",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )

    buyers = relationship(
        "Buyer",
        back_populates="tenant",
        cascade="all, delete-orphan",
    )


class Seller(Base):
    __tablename__ = "sellers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("marketplace_tenants.id"),
        index=True,
    )

    community_user_id: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    seller_code: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    shop_name: Mapped[str] = mapped_column(
        String(255),
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    commission_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        default=Decimal("10.00"),
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    tenant = relationship(
        "MarketplaceTenant",
        back_populates="sellers",
    )

    products = relationship(
        "Product",
        back_populates="seller",
        cascade="all, delete-orphan",
    )


class Buyer(Base):
    __tablename__ = "buyers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("marketplace_tenants.id"),
        index=True,
    )

    community_user_id: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    buyer_code: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    display_name: Mapped[str] = mapped_column(
        String(255),
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    tenant = relationship(
        "MarketplaceTenant",
        back_populates="buyers",
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("marketplace_tenants.id"),
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
    )

    slug: Mapped[str] = mapped_column(
        String(255),
        index=True,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("marketplace_tenants.id"),
        index=True,
    )

    seller_id: Mapped[int] = mapped_column(
        ForeignKey("sellers.id"),
        index=True,
    )

    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.id"),
        nullable=True,
    )

    sku: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
    )

    slug: Mapped[str] = mapped_column(
        String(255),
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    price: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
    )

    stock_quantity: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    image_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    approved: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    seller = relationship(
        "Seller",
        back_populates="products",
    )


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    buyer_id: Mapped[int] = mapped_column(
        ForeignKey("buyers.id"),
        unique=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    items = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    cart_id: Mapped[int] = mapped_column(
        ForeignKey("carts.id"),
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        default=1,
    )

    cart = relationship(
        "Cart",
        back_populates="items",
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    tenant_id: Mapped[int] = mapped_column(
        ForeignKey("marketplace_tenants.id"),
        index=True,
    )

    buyer_id: Mapped[int] = mapped_column(
        ForeignKey("buyers.id"),
        index=True,
    )

    order_number: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        index=True,
    )

    subtotal: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default=Decimal("0"),
    )

    commission_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default=Decimal("0"),
    )

    total_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
        default=Decimal("0"),
    )

    currency: Mapped[str] = mapped_column(
        String(10),
        default="MMK",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.id"),
        index=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id"),
    )

    seller_id: Mapped[int] = mapped_column(
        ForeignKey("sellers.id"),
        index=True,
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
    )

    unit_price: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
    )

    commission_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
    )

    commission_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
    )

    seller_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2),
    )

    order = relationship(
        "Order",
        back_populates="items",
    )