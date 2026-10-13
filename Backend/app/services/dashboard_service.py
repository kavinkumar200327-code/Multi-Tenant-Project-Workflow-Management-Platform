from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.task import Task


class DashboardService:

    @staticmethod
    def get_project_summary(
        db: Session,
        organization_id: int,
    ) -> dict:

        total_projects = db.scalar(
            select(func.count(Project.id)).where(
                Project.organization_id == organization_id
            )
        ) or 0

        active_projects = db.scalar(
            select(func.count(Project.id)).where(
                Project.organization_id == organization_id,
                Project.status == "active",
            )
        ) or 0

        completed_projects = db.scalar(
            select(func.count(Project.id)).where(
                Project.organization_id == organization_id,
                Project.status == "completed",
            )
        ) or 0

        return {
            "total_projects": total_projects,
            "active_projects": active_projects,
            "completed_projects": completed_projects,
        }

    @staticmethod
    def get_task_summary(
        db: Session,
        organization_id: int,
    ) -> dict:

        total_tasks = db.scalar(
            select(func.count(Task.id))
            .join(Project)
            .where(
                Project.organization_id == organization_id
            )
        ) or 0

        todo_tasks = db.scalar(
            select(func.count(Task.id))
            .join(Project)
            .where(
                Project.organization_id == organization_id,
                Task.status == "todo",
            )
        ) or 0

        in_progress_tasks = db.scalar(
            select(func.count(Task.id))
            .join(Project)
            .where(
                Project.organization_id == organization_id,
                Task.status == "in_progress",
            )
        ) or 0

        completed_tasks = db.scalar(
            select(func.count(Task.id))
            .join(Project)
            .where(
                Project.organization_id == organization_id,
                Task.status == "completed",
            )
        ) or 0

        overdue_tasks = db.scalar(
            select(func.count(Task.id))
            .join(Project)
            .where(
                Project.organization_id == organization_id,
                Task.due_date < datetime.now(timezone.utc),
                Task.status != "completed",
            )
        ) or 0

        return {
            "total_tasks": total_tasks,
            "todo_tasks": todo_tasks,
            "in_progress_tasks": in_progress_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
        }

    @staticmethod
    def get_tasks_by_status(
        db: Session,
        organization_id: int,
    ) -> list[dict]:

        statement = (
            select(
                Task.status,
                func.count(Task.id).label("count"),
            )
            .join(Project)
            .where(
                Project.organization_id == organization_id
            )
            .group_by(Task.status)
        )

        results = db.execute(statement).all()

        return [
            {
                "status": status,
                "count": count,
            }
            for status, count in results
        ]

    @staticmethod
    def get_tasks_by_priority(
        db: Session,
        organization_id: int,
    ) -> list[dict]:

        statement = (
            select(
                Task.priority,
                func.count(Task.id).label("count"),
            )
            .join(Project)
            .where(
                Project.organization_id == organization_id
            )
            .group_by(Task.priority)
        )

        results = db.execute(statement).all()

        return [
            {
                "priority": priority,
                "count": count,
            }
            for priority, count in results
        ]

    @staticmethod
    def get_dashboard(
        db: Session,
        organization_id: int,
    ) -> dict:

        return {
            "project_summary":
                DashboardService.get_project_summary(
                    db,
                    organization_id,
                ),
            "task_summary":
                DashboardService.get_task_summary(
                    db,
                    organization_id,
                ),
            "tasks_by_status":
                DashboardService.get_tasks_by_status(
                    db,
                    organization_id,
                ),
            "tasks_by_priority":
                DashboardService.get_tasks_by_priority(
                    db,
                    organization_id,
                ),
        }