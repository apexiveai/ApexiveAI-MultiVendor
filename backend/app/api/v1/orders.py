from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.models.marketplace import MarketplaceTenant
from app.core.security import (
    CommunityPrincipal,
    require_buyer,
)
from app.db.session import get_db
from app.models.marketplace import (
    Buyer,
    Product,
    Order,
    OrderItem,
)
from app.schemas.marketplace import (
    OrderCreate,
    OrderResponse,
)


router = APIRouter(
    prefix="/buyer/orders",
    tags=["Buyer Orders"],
)


def get_buyer(
    principal: CommunityPrincipal,
    db: Session,
) -> Buyer:
    if principal.tenant_id is None:
        raise HTTPException(403, "Buyer account must belong to an active company")

    buyer = (
        db.query(Buyer)
        .join(MarketplaceTenant, Buyer.tenant_id == MarketplaceTenant.id)
        .filter(
            Buyer.community_user_id
            == principal.user_id,
            Buyer.active.is_(True),
            MarketplaceTenant.community_tenant_id == principal.tenant_id,
            MarketplaceTenant.active.is_(True),
        )
        .first()
    )

    if not buyer:
        raise HTTPException(
            status_code=404,
            detail="Marketplace buyer profile not found",
        )

    return buyer


@router.post(
    "",
    response_model=OrderResponse,
)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    principal: CommunityPrincipal = Depends(
        require_buyer
    ),
):
    buyer = get_buyer(
        principal,
        db,
    )

    if not data.items:
        raise HTTPException(
            status_code=400,
            detail="Order must contain at least one item",
        )

    products = []

    for item in data.items:
        product = db.get(
            Product,
            item.product_id,
        )

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found",
            )

        if not product.active or not product.approved:
            raise HTTPException(
                status_code=400,
                detail=f"Product {item.product_id} is unavailable",
            )

        if product.tenant_id != buyer.tenant_id:
            raise HTTPException(
                status_code=403,
                detail="Product is not available to this buyer account.",
            )

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}",
            )

        products.append(
            (
                item,
                product,
            )
        )

    tenant_ids = {
        product.tenant_id
        for _, product in products
    }

    if len(tenant_ids) != 1:
        raise HTTPException(
            status_code=400,
            detail="All items in an order must belong to the same marketplace tenant",
        )

    tenant_id = tenant_ids.pop()

    subtotal = Decimal("0")
    commission_total = Decimal("0")

    order = Order(
        tenant_id=tenant_id,
        buyer_id=buyer.id,
        order_number=(
            "AXM-"
            + uuid4().hex[:12].upper()
        ),
        status="PENDING",
        currency="MMK",
    )

    db.add(order)
    db.flush()

    for item, product in products:

        line_total = (
            product.price
            * item.quantity
        )

        commission_rate = (
            product.seller.commission_rate
            if product.seller
            else Decimal("10.00")
        )

        commission_amount = (
            line_total
            * commission_rate
            / Decimal("100")
        )

        seller_amount = (
            line_total
            - commission_amount
        )

        subtotal += line_total
        commission_total += commission_amount

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            seller_id=product.seller_id,
            quantity=item.quantity,
            unit_price=product.price,
            commission_rate=commission_rate,
            commission_amount=commission_amount,
            seller_amount=seller_amount,
        )

        db.add(order_item)

        product.stock_quantity -= item.quantity

    order.subtotal = subtotal
    order.commission_amount = commission_total
    order.total_amount = subtotal

    db.commit()
    db.refresh(order)

    return order