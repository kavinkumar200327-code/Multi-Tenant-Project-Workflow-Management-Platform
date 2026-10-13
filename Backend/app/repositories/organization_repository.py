from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import OrganizationRole

from app.models.organization import Organization
from app.models.organization_member import OrganizationMember

def get_by_id(
        db: Session,
        organization_id: int,
) -> Organization | None:

    return db.get(
        Organization,
        organization_id
    )

def get_by_slug(
        db: Session,
        slug: str,
) -> Organization | None:

    return db.scalar(
        select(Organization).where(
            Organization.slug == slug
        )
    )

def get_membership(
        db: Session,
        organization_id: int,
        user_id: int,
) -> OrganizationMember | None:

    return db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
    )

def create(
        db: Session,
        *,
        name: str,
        slug: str,
        owner_user_id: int,
) -> Organization:

    organization = Organization(
        name = name,
        slug = slug,
    )

    db.add(organization)
    db.flush()

    membership = OrganizationMember(
        organization_id = organization.id,
        user_id = owner_user_id,
        role = OrganizationRole.OWNER,
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return organization

def get_user_organizations(
        db: Session,
        user_id: int,
) -> list[Organization]:

    results = db.execute(
        select(Organization, OrganizationMember.role)
        .join(
            OrganizationMember,
            OrganizationMember.organization_id == Organization.id,
        )
        .where(
            OrganizationMember.user_id == user_id,
        )
        .order_by(Organization.created_at.asc())
    ).all()

    orgs = []
    for org, role in results:
        setattr(org, "role", role)
        orgs.append(org)

    return orgs