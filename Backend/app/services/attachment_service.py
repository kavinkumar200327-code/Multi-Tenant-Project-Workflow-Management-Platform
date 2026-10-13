from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attachment import Attachment


class AttachmentService:

    @staticmethod
    def create_attachment(
        db: Session,
        task_id: int,
        uploaded_by_id: int,
        file_name: str,
        file_path: str,
        file_type: str | None = None,
        file_size: int | None = None,
    ) -> Attachment:

        attachment = Attachment(
            task_id=task_id,
            uploaded_by_id=uploaded_by_id,
            file_name=file_name,
            file_path=file_path,
            file_type=file_type,
            file_size=file_size,
        )

        db.add(attachment)
        db.commit()
        db.refresh(attachment)

        return attachment

    @staticmethod
    def get_task_attachments(
        db: Session,
        task_id: int,
    ) -> list[Attachment]:

        statement = (
            select(Attachment)
            .where(
                Attachment.task_id == task_id
            )
            .order_by(Attachment.created_at.desc())
        )

        return list(db.scalars(statement).all())

    @staticmethod
    def delete_attachment(
        db: Session,
        attachment: Attachment,
    ) -> None:

        db.delete(attachment)
        db.commit()