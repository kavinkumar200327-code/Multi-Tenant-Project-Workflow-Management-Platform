from fastapi import Query
from pydantic import BaseModel, Field


class PaginationParams(BaseModel):

    page: int = Field(
        default=1,
        ge=1,
        description="Page number",
    )

    page_size: int = Field(
        default=20,
        ge=1,
        le=100,
        description="Number of records per page",
    )

    @property
    def offset(self) -> int:

        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:

        return self.page_size


def get_pagination(
    page: int = Query(
        default=1,
        ge=1,
        description="Page number",
    ),
    page_size: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Number of records per page",
    ),
) -> PaginationParams:

    return PaginationParams(
        page=page,
        page_size=page_size,
    )