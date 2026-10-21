from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings


bearer_scheme = HTTPBearer(
    auto_error=False,
)


@dataclass
class CommunityPrincipal:
    user_id: str
    role: str
    tenant_id: str | None
    username: str | None = None


def decode_community_token(token: str) -> CommunityPrincipal:
    try:
        payload = jwt.decode(
            token,
            settings.community_jwt_secret,
            algorithms=[settings.community_jwt_algorithm],
            issuer=settings.community_jwt_issuer,
        )
        if payload.get("type") != "access":
            raise HTTPException(
                status_code=401,
                detail="Invalid Community authentication token",
            )
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Community authentication token",
        ) from exc

    user_id = (
        payload.get("sub")
        or payload.get("user_id")
        or payload.get("id")
    )

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Community token does not contain user identity",
        )

    return CommunityPrincipal(
        user_id=str(user_id),
        role=str(
            payload.get("role")
            or payload.get("user_role")
            or ""
        ).upper(),
        tenant_id=(
            str(payload["tenant_id"])
            if payload.get("tenant_id") is not None
            else None
        ),
        username=payload.get("username"),
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
) -> CommunityPrincipal:
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
        )

    return decode_community_token(credentials.credentials)


def require_super_admin(
    principal: CommunityPrincipal = Depends(get_current_user),
) -> CommunityPrincipal:

    allowed = {
        "SUPERADMIN",
        "SUPER_ADMIN",
    }

    if principal.role not in allowed:
        raise HTTPException(
            status_code=403,
            detail="Super Admin permission required",
        )

    return principal


def require_seller(
    principal: CommunityPrincipal = Depends(get_current_user),
) -> CommunityPrincipal:

    if principal.role != "SELLER":
        raise HTTPException(
            status_code=403,
            detail="Seller permission required",
        )

    return principal


def require_buyer(
    principal: CommunityPrincipal = Depends(get_current_user),
) -> CommunityPrincipal:

    if principal.role != "BUYER":
        raise HTTPException(
            status_code=403,
            detail="Buyer permission required",
        )

    return principal