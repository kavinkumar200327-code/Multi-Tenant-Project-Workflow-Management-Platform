from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_member import ProjectMember
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
)


class ProjectService:

    @staticmethod
    def get_project_by_id(
        db: Session,
        project_id: int,
    ) -> Project | None:

        return db.get(Project, project_id)

    @staticmethod
    def get_projects_by_organization(
        db: Session,
        organization_id: int,
    ) -> list[Project]:

        statement = (
            select(Project)
            .where(
                Project.organization_id == organization_id
            )
            .order_by(Project.created_at.desc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def create_project(
        db: Session,
        project_data: ProjectCreate,
        owner_id: int,
    ) -> Project:

        project = Project(
            organization_id=project_data.organization_id,
            owner_id=owner_id,
            name=project_data.name,
            description=project_data.description,
            status="active",
        )

        db.add(project)
        db.flush()

        member = ProjectMember(
            project_id=project.id,
            user_id=owner_id,
            role="owner",
            status="active",
        )

        db.add(member)

        db.commit()
        db.refresh(project)

        # Send notifications
        from app.models.organization import Organization
        from app.models.organization_member import OrganizationMember
        from app.core.constants import MembershipStatus
        from app.services.notification_service import NotificationService

        org = db.get(Organization, project.organization_id)
        org_name = org.name if org else "the organization"

        # Notify creator
        NotificationService.create_notification(
            db=db,
            user_id=owner_id,
            title="Project Created",
            message=f"Project '{project.name}' was created successfully in '{org_name}'.",
            notification_type="project_created",
            organization_id=project.organization_id,
        )

        # Notify other active organization members
        other_member_ids = db.scalars(
            select(OrganizationMember.user_id).where(
                OrganizationMember.organization_id == project.organization_id,
                OrganizationMember.user_id != owner_id,
                OrganizationMember.status == MembershipStatus.ACTIVE,
            )
        ).all()

        for member_id in other_member_ids:
            NotificationService.create_notification(
                db=db,
                user_id=member_id,
                title="New Project Created",
                message=f"A new project '{project.name}' was created in '{org_name}'.",
                notification_type="project_created",
                organization_id=project.organization_id,
            )

        return project

    @staticmethod
    def update_project(
        db: Session,
        project: Project,
        project_data: ProjectUpdate,
    ) -> Project:

        update_data = project_data.model_dump(
            exclude_unset=True
        )

        for field, value in update_data.items():
            setattr(project, field, value)

        db.commit()
        db.refresh(project)

        return project

    @staticmethod
    def delete_project(
        db: Session,
        project: Project,
    ) -> None:

        db.delete(project)
        db.commit()