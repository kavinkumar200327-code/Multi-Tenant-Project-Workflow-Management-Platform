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


def test_unauthenticated_user_cannot_create_organization(
    client,
    organization_payload,
):
    response = client.post(
        "/api/v1/organization/",
        json=organization_payload,
    )
    assert response.status_code == 401


def test_viewer_cannot_create_organization(client):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "viewer@example.com", "password": "Password@123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    res = client.post(
        "/api/v1/organization/",
        json={"name": "Forbidden Org", "slug": "forbidden-org-test"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403
    assert "cannot create new organizations" in res.json()["detail"].lower()


def test_viewer_cannot_create_project(client):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "viewer@example.com", "password": "Password@123"},
    )
    token = login_res.json()["access_token"]

    res = client.post(
        "/api/v1/projects/1",
        json={"name": "Forbidden Project", "organization_id": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403


def test_viewer_cannot_create_task(client):
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "viewer@example.com", "password": "Password@123"},
    )
    token = login_res.json()["access_token"]

    res = client.post(
        "/api/v1/tasks/",
        json={
            "project_id": 1,
            "title": "Forbidden Task",
            "priority": "low",
            "status": "todo",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 403