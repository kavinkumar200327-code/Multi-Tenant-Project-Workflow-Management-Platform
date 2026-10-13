from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.notification import Notification


class NotificationService:

    @staticmethod
    def get_notification_by_id(
        db: Session,
        notification_id: int,
        user_id: int,
    ) -> Notification | None:
        """Added: look up notification by ID, scoped to user for security."""
        notification = db.get(Notification, notification_id)

        if notification and notification.user_id == user_id:
            return notification

        return None

    @staticmethod
    def create_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "general",
        organization_id: int | None = None,
    ) -> Notification:

        notification = Notification(
            user_id=user_id,
            organization_id=organization_id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False,
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    def get_user_notifications(
        db: Session,
        user_id: int,
        organization_id: int | None = None,
        unread_only: bool = False,
    ) -> list[Notification]:

        statement = select(Notification).where(
            Notification.user_id == user_id
        )

        if organization_id is not None:
            statement = statement.where(
                Notification.organization_id == organization_id
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
    def mark_as_read(
        db: Session,
        notification: Notification,
    ) -> Notification:
        """Fixed: accepts notification object; use get_notification_by_id first."""
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(notification)

        return notification

    @staticmethod
    def mark_all_as_read(
        db: Session,
        user_id: int,
        organization_id: int | None = None,
    ) -> int:
        """Mark all notifications for a user as read, optionally scoped to an organization."""
        statement = select(Notification).where(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        )

        if organization_id is not None:
            statement = statement.where(
                Notification.organization_id == organization_id
            )

        notifications = db.scalars(statement).all()

        now = datetime.now(timezone.utc)
        for n in notifications:
            n.is_read = True
            n.read_at = now

        db.commit()
        return len(notifications)