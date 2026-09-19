from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import uuid

from app.main import app
from app.core.database import Base, get_db
from app.models.event import Event

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_events.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

EVENT1_ID = uuid.uuid4()
EVENT2_ID = uuid.uuid4()

def setup_module():
    db = TestingSessionLocal()
    db.query(Event).delete()
    now = datetime.utcnow()
    events = [
        Event(
            id=EVENT1_ID,
            title="FastAPI & React Workshop",
            description="Build modern full-stack web applications with FastAPI and React.",
            category="Workshops",
            start_time=now + timedelta(days=2),
            end_time=now + timedelta(days=2, hours=3),
            location="CS Lab 101",
            is_online=True,
            capacity=50,
            registered_count=20,
            host_name="ACM Student Chapter",
            host_logo_text="ACM",
            status="Registration open"
        ),
        Event(
            id=EVENT2_ID,
            title="Design Systems with Tailwind CSS",
            description="Learn how to architect reusable UI components.",
            category="Design & UX",
            start_time=now + timedelta(days=5),
            end_time=now + timedelta(days=5, hours=2),
            location="Design Studio",
            is_online=False,
            capacity=30,
            registered_count=30,
            host_name="Campus UX Collective",
            host_logo_text="UX",
            status="Full"
        ),
    ]
    db.add_all(events)
    db.commit()
    db.close()



def test_list_events_api_prefix():
    """Verify GET /api/events and /api/events/ both return 200 without 404."""
    resp1 = client.get("/api/events")
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert len(data1) == 2

    resp2 = client.get("/api/events/")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert len(data2) == 2


def test_list_events_v1_alias():
    """Verify GET /api/v1/events works as an alias."""
    resp = client.get("/api/v1/events")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2


def test_filter_events_by_search():
    """Verify search filter on title/description."""
    resp = client.get("/api/events?search=Tailwind")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "Design Systems with Tailwind CSS"


def test_filter_events_by_category():
    """Verify category filter."""
    resp = client.get("/api/events?category=Workshops")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["category"] == "Workshops"


def test_get_single_event():
    """Verify GET /api/events/{id} returns single event details."""
    resp = client.get(f"/api/events/{EVENT1_ID}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "FastAPI & React Workshop"
    assert data["capacity"] == 50



def test_get_event_not_found():
    """Verify GET /api/events/{id} returns 404 for non-existent event."""
    random_id = str(uuid.uuid4())
    resp = client.get(f"/api/events/{random_id}")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Event not found"


def test_registration_flow_and_rules():
    """Verify registration, duplicate prevention, waitlist on full capacity, and cancellation."""
    from app.core import security
    from app.models.user import User

    db = TestingSessionLocal()
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email=f"reg_user_{user_id.hex[:6]}@example.com",
        full_name="Registration Tester",
        hashed_password=security.get_password_hash("password123"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.close()

    token = security.create_access_token(user_id)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Successful registration (confirmed)
    resp = client.post(f"/api/events/{EVENT1_ID}/register", headers=headers)
    assert resp.status_code == 201
    reg_data = resp.json()
    assert reg_data["status"] == "confirmed"
    assert "ticket_code" in reg_data
    assert reg_data["ticket_code"].startswith("TKT-")

    # Check event count incremented
    event_resp = client.get(f"/api/events/{EVENT1_ID}")
    assert event_resp.json()["registered_count"] == 21

    # 2. Cannot register twice (duplicate prevention)
    dup_resp = client.post(f"/api/events/{EVENT1_ID}/register", headers=headers)
    assert dup_resp.status_code == 400
    assert "already registered" in dup_resp.json()["detail"].lower()

    # 3. Check registration status endpoint
    check_resp = client.get(f"/api/events/{EVENT1_ID}/registration", headers=headers)
    assert check_resp.status_code == 200
    assert check_resp.json()["id"] == reg_data["id"]

    # 4. Waitlist on full event (EVENT2 is 30/30)
    wl_resp = client.post(f"/api/events/{EVENT2_ID}/register", headers=headers)
    assert wl_resp.status_code == 201
    assert wl_resp.json()["status"] == "waitlist"
    assert wl_resp.json()["ticket_code"].startswith("WL-")

    # 5. Get user registrations
    my_regs_resp = client.get("/api/registrations/me", headers=headers)
    assert my_regs_resp.status_code == 200
    my_regs = my_regs_resp.json()
    assert len(my_regs) == 2

    # Also test via /api/events/registrations/me
    my_events_regs_resp = client.get("/api/events/registrations/me", headers=headers)
    assert my_events_regs_resp.status_code == 200
    assert len(my_events_regs_resp.json()) == 2

    # 6. Cancel registration
    cancel_resp = client.post(f"/api/events/{EVENT1_ID}/cancel", headers=headers)
    assert cancel_resp.status_code == 200

    # Verify registration is removed
    check_after_cancel = client.get(f"/api/events/{EVENT1_ID}/registration", headers=headers)
    assert check_after_cancel.status_code == 404

    # Verify event count decremented back to 20
    event_after_cancel = client.get(f"/api/events/{EVENT1_ID}")
    assert event_after_cancel.json()["registered_count"] == 20

