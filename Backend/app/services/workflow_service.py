from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.task_dependency import TaskDependency


class WorkflowService:

    VALID_STATUSES = {
        "todo",
        "in_progress",
        "review",
        "completed",
        "cancelled",
    }

    VALID_PRIORITIES = {
        "low",
        "medium",
        "high",
        "urgent",
    }

    @staticmethod
    def update_task_status(
        db: Session,
        task: Task,
        new_status: str,
    ) -> Task:

        if new_status not in WorkflowService.VALID_STATUSES:
            raise ValueError(
                f"Invalid task status: {new_status}"
            )

        task.status = new_status

        db.commit()
        db.refresh(task)

        return task

    @staticmethod
    def update_task_priority(
        db: Session,
        task: Task,
        new_priority: str,
    ) -> Task:

        if new_priority not in WorkflowService.VALID_PRIORITIES:
            raise ValueError(
                f"Invalid task priority: {new_priority}"
            )

        task.priority = new_priority

        db.commit()
        db.refresh(task)

        return task

    @staticmethod
    def add_dependency(
        db: Session,
        task_id: int,
        depends_on_task_id: int,
    ) -> TaskDependency:

        if task_id == depends_on_task_id:
            raise ValueError(
                "A task cannot depend on itself"
            )

        existing = db.scalar(
            select(TaskDependency).where(
                TaskDependency.task_id == task_id,
                TaskDependency.depends_on_task_id
                == depends_on_task_id,
            )
        )

        if existing:
            raise ValueError(
                "Task dependency already exists"
            )

        dependency = TaskDependency(
            task_id=task_id,
            depends_on_task_id=depends_on_task_id,
        )

        db.add(dependency)
        db.commit()
        db.refresh(dependency)

        return dependency

    @staticmethod
    def remove_dependency(
        db: Session,
        dependency: TaskDependency,
    ) -> None:

        db.delete(dependency)
        db.commit()