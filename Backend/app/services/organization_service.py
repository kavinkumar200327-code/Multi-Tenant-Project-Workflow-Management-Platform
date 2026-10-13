from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.organization import Organization
from app.models.organization_member import OrganizationMember


class OrganizationService:

    @staticmethod
    def get_organization_by_id(
        db: Session,
        organization_id: int,
    ) -> Organization | None:

        return db.get(
            Organization,
            organization_id,
        )

    @staticmethod
    def get_organization_by_slug(
        db: Session,
        slug: str,
    ) -> Organization | None:

        statement = select(Organization).where(
            Organization.slug == slug
        )

        return db.scalar(statement)

    @staticmethod
    def create_organization(
        db: Session,
        name: str,
        slug: str,
        owner_id: int,
    ) -> Organization:

        organization = Organization(
            name=name,
            slug=slug,
        )

        db.add(organization)
        db.flush()

        member = OrganizationMember(
            organization_id=organization.id,
            user_id=owner_id,
            role="owner",
            status="active",
        )

        db.add(member)

        db.commit()
        db.refresh(organization)

        return organization

    @staticmethod
    def add_member(
        db: Session,
        organization_id: int,
        user_id: int,
        role: str = "member",
    ) -> OrganizationMember:

        member = OrganizationMember(
            organization_id=organization_id,
            user_id=user_id,
            role=role,
            status="active",
        )

        db.add(member)
        db.commit()
        db.refresh(member)

        return member