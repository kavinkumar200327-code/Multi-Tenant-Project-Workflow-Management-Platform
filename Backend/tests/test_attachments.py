def test_get_task_attachments_requires_authentication(client):
    response = client.get(
        "/api/v1/attachments/task/1",
    )

    assert response.status_code == 401


def test_upload_attachment_requires_authentication(client):
    response = client.post(
        "/api/v1/attachments/",
        files={
            "file": (
                "test.txt",
                b"Test attachment content",
                "text/plain",
            )
        },
        data={
            "task_id": "1",
        },
    )

    assert response.status_code == 401


def test_delete_attachment_requires_authentication(client):
    response = client.delete(
        "/api/v1/attachments/1",
    )

    assert response.status_code == 401