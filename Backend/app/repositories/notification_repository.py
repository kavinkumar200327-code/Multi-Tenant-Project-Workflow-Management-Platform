from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        notification_id: int,
    ) -> Notification | None:

        return db.get(
            Notification,
            notification_id,
        )

    @staticmethod
    def get_by_user(
        db: Session,
        user_id: int,
        unread_only: bool = False,
    ) -> list[Notification]:

        statement = select(Notification).where(
            Notification.user_id == user_id
        )

        if unread_only:
            statement = statement.where(
                Notification.is_read.is_(False)
            )

        statement = statement.order_by(
            Notification.created_at.desc()
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def create(
        db: Session,
        notification: Notification,
    ) -> Notification:

        db.add(notification)
        db.flush()

        return notification

    @staticmethod
    def update(
        db: Session,
        notification: Notification,
    ) -> Notification:

        db.add(notification)
        db.flush()

        return notification

    @staticmethod
    def delete(
        db: Session,
        notification: Notification,
    ) -> None:

        db.delete(notification)
        db.flush()