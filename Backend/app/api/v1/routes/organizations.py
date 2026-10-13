from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import OrganizationRole
from app.core.exceptions import forbidden, not_found
from app.db.session import get_db
from app.dependencies.auth import get_current_user
from app.dependencies.permissions import get_user_org_membership
from app.dependencies.tenant import (
    get_current_organization_membership,
)
from app.models.organization import Organization
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.repositories.organization_repository import (
    create,
    get_by_slug,
    get_user_organizations,
)
from app.services.notification_service import NotificationService
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationMemberDetailResponse,
    OrganizationMemberResponse,
    OrganizationResponse,
    UpdateMemberRoleRequest,
)

router = APIRouter()


@router.get(
    "",
    response_model=list[OrganizationResponse],
)
@router.get(
    "/",
    response_model=list[OrganizationResponse],
    include_in_schema=False,
)
def get_my_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_organizations(
        db,
        user_id=current_user.id,
    )


@router.post(
    "",
    response_model=OrganizationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_organization(
    payload: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if get_by_slug(
        db,
        payload.slug,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug is already in use",
        )

    org = create(
        db,
        name=payload.name,
        slug=payload.slug,
        owner_user_id=current_user.id,
    )
    setattr(org, "role", OrganizationRole.OWNER)

    # Create notification for owner
    NotificationService.create_notification(
        db=db,
        user_id=current_user.id,
        title="Organization Created",
        message=f"You successfully created the organization '{org.name}'. You are assigned as the Owner.",
        notification_type="organization_created",
        organization_id=org.id,
    )

    return org


@router.get(
    "/{organization_id}/membership",
    response_model=OrganizationMemberResponse,
)
def get_my_membership(
    membership=Depends(get_current_organization_membership),
):
    return membership


@router.get(
    "/{organization_id}/members",
    response_model=list[OrganizationMemberDetailResponse],
)
def get_organization_members(
    organization_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify active membership
    get_user_org_membership(db, current_user.id, organization_id)

    results = db.execute(
        select(OrganizationMember, User.full_name, User.email)
        .join(User, User.id == OrganizationMember.user_id)
        .where(OrganizationMember.organization_id == organization_id)
        .order_by(OrganizationMember.id.asc())
    ).all()

    members = []
    for member, full_name, email in results:
        members.append(
            OrganizationMemberDetailResponse(
                id=member.id,
                organization_id=member.organization_id,
                user_id=member.user_id,
                role=member.role,
                status=member.status,
                user_full_name=full_name,
                user_email=email,
            )
        )
    return members


@router.put(
    "/{organization_id}/members/{user_id}/role",
    response_model=OrganizationMemberDetailResponse,
)
def update_member_role(
    organization_id: int,
    user_id: int,
    payload: UpdateMemberRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Only Owner or Admin can change member roles
    actor_membership = get_user_org_membership(db, current_user.id, organization_id)
    if actor_membership.role not in {OrganizationRole.OWNER, OrganizationRole.ADMIN}:
        raise forbidden("Only Organization Owners and Admins can update member roles.")

    target_membership = db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
    )
    if not target_membership:
        raise not_found("Member not found in organization")

    # Admins cannot change the Owner's role
    if target_membership.role == OrganizationRole.OWNER and actor_membership.role != OrganizationRole.OWNER:
        raise forbidden("Only the Organization Owner can modify ownership.")

    target_membership.role = payload.role
    db.commit()
    db.refresh(target_membership)

    org = db.get(Organization, organization_id)
    org_name = org.name if org else "the organization"
    NotificationService.create_notification(
        db=db,
        user_id=user_id,
        title="Organization Role Updated",
        message=f"Your role in '{org_name}' has been updated to {payload.role.replace('_', ' ').title()}.",
        notification_type="system",
        organization_id=organization_id,
    )

    user = db.get(User, user_id)
    return OrganizationMemberDetailResponse(
        id=target_membership.id,
        organization_id=target_membership.organization_id,
        user_id=target_membership.user_id,
        role=target_membership.role,
        status=target_membership.status,
        user_full_name=user.full_name if user else None,
        user_email=user.email if user else None,
    )