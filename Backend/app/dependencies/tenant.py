from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.constants import MembershipStatus
from app.db.session import get_db
from app.core.exceptions import forbidden, not_found
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.repositories.organization_repository import (
    get_by_id,
    get_membership,
)


def get_current_organization_membership(
        organization_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
):

    organization = get_by_id(db, organization_id)

    if not organization:
        raise not_found("Organization not found")

    membership = get_membership(
        db,
        organization_id=organization_id,
        user_id=current_user.id,
    )

    if not membership or membership.status != MembershipStatus.ACTIVE:
        raise forbidden(
            "You are not an active member of this organization"
        )

    return membership