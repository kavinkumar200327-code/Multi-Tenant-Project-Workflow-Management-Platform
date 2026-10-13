from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import(
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    UniqueConstraint,
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.constants import(
    MembershipStatus,
    OrganizationRole,
)

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.user import User

class OrganizationMember(Base):

    __tablename__ = "organization_members"

    __table_args__ = (UniqueConstraint(
            "organization_id",
            "user_id",
            name = "uq_organization_member",
        ),
    )

    id: Mapped[int] = mapped_column(
        primary_key = True,
        index = True,
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey(
            "organizations.id",
            ondelete = "CASCADE",
        ),
        nullable = False,
        index = True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete = "CASCADE",
        ),
        nullable = False,
        index = True,
    )

    role: Mapped[OrganizationRole] = mapped_column(
        SQLEnum(
            OrganizationRole,
            name = "organization_role",
        ),
        default = OrganizationRole.MEMBER,
        nullable = False,
    )

    status: Mapped[MembershipStatus] = mapped_column(
        SQLEnum(
            MembershipStatus,
            name = "membership_status",
        ),
        default = MembershipStatus.ACTIVE,
        nullable = False,
    )

    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone = True),
        default = lambda: datetime.now(timezone.utc),
        nullable = False,
    )

    organization: Mapped["Organization"] = relationship(
        "Organization",
        back_populates = "members"
    )

    user: Mapped["User"] = relationship(
        "User",
        back_populates = "organization_memberships",
    )
