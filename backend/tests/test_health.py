from starlette.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint_basic():
    """Verify that GET /api/health returns basic healthy status without false claims."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Meetora API"
    assert data["version"] == "0.1.0"
    # Ensure database is not reported as healthy without check_db=True
    assert "database" not in data


def test_health_endpoint_with_db_check():
    """Verify that GET /api/health?check_db=true reports actual database status."""
    response = client.get("/api/health?check_db=true")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "connected" in data["database"]
    assert "status" in data["database"]


def test_root_endpoint():
    """Verify that root endpoint / returns welcome message and docs links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data
