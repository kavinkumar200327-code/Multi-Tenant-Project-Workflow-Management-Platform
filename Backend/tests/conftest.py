import uuid
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def user_payload():
    uid = uuid.uuid4().hex[:8]
    return {
        "full_name": f"Test User {uid}",
        "email": f"test_{uid}@example.com",
        "password": "Test@12345",
    }


@pytest.fixture
def second_user_payload():
    uid = uuid.uuid4().hex[:8]
    return {
        "full_name": f"Second User {uid}",
        "email": f"second_{uid}@example.com",
        "password": "Test@12345",
    }


@pytest.fixture
def organization_payload():
    uid = uuid.uuid4().hex[:8]
    return {
        "name": f"Test Org {uid}",
        "slug": f"test-org-{uid}",
    }


@pytest.fixture
def project_payload():
    return {
        "name": "Test Project",
        "description": "Project created during testing.",
    }


@pytest.fixture
def task_payload():
    return {
        "title": "Test Task",
        "description": "Task created during testing.",
        "priority": "medium",
        "status": "todo",
    }