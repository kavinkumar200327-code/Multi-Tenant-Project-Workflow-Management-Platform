from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    health,
    organizations,
    dashboard,
    projects,
    tasks,
    users,
    comments,
    attachments,
    notifications,
)

api_router = APIRouter()

api_router.include_router(
    health.router,
    tags = ["Health"],
)

api_router.include_router(
    auth.router,
    prefix = "/auth",
    tags = ["Authentication"],
)

api_router.include_router(
    organizations.router,
    prefix = "/organization",
    tags = ["Organization"],
)

api_router.include_router(
    organizations.router,
    prefix = "/organizations",
    tags = ["Organization"],
    include_in_schema = False,
)

api_router.include_router(users.router)
api_router.include_router(projects.router)
api_router.include_router(tasks.router)
api_router.include_router(comments.router)
api_router.include_router(attachments.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)