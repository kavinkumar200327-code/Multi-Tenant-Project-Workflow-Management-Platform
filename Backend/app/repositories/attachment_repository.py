from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attachment import Attachment


class AttachmentRepository:

    @staticmethod
    def get_by_id(
        db: Session,
        attachment_id: int,
    ) -> Attachment | None:

        return db.get(Attachment, attachment_id)

    @staticmethod
    def get_by_task(
        db: Session,
        task_id: int,
    ) -> list[Attachment]:

        statement = (
            select(Attachment)
            .where(
                Attachment.task_id == task_id
            )
            .order_by(
                Attachment.created_at.desc()
            )
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def create(
        db: Session,
        attachment: Attachment,
    ) -> Attachment:

        db.add(attachment)
        db.flush()

        return attachment

    @staticmethod
    def delete(
        db: Session,
        attachment: Attachment,
    ) -> None:

        db.delete(attachment)
        db.flush()