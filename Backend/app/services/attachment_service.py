import os
import shutil
import uuid
from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.attachment import Attachment
from app.models.user import User

UPLOAD_DIR = Path("uploads/attachments")


class AttachmentService:

    @staticmethod
    def get_attachment_by_id(
        db: Session,
        attachment_id: int,
    ) -> Attachment | None:
        return db.get(Attachment, attachment_id)

    @staticmethod
    def create_attachment(
        db: Session,
        task_id: int,
        uploaded_by_id: int | None = None,
        file_name: str | None = None,
        file_path: str | None = None,
        file_type: str | None = None,
        file_size: int | None = None,
        user: User | None = None,
        filename: str | None = None,
        content_type: str | None = None,
        file: any = None,
    ) -> Attachment:
        actual_user_id = uploaded_by_id if uploaded_by_id is not None else (user.id if user else None)
        actual_name = file_name or filename or (file.filename if hasattr(file, "filename") else "uploaded_file")
        actual_type = file_type or content_type or (file.content_type if hasattr(file, "content_type") else None)

        if file and hasattr(file, "file"):
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            safe_name = f"{uuid.uuid4().hex}_{actual_name}"
            disk_path = UPLOAD_DIR / safe_name
            with open(disk_path, "wb") as f_out:
                shutil.copyfileobj(file.file, f_out)
            actual_path = str(disk_path.as_posix())
            actual_size = disk_path.stat().st_size
        else:
            actual_path = file_path or ""
            actual_size = file_size

        attachment = Attachment(
            task_id=task_id,
            uploaded_by_id=actual_user_id,
            file_name=actual_name,
            file_path=actual_path,
            file_type=actual_type,
            file_size=actual_size,
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
        if attachment.file_path and os.path.exists(attachment.file_path):
            try:
                os.remove(attachment.file_path)
            except OSError:
                pass

        db.delete(attachment)
        db.commit()