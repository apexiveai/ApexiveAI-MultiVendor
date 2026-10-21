from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import (
    CommunityPrincipal,
    require_seller,
)
from app.db.session import get_db
from app.models.marketplace import (
    MarketplaceTenant,
    Seller,
    Product,
)
from app.schemas.marketplace import (
    ProductCreate,
    ProductResponse,
)


router = APIRouter(
    prefix="/seller/products",
    tags=["Seller Products"],
)


def get_seller(
    principal: CommunityPrincipal,
    db: Session,
) -> Seller:
    if principal.tenant_id is None:
        raise HTTPException(403, "Seller account must belong to an active company")

    seller = (
        db.query(Seller)
        .join(MarketplaceTenant, Seller.tenant_id == MarketplaceTenant.id)
        .filter(
            Seller.community_user_id
            == principal.user_id,
            Seller.active.is_(True),
            MarketplaceTenant.community_tenant_id == principal.tenant_id,
            MarketplaceTenant.active.is_(True),
        )
        .first()
    )

    if not seller:
        raise HTTPException(
            status_code=404,
            detail="Marketplace seller profile not found",
        )

    return seller


@router.post(
    "",
    response_model=ProductResponse,
)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    principal: CommunityPrincipal = Depends(
        require_seller
    ),
):
    seller = get_seller(
        principal,
        db,
    )

    product = Product(
        tenant_id=seller.tenant_id,
        seller_id=seller.id,
        sku=data.sku,
        name=data.name,
        slug=data.slug,
        description=data.description,
        price=data.price,
        stock_quantity=data.stock_quantity,
        category_id=data.category_id,
        image_url=data.image_url,
        approved=False,
        active=True,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@router.get(
    "",
    response_model=list[ProductResponse],
)
def seller_products(
    db: Session = Depends(get_db),
    principal: CommunityPrincipal = Depends(
        require_seller
    ),
):
    seller = get_seller(
        principal,
        db,
    )

    return (
        db.query(Product)
        .filter(
            Product.seller_id == seller.id
        )
        .order_by(Product.id.desc())
        .all()
    )