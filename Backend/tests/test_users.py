def test_get_current_user_without_authentication(client):
    response = client.get(
        "/api/v1/users/me",
    )

    assert response.status_code == 401


def test_get_current_user(client, user_payload):
    register_response = client.post(
        "/api/v1/auth/register",
        json=user_payload,
    )

    assert register_response.status_code in [200, 201]

    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user_payload["email"],
            "password": user_payload["password"],
        },
    )

    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    response = client.get(
        "/api/v1/users/me",
        headers={
            "Authorization": f"Bearer {token}",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["email"] == user_payload["email"]