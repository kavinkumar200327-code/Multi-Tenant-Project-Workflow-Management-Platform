def test_project_cannot_be_accessed_across_tenants(client):

    response = client.get(
        "/api/v1/projects/999999",
    )

    assert response.status_code == 401


def test_task_cannot_be_accessed_across_tenants(client):

    response = client.get(
        "/api/v1/tasks/999999",
    )

    assert response.status_code == 401


def test_project_list_is_tenant_scoped(client):

    response = client.get(
        "/api/v1/projects/",
    )

    assert response.status_code == 401


def test_task_list_is_tenant_scoped(client):

    response = client.get(
        "/api/v1/tasks/",
    )

    assert response.status_code == 401