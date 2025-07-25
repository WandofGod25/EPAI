import requests
import json

# Base URL for the locally running FastAPI application
BASE_URL = "http://127.0.0.1:8011"

# Headers for the requests
VALID_HEADERS = {
    "X-API-Key": "partner-key-12345",
    "Content-Type": "application/json",
}
INVALID_HEADERS = {
    "X-API-Key": "invalid-key",
    "Content-Type": "application/json",
}

# Sample payload
PAYLOAD = {"event_data": {"user_id": "xyz-789", "value": 123.45}}


def test_health_check():
    """Tests the /health endpoint."""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    print("\n✓ Health check passed")


def test_successful_prediction():
    """Tests a successful prediction with a valid API key."""
    print("\n--- Testing Successful Prediction ---")
    response = requests.post(
        f"{BASE_URL}/predict/simplified",
        headers=VALID_HEADERS,
        data=json.dumps(PAYLOAD),
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert data["insight_type"] == "user_churn_risk"
    assert "confidence" in data
    print("✓ Successful prediction test passed")


def test_unauthorized_prediction():
    """Tests a prediction attempt with an invalid API key."""
    print("\n--- Testing Unauthorized Prediction ---")
    response = requests.post(
        f"{BASE_URL}/predict/simplified",
        headers=INVALID_HEADERS,
        data=json.dumps(PAYLOAD),
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response JSON: {response.json()}")
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid or missing API Key"}
    print("✓ Unauthorized prediction test passed")


if __name__ == "__main__":
    print("--- Running E2E Stub Integration Tests ---")
    test_health_check()
    test_successful_prediction()
    test_unauthorized_prediction()
    print("\n--- All tests completed ---")
