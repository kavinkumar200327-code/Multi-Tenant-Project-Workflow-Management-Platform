from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AttachmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    uploaded_by_id: int
    file_name: str
    file_path: str
    file_type: str | None
    file_size: int | None
    created_at: datetime