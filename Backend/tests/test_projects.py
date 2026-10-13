def test_projects_require_authentication(client):
    response = client.get(
        "/api/v1/projects/",
    )

    assert response.status_code == 401


def test_create_project_requires_authentication(
    client,
    project_payload,
):
    response = client.post(
        "/api/v1/projects/",
        json=project_payload,
    )

    assert response.status_code == 401


def test_get_project_by_id_requires_authentication(client):
    response = client.get(
        "/api/v1/projects/1",
    )

    assert response.status_code == 401