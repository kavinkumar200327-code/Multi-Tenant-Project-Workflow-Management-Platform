from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.comment import Comment


class CommentRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        comment_id: int,
    ) -> Comment | None:

        return db.get(Comment, comment_id)

    @staticmethod
    def get_by_task(
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
    def create(
        db: Session,
        comment: Comment,
    ) -> Comment:

        db.add(comment)
        db.flush()

        return comment

    @staticmethod
    def update(
        db: Session,
        comment: Comment,
    ) -> Comment:

        db.add(comment)
        db.flush()

        return comment

    @staticmethod
    def delete(
        db: Session,
        comment: Comment,
    ) -> None:

        db.delete(comment)
        db.flush()