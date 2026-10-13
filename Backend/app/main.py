from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

app = FastAPI(
    title = settings.PROJECT_NAME,
    version = settings.VERSION,
    description = (
        "Multi-Tenant Project & Workflow"
        "Management Platform API"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins = settings.CORS_ORIGINS,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

app.include_router(
    api_router,
    prefix = settings.API_V1_PREFIX,
)

@app.get("/")

def root():

    return {
        "message" : (
            "Multi-Tenant Project & Workflow "
            "Management Platform API"
        ),

        "version" : settings.VERSION,
        "docs" : "/docs",
    }