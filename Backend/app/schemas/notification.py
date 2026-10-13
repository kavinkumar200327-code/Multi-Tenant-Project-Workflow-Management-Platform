from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    user_id: int
    organization_id: int | None = None

    title: str = Field(
        ...,
        min_length=1,
        max_length=200,
    )

    message: str

    notification_type: str = Field(
        default="general",
        max_length=50,
    )


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    organization_id: int | None = None
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime
    read_at: datetime | None


class NotificationMarkRead(BaseModel):
    is_read: bool = True