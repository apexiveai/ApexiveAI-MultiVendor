from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import CommunityPrincipal, require_super_admin
from app.db.session import get_db
from app.models.marketplace import (
    MarketplaceTenant,
    Seller,
    Buyer,
)
from app.schemas.marketplace import (
    TenantCreate,
    TenantResponse,
    SellerCreate,
    SellerResponse,
    BuyerCreate,
    BuyerResponse,
    MarketplaceAccountProvision,
)


router = APIRouter(
    prefix="/admin",
    tags=["Marketplace Admin"],
)


@router.post(
    "/tenants",
    response_model=TenantResponse,
)
def create_marketplace_tenant(
    data: TenantCreate,
    db: Session = Depends(get_db),
    _: CommunityPrincipal = Depends(require_super_admin),
):
    existing = (
        db.query(MarketplaceTenant)
        .filter(
            MarketplaceTenant.community_tenant_id
            == data.community_tenant_id
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Marketplace tenant already exists",
        )

    tenant = MarketplaceTenant(
        community_tenant_id=data.community_tenant_id,
        name=data.name,
        currency=data.currency,
    )

    db.add(tenant)
    db.commit()
    db.refresh(tenant)

    return tenant


@router.post("/accounts", status_code=201)
def provision_marketplace_account(
    data: MarketplaceAccountProvision,
    db: Session = Depends(get_db),
    _: CommunityPrincipal = Depends(require_super_admin),
):
    tenant = (
        db.query(MarketplaceTenant)
        .filter(
            MarketplaceTenant.community_tenant_id == data.community_tenant_id
        )
        .first()
    )
    if tenant is None:
        tenant = MarketplaceTenant(
            community_tenant_id=data.community_tenant_id,
            name=data.tenant_name,
        )
        db.add(tenant)
        db.flush()

    if data.role == "SELLER":
        if data.seller is None or data.buyer is not None:
            raise HTTPException(422, "Seller profile details are required.")
        existing = (
            db.query(Seller)
            .filter(
                Seller.community_user_id == data.community_user_id
            )
            .first()
        )
        if existing:
            if (
                existing.tenant_id == tenant.id
                and existing.seller_code == data.seller.seller_code
                and existing.shop_name == data.seller.shop_name
                and existing.description == data.seller.description
                and existing.commission_rate == data.seller.commission_rate
            ):
                return {
                    "tenant_id": tenant.id,
                    "role": data.role,
                    "profile": existing,
                }
            raise HTTPException(409, "A seller profile already exists for this account.")
        if (
            db.query(Seller)
            .filter(Seller.seller_code == data.seller.seller_code)
            .first()
        ):
            raise HTTPException(409, "Seller code already exists.")
        profile = Seller(
            tenant_id=tenant.id,
            community_user_id=data.community_user_id,
            **data.seller.model_dump(),
        )
    else:
        if data.buyer is None or data.seller is not None:
            raise HTTPException(422, "Buyer profile details are required.")
        existing = (
            db.query(Buyer)
            .filter(
                Buyer.community_user_id == data.community_user_id
            )
            .first()
        )
        if existing:
            if (
                existing.tenant_id == tenant.id
                and existing.buyer_code == data.buyer.buyer_code
                and existing.display_name == data.buyer.display_name
            ):
                return {
                    "tenant_id": tenant.id,
                    "role": data.role,
                    "profile": existing,
                }
            raise HTTPException(409, "A buyer profile already exists for this account.")
        if (
            db.query(Buyer)
            .filter(Buyer.buyer_code == data.buyer.buyer_code)
            .first()
        ):
            raise HTTPException(409, "Buyer code already exists.")
        profile = Buyer(
            tenant_id=tenant.id,
            community_user_id=data.community_user_id,
            **data.buyer.model_dump(),
        )

    db.add(profile)
    db.commit()
    db.refresh(profile)
    return {
        "tenant_id": tenant.id,
        "role": data.role,
        "profile": profile,
    }


@router.post(
    "/tenants/{tenant_id}/sellers",
    response_model=SellerResponse,
)
def create_seller(
    tenant_id: int,
    data: SellerCreate,
    db: Session = Depends(get_db),
    _: CommunityPrincipal = Depends(require_super_admin),
):
    tenant = db.get(
        MarketplaceTenant,
        tenant_id,
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Marketplace tenant not found",
        )

    existing = (
        db.query(Seller)
        .filter(
            Seller.seller_code == data.seller_code
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Seller code already exists",
        )

    seller = Seller(
        tenant_id=tenant.id,
        community_user_id=data.community_user_id,
        seller_code=data.seller_code,
        shop_name=data.shop_name,
        description=data.description,
        commission_rate=data.commission_rate,
    )

    db.add(seller)
    db.commit()
    db.refresh(seller)

    return seller


@router.post(
    "/tenants/{tenant_id}/buyers",
    response_model=BuyerResponse,
)
def create_buyer(
    tenant_id: int,
    data: BuyerCreate,
    db: Session = Depends(get_db),
    _: CommunityPrincipal = Depends(require_super_admin),
):
    tenant = db.get(
        MarketplaceTenant,
        tenant_id,
    )

    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Marketplace tenant not found",
        )

    existing = (
        db.query(Buyer)
        .filter(
            Buyer.buyer_code == data.buyer_code
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Buyer code already exists",
        )

    buyer = Buyer(
        tenant_id=tenant.id,
        community_user_id=data.community_user_id,
        buyer_code=data.buyer_code,
        display_name=data.display_name,
    )

    db.add(buyer)
    db.commit()
    db.refresh(buyer)

    return buyer