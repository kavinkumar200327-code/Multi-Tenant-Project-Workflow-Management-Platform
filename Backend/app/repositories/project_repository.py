from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project import Project


class ProjectRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        project_id: int,
    ) -> Project | None:

        return db.get(Project, project_id)

    @staticmethod
    def get_by_organization(
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
    def get_by_status(
        db: Session,
        organization_id: int,
        status: str,
    ) -> list[Project]:

        statement = (
            select(Project)
            .where(
                Project.organization_id == organization_id,
                Project.status == status,
            )
            .order_by(Project.created_at.desc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def create(
        db: Session,
        project: Project,
    ) -> Project:

        db.add(project)
        db.flush()

        return project

    @staticmethod
    def update(
        db: Session,
        project: Project,
    ) -> Project:

        db.add(project)
        db.flush()

        return project

    @staticmethod
    def delete(
        db: Session,
        project: Project,
    ) -> None:

        db.delete(project)
        db.flush()