def test_unauthenticated_user_cannot_access_protected_resource(
    client,
):
    response = client.get(
        "/api/v1/projects/",
    )

    assert response.status_code == 401


def test_unauthenticated_user_cannot_create_project(
    client,
    project_payload,
):
    response = client.post(
        "/api/v1/projects/",
        json=project_payload,
    )

    assert response.status_code == 401


def test_unauthenticated_user_cannot_create_task(
    client,
    task_payload,
):
    response = client.post(
        "/api/v1/tasks/",
        json=task_payload,
    )

    assert response.status_code == 401


def test_unauthenticated_user_cannot_update_task(
    client,
):
    response = client.put(
        "/api/v1/tasks/1",
        json={
            "title": "Unauthorized Update",
        },
    )

    assert response.status_code == 401


def test_unauthenticated_user_cannot_delete_project(
    client,
):
    response = client.delete(
        "/api/v1/projects/1",
    )

    assert response.status_code == 401