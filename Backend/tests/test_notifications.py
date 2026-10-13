def test_notifications_require_authentication(client):
    response = client.get(
        "/api/v1/notifications/",
    )

    assert response.status_code == 401


def test_mark_notification_as_read_requires_authentication(client):
    response = client.patch(
        "/api/v1/notifications/1/read",
    )

    assert response.status_code == 401


def test_delete_notification_requires_authentication(client):
    response = client.delete(
        "/api/v1/notifications/1",
    )

    assert response.status_code == 401