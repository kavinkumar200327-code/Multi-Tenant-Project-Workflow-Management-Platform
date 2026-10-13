from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.task import Task


class TaskRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        task_id: int,
    ) -> Task | None:

        return db.get(Task, task_id)

    @staticmethod
    def get_by_project(
        db: Session,
        project_id: int,
    ) -> list[Task]:

        statement = (
            select(Task)
            .where(Task.project_id == project_id)
            .order_by(Task.created_at.desc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def search(
        db: Session,
        project_id: int,
        search: str | None = None,
        status: str | None = None,
        priority: str | None = None,
        assigned_to_id: int | None = None,
    ) -> list[Task]:

        statement = select(Task).where(
            Task.project_id == project_id
        )

        if search:
            search_pattern = f"%{search}%"

            statement = statement.where(
                or_(
                    Task.title.ilike(search_pattern),
                    Task.description.ilike(search_pattern),
                )
            )

        if status:
            statement = statement.where(
                Task.status == status
            )

        if priority:
            statement = statement.where(
                Task.priority == priority
            )

        if assigned_to_id:
            statement = statement.where(
                Task.assigned_to_id == assigned_to_id
            )

        statement = statement.order_by(
            Task.created_at.desc()
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def get_by_assignee(
        db: Session,
        assigned_to_id: int,
    ) -> list[Task]:

        statement = (
            select(Task)
            .where(
                Task.assigned_to_id == assigned_to_id
            )
            .order_by(Task.due_date.asc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def create(
        db: Session,
        task: Task,
    ) -> Task:

        db.add(task)
        db.flush()

        return task

    @staticmethod
    def update(
        db: Session,
        task: Task,
    ) -> Task:

        db.add(task)
        db.flush()

        return task

    @staticmethod
    def delete(
        db: Session,
        task: Task,
    ) -> None:

        db.delete(task)
        db.flush()