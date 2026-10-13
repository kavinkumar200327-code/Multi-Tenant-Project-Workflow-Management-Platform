from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    task_id: int  # Added: was missing, needed so route knows which task
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class CommentUpdate(BaseModel):
    content: str = Field(
        ...,
        min_length=1,
        max_length=5000,
    )


class CommentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime