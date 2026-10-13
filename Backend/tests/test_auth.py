def test_register_user(client, user_payload):
    response = client.post(
        "/api/v1/auth/register",
        json=user_payload,
    )

    assert response.status_code in [200, 201]

    data = response.json()

    assert data["email"] == user_payload["email"]


def test_register_duplicate_user(client, user_payload):
    first_response = client.post(
        "/api/v1/auth/register",
        json=user_payload,
    )

    assert first_response.status_code in [200, 201]

    second_response = client.post(
        "/api/v1/auth/register",
        json=user_payload,
    )

    assert second_response.status_code in [400, 409]


def test_login_user(client, user_payload):
    register_response = client.post(
        "/api/v1/auth/register",
        json=user_payload,
    )

    assert register_response.status_code in [200, 201]

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user_payload["email"],
            "password": user_payload["password"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client, user_payload):
    register_response = client.post(
        "/api/v1/auth/register",
        json=user_payload,
    )

    assert register_response.status_code in [200, 201]

    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": user_payload["email"],
            "password": "WrongPassword@123",
        },
    )

    assert response.status_code in [401, 400]


def test_protected_endpoint_without_token(client):
    response = client.get(
        "/api/v1/users/me",
    )

    assert response.status_code == 401