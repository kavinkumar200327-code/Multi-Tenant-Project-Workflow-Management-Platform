from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

if TYPE_CHECKING:
    from app.models.organization_member import OrganizationMember
    from app.models.project import Project
    from app.models.audit_log import AuditLog

class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(
        primary_key = True,
        index = True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        nullable = False,
    )

    slug: Mapped[str] = mapped_column(
        String(100),
        unique = True,
        index = True,
        nullable = False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone = True),
        default = lambda: datetime.now(timezone.utc),
        nullable = False,
    )

    members: Mapped[list["OrganizationMember"]] = relationship(
        "OrganizationMember",
        back_populates = "organization",
        cascade = "all, delete-orphan",
    )

    projects: Mapped[list["Project"]] = relationship(
        "Project",
        back_populates = "organization",
        cascade = "all, delete-orphan",
    )

    audit_logs: Mapped[list["AuditLog"]] = relationship(
        "AuditLog",
        back_populates = "organization",
        cascade = "all, delete-orphan",
    )
