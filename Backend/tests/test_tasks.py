def test_tasks_require_authentication(client):
    response = client.get(
        "/api/v1/tasks/",
    )

    assert response.status_code == 401


def test_create_task_requires_authentication(
    client,
    task_payload,
):
    response = client.post(
        "/api/v1/tasks/",
        json=task_payload,
    )

    assert response.status_code == 401


def test_get_task_requires_authentication(client):
    response = client.get(
        "/api/v1/tasks/1",
    )

    assert response.status_code == 401


def test_update_task_requires_authentication(
    client,
    task_payload,
):
    response = client.put(
        "/api/v1/tasks/1",
        json=task_payload,
    )

    assert response.status_code == 401