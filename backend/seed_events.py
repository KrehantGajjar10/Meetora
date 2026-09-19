import uuid
from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.core import security
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration

def seed_events_and_organizer():
    db = SessionLocal()
    try:
        # 1. Seed or retrieve dev organizer account
        organizer = db.query(User).filter(User.email == "organizer@meetora.com").first()
        if not organizer:
            organizer = User(
                id=uuid.uuid4(),
                email="organizer@meetora.com",
                full_name="Lead Campus Organizer",
                hashed_password=security.get_password_hash("Organizer123!"),
                is_active=True,
                is_organizer=True,
            )
            db.add(organizer)
            db.commit()
            db.refresh(organizer)
            print(f"Created dev organizer: {organizer.email} (password: Organizer123!)")
        else:
            if not organizer.is_organizer:
                organizer.is_organizer = True
                db.add(organizer)
                db.commit()
                print(f"Updated {organizer.email} to is_organizer=True")

        # 2. Seed student attendees if needed
        student1 = db.query(User).filter(User.email == "alex.rivera@campus.edu").first()
        if not student1:
            student1 = User(
                id=uuid.uuid4(),
                email="alex.rivera@campus.edu",
                full_name="Alex Rivera",
                hashed_password=security.get_password_hash("Student123!"),
                is_active=True,
                is_organizer=False,
            )
            db.add(student1)

        student2 = db.query(User).filter(User.email == "maya.lin@techhub.org").first()
        if not student2:
            student2 = User(
                id=uuid.uuid4(),
                email="maya.lin@techhub.org",
                full_name="Maya Lin",
                hashed_password=security.get_password_hash("Student123!"),
                is_active=True,
                is_organizer=False,
            )
            db.add(student2)

        student3 = db.query(User).filter(User.email == "marcus.brody@campus.edu").first()
        if not student3:
            student3 = User(
                id=uuid.uuid4(),
                email="marcus.brody@campus.edu",
                full_name="Marcus Brody",
                hashed_password=security.get_password_hash("Student123!"),
                is_active=True,
                is_organizer=False,
            )
            db.add(student3)

        db.commit()

        # 3. Seed Events
        events_count = db.query(Event).count()
        now = datetime.utcnow()
        if events_count == 0:
            events = [
                Event(
                    id=uuid.uuid4(),
                    title="Full-Stack Web Architecture with FastAPI & React",
                    description="Modern web applications demand non-blocking I/O, rigorous type safety, and reactive client interfaces.",
                    category="Workshops",
                    start_time=now + timedelta(days=5),
                    end_time=now + timedelta(days=5, hours=4),
                    location="CS Building Hall A",
                    is_online=True,
                    capacity=60,
                    registered_count=2,
                    host_name="ACM Student Chapter",
                    host_logo_text="ACM",
                    organizer_id=organizer.id,
                    image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuA-Ic6K0vop2sRtaF61pjbD7FCeun-WcObsWREEcH0L9Te5IayYdHQb8_d7bhzosMHXXvUN-IVHSiM_xR2gIOKVSXaz6teAONdVnFY6ud6fA6JI9WNItpVxcu1W7eQ5LC7suiMcDJ8bl-hNrRi1loGAXaS-pKFgDZ6CRnI2kI1S_YKbqRztB6Y6tZ-tIywkUcMcr3MxHG4phibl4zIGf5KdO_AvkmRQ62H9KSdRoV7fa6otQQ4m67358g",
                    status="Registration open",
                    registration_deadline=now + timedelta(days=4),
                ),
                Event(
                    id=uuid.uuid4(),
                    title="Design Systems & Tailwind CSS Masterclass",
                    description="Learn the fundamentals of building scalable design systems using Tailwind CSS.",
                    category="Design & UX",
                    start_time=now + timedelta(days=8),
                    end_time=now + timedelta(days=8, hours=2),
                    location="Design Lab 204",
                    is_online=False,
                    capacity=30,
                    registered_count=1,
                    host_name="Campus UX Collective",
                    host_logo_text="UX",
                    organizer_id=organizer.id,
                    image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuBt50_nVQRS_F0RSUZJrGB3U6TNY7Clnecfb-BKTDp-ULoBR9eGAl4q5SVGyxy0HJ3V4JnP-a3kHsLmPOuj7ThkP2Qyr-V-gWdxTBan3xjcXyECLlKq-0nr-kFO_y0VSJIiNymi_9D-S372PLNVze9Fr3l_6liqPAY_6jgnuz8_4J92xMN6sXwQhltNrxp4uXk4YlPYTn5PrYym35r7gTppwv1XJ8TZF8plyzOsBaiozYsa7Lczm-acYw",
                    status="Registration open",
                    registration_deadline=now + timedelta(days=7),
                ),
                Event(
                    id=uuid.uuid4(),
                    title="Annual 24-Hour Autumn Hackathon 2026",
                    description="Join us for a 24-hour coding marathon. Food and drinks provided!",
                    category="Hackathons & Competitions",
                    start_time=now + timedelta(days=20),
                    end_time=now + timedelta(days=21),
                    location="Student Union Grand Hall",
                    is_online=False,
                    capacity=150,
                    registered_count=150,
                    host_name="Engineering Student Council",
                    host_logo_text="EC",
                    organizer_id=organizer.id,
                    image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuCnfqDyNAV5NX_d1RYnoMkg5iG3riU_9SsuDHPFkef5mYwJwSS5BlzbNHvzN12esAGrJcCfOvjyOKuk9kdzoSQpKguUmugRlzF9MRxnmstUa-Dx9lQEi7CSHmWWRwjc21ylvrZB2gy3nZQ2YJ3qdWcKFgstY1T7CmvdqYKzizHHwAUpfu3jgws24_NiuaL1Mh7MhX1DhEI7c-Qw-xxEGX9feDg4N-PnbGOUckxs_2ViIxPiw2fNqc175Q",
                    status="Full",
                    registration_deadline=now + timedelta(days=15),
                ),
            ]
            db.add_all(events)
            db.commit()
            print("Successfully seeded events!")
        else:
            # Assign any unowned events to the organizer
            unowned = db.query(Event).filter(Event.organizer_id.is_(None)).all()
            for ev in unowned:
                ev.organizer_id = organizer.id
            db.commit()
            print(f"Assigned {len(unowned)} events to organizer {organizer.email}")

        # 4. Seed sample registrations on the first event if none exist
        first_event = db.query(Event).first()
        if first_event and db.query(Registration).filter(Registration.event_id == first_event.id).count() == 0:
            if student1:
                r1 = Registration(
                    id=uuid.uuid4(),
                    user_id=student1.id,
                    event_id=first_event.id,
                    status="confirmed",
                    ticket_code="TKT-ALEX01-CONF",
                    is_checked_in=True,
                    checked_in_at=now - timedelta(minutes=45),
                    created_at=now - timedelta(days=2),
                )
                db.add(r1)
            if student2:
                r2 = Registration(
                    id=uuid.uuid4(),
                    user_id=student2.id,
                    event_id=first_event.id,
                    status="confirmed",
                    ticket_code="TKT-MAYA02-CONF",
                    is_checked_in=False,
                    created_at=now - timedelta(days=1),
                )
                db.add(r2)
            if student3:
                r3 = Registration(
                    id=uuid.uuid4(),
                    user_id=student3.id,
                    event_id=first_event.id,
                    status="waitlist",
                    ticket_code="WL-MARC03-WAIT",
                    is_checked_in=False,
                    created_at=now - timedelta(hours=6),
                )
                db.add(r3)
            db.commit()
            print("Seeded initial registrations for event management demonstration.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_events_and_organizer()
