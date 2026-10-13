def test_workflow_requires_authentication(client):
    response = client.patch(
        "/api/v1/tasks/1/status",
        json={
            "status": "in_progress",
        },
    )

    assert response.status_code == 401


def test_task_assignment_requires_authentication(client):
    response = client.patch(
        "/api/v1/tasks/1/assign",
        json={
            "assigned_to_id": 1,
        },
    )

    assert response.status_code == 401


def test_task_dependency_requires_authentication(client):
    response = client.post(
        "/api/v1/tasks/1/dependencies",
        json={
            "depends_on_task_id": 2,
        },
    )

    assert response.status_code == 401