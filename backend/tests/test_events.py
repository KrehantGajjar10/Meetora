from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import uuid

from app.main import app
from app.core.database import Base, get_db
from app.models.event import Event
from app.models.user import User

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_events.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.drop_all(bind=engine)
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
ORGANIZER_ID = uuid.uuid4()

def setup_module():
    db = TestingSessionLocal()
    db.query(Event).delete()
    db.query(User).delete()
    db.add(
        User(
            id=ORGANIZER_ID,
            email="public-organizer@test.com",
            full_name="Public Test Organizer",
            hashed_password="test-hash",
            is_active=True,
            is_organizer=True,
        )
    )
    db.commit()
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
            organizer_id=ORGANIZER_ID,
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
            organizer_id=ORGANIZER_ID,
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


def test_organizer_endpoints_and_authorization():
    """Verify Organizer Overview, My Events, Create, Edit, Status toggle, and authorization isolation."""
    from app.core import security
    from app.models.user import User

    db = TestingSessionLocal()
    org1_id = uuid.uuid4()
    org2_id = uuid.uuid4()

    org1 = User(
        id=org1_id,
        email=f"org1_{org1_id.hex[:6]}@example.com",
        full_name="Lead Organizer",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
        is_organizer=True,
    )
    org2 = User(
        id=org2_id,
        email=f"org2_{org2_id.hex[:6]}@example.com",
        full_name="Secondary Organizer",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
        is_organizer=True,
    )
    regular_user_id = uuid.uuid4()
    regular_user = User(
        id=regular_user_id,
        email=f"regular_{regular_user_id.hex[:6]}@example.com",
        full_name="Regular Attendee",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
        is_organizer=False,
    )
    db.add_all([org1, org2, regular_user])
    db.commit()
    db.close()

    token1 = security.create_access_token(org1_id)
    token2 = security.create_access_token(org2_id)
    reg_token = security.create_access_token(regular_user_id)
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    reg_headers = {"Authorization": f"Bearer {reg_token}"}

    # 0. Regular attendee attempting organizer overview -> 403 Forbidden
    forbidden_resp = client.get("/api/events/organizer/overview", headers=reg_headers)
    assert forbidden_resp.status_code == 403
    assert "organizer privileges" in forbidden_resp.json()["detail"].lower()

    # 1. Organizer Overview (initial state)
    ov_resp = client.get("/api/events/organizer/overview", headers=headers1)
    assert ov_resp.status_code == 200
    ov_data = ov_resp.json()
    assert "total_events" in ov_data
    assert "published_events" in ov_data
    assert "upcoming_events" in ov_data

    # 2. Organizer 1 creates an event (published)
    now = datetime.utcnow()
    event_payload = {
        "title": "Org 1 Distributed Systems Talk",
        "description": "Deep dive into distributed transactions and replication.",
        "category": "Technology & Engineering",
        "start_time": (now + timedelta(days=10)).isoformat(),
        "end_time": (now + timedelta(days=10, hours=2)).isoformat(),
        "location": "Innovation Hall 101",
        "is_online": False,
        "capacity": 40,
        "host_name": "Org 1 Club",
        "status": "Published"
    }
    create_resp = client.post("/api/events", json=event_payload, headers=headers1)
    assert create_resp.status_code == 201
    created_event = create_resp.json()
    event_id = created_event["id"]
    assert created_event["organizer_id"] == str(org1_id)
    assert created_event["title"] == "Org 1 Distributed Systems Talk"

    # 3. Organizer 1 creates a draft event
    draft_payload = {
        "title": "Org 1 Secret Draft Hackathon",
        "description": "Unpublished draft event.",
        "category": "Hackathons & Competitions",
        "start_time": (now + timedelta(days=15)).isoformat(),
        "end_time": (now + timedelta(days=16)).isoformat(),
        "location": "TBD",
        "is_online": True,
        "capacity": 100,
        "status": "Draft"
    }
    draft_resp = client.post("/api/events", json=draft_payload, headers=headers1)
    assert draft_resp.status_code == 201
    draft_id = draft_resp.json()["id"]

    # 4. Verify public Explore Events does NOT include the draft event
    public_resp = client.get("/api/events")
    assert public_resp.status_code == 200
    public_ids = [e["id"] for e in public_resp.json()]
    assert event_id in public_ids
    assert draft_id not in public_ids

    # 5. Organizer 1 queries My Events with status filter
    my_events_all = client.get("/api/events/organizer/my-events", headers=headers1)
    assert my_events_all.status_code == 200
    all_events = my_events_all.json()
    assert any(e["id"] == event_id for e in all_events)
    assert any(e["id"] == draft_id for e in all_events)

    my_events_drafts = client.get("/api/events/organizer/my-events?status=draft", headers=headers1)
    assert my_events_drafts.status_code == 200
    draft_events = my_events_drafts.json()
    assert any(e["id"] == draft_id for e in draft_events)
    assert not any(e["id"] == event_id for e in draft_events)

    # 6. Organizer 1 updates their own event -> succeeds
    update_payload = {"title": "Org 1 Distributed Systems Masterclass"}
    update_resp = client.put(f"/api/events/{event_id}", json=update_payload, headers=headers1)
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Org 1 Distributed Systems Masterclass"

    # 7. Authorization Isolation: Organizer 2 attempts to edit Organizer 1's event -> 403 Forbidden!
    unauth_edit = client.put(f"/api/events/{event_id}", json={"title": "Hacked Title"}, headers=headers2)
    assert unauth_edit.status_code == 403
    assert "permission" in unauth_edit.json()["detail"].lower()

    # 8. Authorization Isolation: Organizer 2 attempts to toggle status of Organizer 1's event -> 403 Forbidden!
    unauth_status = client.post(f"/api/events/{event_id}/status", json={"status": "Cancelled"}, headers=headers2)
    assert unauth_status.status_code == 403

    # 9. Organizer 1 toggles status of their event to Cancelled -> succeeds
    status_resp = client.post(f"/api/events/{event_id}/status", json={"status": "Cancelled"}, headers=headers1)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "Cancelled"


