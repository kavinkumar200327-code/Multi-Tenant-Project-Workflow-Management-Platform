def test_get_task_comments_requires_authentication(client):
    response = client.get(
        "/api/v1/comments/task/1",
    )

    assert response.status_code == 401


def test_create_comment_requires_authentication(client):
    response = client.post(
        "/api/v1/comments/",
        json={
            "task_id": 1,
            "content": "This is a test comment.",
        },
    )

    assert response.status_code == 401


def test_update_comment_requires_authentication(client):
    response = client.put(
        "/api/v1/comments/1",
        json={
            "content": "Updated comment.",
        },
    )

    assert response.status_code == 401


def test_delete_comment_requires_authentication(client):
    response = client.delete(
        "/api/v1/comments/1",
    )

    assert response.status_code == 401