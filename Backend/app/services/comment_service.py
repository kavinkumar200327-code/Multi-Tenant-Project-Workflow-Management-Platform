from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate


class CommentService:

    @staticmethod
    def get_comment_by_id(
        db: Session,
        comment_id: int,
    ) -> Comment | None:
        """Added: was missing; routes use this to look up comments."""
        return db.get(Comment, comment_id)

    @staticmethod
    def create_comment(
        db: Session,
        comment_data: CommentCreate,
        user_id: int,
    ) -> Comment:
        """Fixed: now accepts CommentCreate schema (with task_id) instead of positional args."""
        comment = Comment(
            task_id=comment_data.task_id,
            user_id=user_id,
            content=comment_data.content,
        )

        db.add(comment)
        db.commit()
        db.refresh(comment)

        # Send notification to task assignee and creator
        from app.models.project import Project
        from app.models.task import Task
        from app.services.notification_service import NotificationService
        task = db.get(Task, comment.task_id)
        if task:
            project = db.get(Project, task.project_id)
            org_id = project.organization_id if project else None

            users_to_notify = set()
            if task.assigned_to_id and task.assigned_to_id != user_id:
                users_to_notify.add(task.assigned_to_id)
            if task.created_by_id and task.created_by_id != user_id:
                users_to_notify.add(task.created_by_id)

            for u_id in users_to_notify:
                NotificationService.create_notification(
                    db=db,
                    user_id=u_id,
                    title="New Comment on Task",
                    message=f"A new comment was posted on task '{task.title}'.",
                    notification_type="comment_added",
                    organization_id=org_id,
                )

        return comment

    @staticmethod
    def get_task_comments(
        db: Session,
        task_id: int,
    ) -> list[Comment]:

        statement = (
            select(Comment)
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at.asc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def update_comment(
        db: Session,
        comment: Comment,
        comment_data: CommentUpdate,
    ) -> Comment:
        """Fixed: now accepts CommentUpdate schema instead of raw `content: str`."""
        comment.content = comment_data.content

        db.commit()
        db.refresh(comment)

        return comment

    @staticmethod
    def delete_comment(
        db: Session,
        comment: Comment,
    ) -> None:

        db.delete(comment)
        db.commit()