def test_attendee_management_and_checkin():
    """Verify O04 Attendee Management and O05 Fast Check-in APIs."""
    from app.core import security
    from app.models.user import User

    db = TestingSessionLocal()
    org_id = uuid.uuid4()
    att1_id = uuid.uuid4()
    att2_id = uuid.uuid4()
    att3_id = uuid.uuid4()
    other_org_id = uuid.uuid4()

    org_user = User(
        id=org_id,
        email=f"org_{org_id.hex[:6]}@example.com",
        full_name="Desk Organizer",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
        is_organizer=True,
    )
    other_org = User(
        id=other_org_id,
        email=f"other_{other_org_id.hex[:6]}@example.com",
        full_name="Other Organizer",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
        is_organizer=True,
    )
    att1 = User(
        id=att1_id,
        email=f"att1_{att1_id.hex[:6]}@example.com",
        full_name="Alex Rivera",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
    )
    att2 = User(
        id=att2_id,
        email=f"att2_{att2_id.hex[:6]}@example.com",
        full_name="Maya Lin",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
    )
    att3 = User(
        id=att3_id,
        email=f"att3_{att3_id.hex[:6]}@example.com",
        full_name="Marcus Brody",
        hashed_password=security.get_password_hash("password123"),
        is_active=True,
    )

    db.add_all([org_user, other_org, att1, att2, att3])
    db.commit()
    db.close()

    org_headers = {"Authorization": f"Bearer {security.create_access_token(org_id)}"}
    other_headers = {"Authorization": f"Bearer {security.create_access_token(other_org_id)}"}
    att1_headers = {"Authorization": f"Bearer {security.create_access_token(att1_id)}"}
    att2_headers = {"Authorization": f"Bearer {security.create_access_token(att2_id)}"}
    att3_headers = {"Authorization": f"Bearer {security.create_access_token(att3_id)}"}

    # 1. Organizer creates event with capacity 2
    create_payload = {
        "title": "FastAPI Checkin Summit",
        "description": "Deep dive into checkin workflows",
        "category": "Technology",
        "start_time": (datetime.utcnow() + timedelta(days=2)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(days=2, hours=3)).isoformat(),
        "location": "Auditorium Hall B",
        "capacity": 2,
        "is_online": False,
        "status": "Published",
    }
    ev_resp = client.post("/api/events", json=create_payload, headers=org_headers)
    assert ev_resp.status_code == 201
    event_id = ev_resp.json()["id"]

    # 2. Attendee 1 and Attendee 2 register -> both Confirmed
    reg1 = client.post(f"/api/events/{event_id}/register", headers=att1_headers)
    assert reg1.status_code == 201
    assert reg1.json()["status"] == "confirmed"
    tkt1 = reg1.json()["ticket_code"]
    reg1_id = reg1.json()["id"]

    reg2 = client.post(f"/api/events/{event_id}/register", headers=att2_headers)
    assert reg2.status_code == 201
    assert reg2.json()["status"] == "confirmed"
    tkt2 = reg2.json()["ticket_code"]

    # 3. Attendee 3 registers -> Event full -> Waitlisted
    reg3 = client.post(f"/api/events/{event_id}/register", headers=att3_headers)
    assert reg3.status_code == 201
    assert reg3.json()["status"] == "waitlist"
    tkt3 = reg3.json()["ticket_code"]

    # 4. Organizer fetches attendees overview (O04)
    ov_resp = client.get(f"/api/events/{event_id}/attendees", headers=org_headers)
    assert ov_resp.status_code == 200
    ov = ov_resp.json()
    assert ov["event_id"] == event_id
    assert ov["confirmed_count"] == 2
    assert ov["waitlist_count"] == 1
    assert ov["checked_in_count"] == 0
    assert len(ov["attendees"]) == 3
    assert len(ov["waitlist_queue"]) == 1
    assert ov["waitlist_queue"][0]["full_name"] == "Marcus Brody"
    assert ov["waitlist_queue"][0]["waitlist_position"] == 1

    # 5. Filtering attendees by status
    conf_only = client.get(f"/api/events/{event_id}/attendees?status=confirmed", headers=org_headers)
    assert conf_only.status_code == 200
    assert len(conf_only.json()["attendees"]) == 2

    wl_only = client.get(f"/api/events/{event_id}/attendees?status=waitlist", headers=org_headers)
    assert wl_only.status_code == 200
    assert len(wl_only.json()["attendees"]) == 1

    # 6. Searching attendees by name
    search_resp = client.get(f"/api/events/{event_id}/attendees?search=Maya", headers=org_headers)
    assert search_resp.status_code == 200
    assert len(search_resp.json()["attendees"]) == 1
    assert search_resp.json()["attendees"][0]["full_name"] == "Maya Lin"

    # 7. Authorization isolation: other organizer cannot view roster -> 403
    unauth_roster = client.get(f"/api/events/{event_id}/attendees", headers=other_headers)
    assert unauth_roster.status_code == 403

    # 8. Check-in Desk lookup (O05)
    lookup_resp = client.get(f"/api/events/{event_id}/check-in/lookup?query=Rivera", headers=org_headers)
    assert lookup_resp.status_code == 200
    assert len(lookup_resp.json()) == 1
    assert lookup_resp.json()[0]["full_name"] == "Alex Rivera"

    # 9. Perform check-in by ticket code (O05)
    ci_resp = client.post(f"/api/events/{event_id}/check-in", json={"ticket_code": tkt1}, headers=org_headers)
    assert ci_resp.status_code == 200
    ci_data = ci_resp.json()
    assert ci_data["success"] is True
    assert ci_data["already_checked_in"] is False
    assert ci_data["attendee"]["is_checked_in"] is True
    assert ci_data["attendee"]["checked_in_at"] is not None

    # 10. Re-check-in same ticket -> already checked in
    ci_dup = client.post(f"/api/events/{event_id}/check-in", json={"ticket_code": tkt1}, headers=org_headers)
    assert ci_dup.status_code == 200
    assert ci_dup.json()["already_checked_in"] is True

    # 11. Attempt check-in on waitlisted attendee -> rejected 400
    ci_wl = client.post(f"/api/events/{event_id}/check-in", json={"ticket_code": tkt3}, headers=org_headers)
    assert ci_wl.status_code == 400
    assert "waitlist" in ci_wl.json()["detail"].lower()

    # 12. Attempt check-in invalid ticket -> 404
    ci_invalid = client.post(f"/api/events/{event_id}/check-in", json={"ticket_code": "INVALID-TICKET-999"}, headers=org_headers)
    assert ci_invalid.status_code == 404

    # 13. Toggle check-in endpoint (Undo / Check-in)
    toggle_resp = client.post(f"/api/events/{event_id}/attendees/{reg1_id}/toggle-checkin", headers=org_headers)
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["is_checked_in"] is False

    # Toggle again -> True
    toggle_resp2 = client.post(f"/api/events/{event_id}/attendees/{reg1_id}/toggle-checkin", headers=org_headers)
    assert toggle_resp2.status_code == 200
    assert toggle_resp2.json()["is_checked_in"] is True

    # 14. Verify updated check-in count in attendees overview
    final_ov = client.get(f"/api/events/{event_id}/attendees", headers=org_headers).json()
    assert final_ov["checked_in_count"] == 1
