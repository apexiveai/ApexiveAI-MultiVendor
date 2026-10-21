from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import CommunityPrincipal, require_buyer
from app.db.session import get_db
from app.models.marketplace import Buyer, MarketplaceTenant, Product
from app.schemas.marketplace import ProductResponse


router = APIRouter(
    prefix="/catalog",
    tags=["Marketplace Catalog"],
)

buyer_router = APIRouter(
    prefix="/buyer",
    tags=["Buyer Catalog"],
)


@router.get(
    "/products",
    response_model=list[ProductResponse],
)
def public_catalog(
    tenant_id: int = Query(...),
    search: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Product)
        .filter(
            Product.tenant_id == tenant_id,
            Product.active.is_(True),
            Product.approved.is_(True),
        )
    )

    if search:
        query = query.filter(
            Product.name.ilike(
                f"%{search}%"
            )
        )

    return (
        query
        .order_by(Product.id.desc())
        .all()
    )


@buyer_router.get(
    "/products",
    response_model=list[ProductResponse],
)
def buyer_catalog(
    db: Session = Depends(get_db),
    principal: CommunityPrincipal = Depends(require_buyer),
):
    buyer = (
        db.query(Buyer)
        .join(MarketplaceTenant, Buyer.tenant_id == MarketplaceTenant.id)
        .filter(
            Buyer.community_user_id == principal.user_id,
            Buyer.active.is_(True),
            MarketplaceTenant.community_tenant_id == principal.tenant_id,
            MarketplaceTenant.active.is_(True),
        )
        .first()
    )
    if not buyer:
        raise HTTPException(404, "Marketplace buyer profile not found")

    return (
        db.query(Product)
        .filter(
            Product.tenant_id == buyer.tenant_id,
            Product.active.is_(True),
            Product.approved.is_(True),
        )
        .order_by(Product.id.desc())
        .all()
    )