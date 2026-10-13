from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.task_dependency import TaskDependency
from app.schemas.task import TaskCreate, TaskUpdate


class TaskService:

    @staticmethod
    def get_task_by_id(
        db: Session,
        task_id: int,
    ) -> Task | None:

        return db.get(Task, task_id)

    @staticmethod
    def get_tasks_by_project(
        db: Session,
        project_id: int,
        offset: int = 0,
        limit: int = 20,
        search: str | None = None,
        status: str | None = None,
        priority: str | None = None,
        assigned_to_id: int | None = None,
    ) -> list[Task]:
        """Fixed: now supports offset/limit pagination and search."""
        statement = select(Task).where(
            Task.project_id == project_id
        )

        if search:
            pattern = f"%{search}%"
            statement = statement.where(
                or_(
                    Task.title.ilike(pattern),
                    Task.description.ilike(pattern),
                )
            )

        if status:
            statement = statement.where(Task.status == status)

        if priority:
            statement = statement.where(Task.priority == priority)

        if assigned_to_id:
            statement = statement.where(
                Task.assigned_to_id == assigned_to_id
            )

        statement = (
            statement
            .order_by(Task.created_at.desc())
            .offset(offset)
            .limit(limit)
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def create_task(
        db: Session,
        task_data: TaskCreate,
        created_by_id: int,  # Fixed: renamed from user_id to match usage
    ) -> Task:

        task = Task(
            project_id=task_data.project_id,
            created_by_id=created_by_id,
            assigned_to_id=task_data.assigned_to_id,
            title=task_data.title,
            description=task_data.description,
            status=task_data.status,
            priority=task_data.priority,
            due_date=task_data.due_date,
        )

        db.add(task)
        db.commit()
        db.refresh(task)

        # Send notification if task is assigned
        from app.models.project import Project
        from app.services.notification_service import NotificationService
        if task.assigned_to_id:
            project = db.get(Project, task.project_id)
            org_id = project.organization_id if project else None
            NotificationService.create_notification(
                db=db,
                user_id=task.assigned_to_id,
                title="New Task Assigned",
                message=f"You have been assigned to task '{task.title}'.",
                notification_type="task_assigned",
                organization_id=org_id,
            )

        return task

    @staticmethod
    def update_task(
        db: Session,
        task: Task,
        task_data: TaskUpdate,
    ) -> Task:

        old_status = task.status
        old_assigned_to = task.assigned_to_id

        update_data = task_data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(task, field, value)

        db.commit()
        db.refresh(task)

        from app.models.project import Project
        from app.services.notification_service import NotificationService

        project = db.get(Project, task.project_id)
        org_id = project.organization_id if project else None

        # Status update notification
        if "status" in update_data and task.status != old_status:
            recipients = set()
            if task.assigned_to_id:
                recipients.add(task.assigned_to_id)
            if task.created_by_id:
                recipients.add(task.created_by_id)

            for r_id in recipients:
                NotificationService.create_notification(
                    db=db,
                    user_id=r_id,
                    title="Task Status Changed",
                    message=f"Task '{task.title}' status changed to {task.status.replace('_', ' ').title()}.",
                    notification_type="task_status_changed",
                    organization_id=org_id,
                )

        # Assignment notification
        if "assigned_to_id" in update_data and task.assigned_to_id and task.assigned_to_id != old_assigned_to:
            NotificationService.create_notification(
                db=db,
                user_id=task.assigned_to_id,
                title="Task Assigned",
                message=f"You have been assigned to task '{task.title}'.",
                notification_type="task_assigned",
                organization_id=org_id,
            )

        return task

    @staticmethod
    def delete_task(
        db: Session,
        task: Task,
    ) -> None:

        db.delete(task)
        db.commit()

    # ----- Task Dependencies -----

    @staticmethod
    def create_dependency(
        db: Session,
        task_id: int,
        depends_on_task_id: int,
    ) -> TaskDependency:
        """Added: create a task dependency with circular-dependency check."""
        if task_id == depends_on_task_id:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A task cannot depend on itself.",
            )

        # Check for existing dependency
        existing = db.scalar(
            select(TaskDependency).where(
                TaskDependency.task_id == task_id,
                TaskDependency.depends_on_task_id == depends_on_task_id,
            )
        )
        if existing:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Task dependency already exists.",
            )

        # Simple circular dependency check (A→B and B→A)
        reverse = db.scalar(
            select(TaskDependency).where(
                TaskDependency.task_id == depends_on_task_id,
                TaskDependency.depends_on_task_id == task_id,
            )
        )
        if reverse:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Adding this dependency would create a circular dependency.",
            )

        dep = TaskDependency(
            task_id=task_id,
            depends_on_task_id=depends_on_task_id,
        )
        db.add(dep)
        db.commit()
        db.refresh(dep)

        return dep

    @staticmethod
    def delete_dependency(
        db: Session,
        dependency_id: int,
    ) -> None:
        """Added: delete a dependency by its own ID."""
        dep = db.get(TaskDependency, dependency_id)
        if dep:
            db.delete(dep)
            db.commit()