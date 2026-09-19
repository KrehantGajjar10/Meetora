import asyncio
import os
from datetime import datetime, timedelta
from app.core.database import SessionLocal
from app.models.event import Event

def seed_events():
    db = SessionLocal()
    try:
        events_count = db.query(Event).count()
        if events_count > 0:
            print("Events already seeded.")
            return

        now = datetime.utcnow()
        events = [
            Event(
                title="Full-Stack Web Architecture with FastAPI & React",
                description="Modern web applications demand non-blocking I/O, rigorous type safety, and reactive client interfaces.",
                category="Workshops",
                start_time=now + timedelta(days=5),
                end_time=now + timedelta(days=5, hours=4),
                location="CS Building Hall A",
                is_online=True,
                capacity=60,
                registered_count=42,
                host_name="ACM Student Chapter",
                host_logo_text="ACM",
                image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuA-Ic6K0vop2sRtaF61pjbD7FCeun-WcObsWREEcH0L9Te5IayYdHQb8_d7bhzosMHXXvUN-IVHSiM_xR2gIOKVSXaz6teAONdVnFY6ud6fA6JI9WNItpVxcu1W7eQ5LC7suiMcDJ8bl-hNrRi1loGAXaS-pKFgDZ6CRnI2kI1S_YKbqRztB6Y6tZ-tIywkUcMcr3MxHG4phibl4zIGf5KdO_AvkmRQ62H9KSdRoV7fa6otQQ4m67358g",
                status="Registration open",
                registration_deadline=now + timedelta(days=4)
            ),
            Event(
                title="Design Systems & Tailwind CSS Masterclass",
                description="Learn the fundamentals of building scalable design systems using Tailwind CSS.",
                category="Design & UX",
                start_time=now + timedelta(days=8),
                end_time=now + timedelta(days=8, hours=2),
                location="Design Lab 204",
                is_online=False,
                capacity=30,
                registered_count=15,
                host_name="Campus UX Collective",
                host_logo_text="UX",
                image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuBt50_nVQRS_F0RSUZJrGB3U6TNY7Clnecfb-BKTDp-ULoBR9eGAl4q5SVGyxy0HJ3V4JnP-a3kHsLmPOuj7ThkP2Qyr-V-gWdxTBan3xjcXyECLlKq-0nr-kFO_y0VSJIiNymi_9D-S372PLNVze9Fr3l_6liqPAY_6jgnuz8_4J92xMN6sXwQhltNrxp4uXk4YlPYTn5PrYym35r7gTppwv1XJ8TZF8plyzOsBaiozYsa7Lczm-acYw",
                status="Registration open",
                registration_deadline=now + timedelta(days=7)
            ),
            Event(
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
                image_url="https://lh3.googleusercontent.com/aida-public/AB6AXuCnfqDyNAV5NX_d1RYnoMkg5iG3riU_9SsuDHPFkef5mYwJwSS5BlzbNHvzN12esAGrJcCfOvjyOKuk9kdzoSQpKguUmugRlzF9MRxnmstUa-Dx9lQEi7CSHmWWRwjc21ylvrZB2gy3nZQ2YJ3qdWcKFgstY1T7CmvdqYKzizHHwAUpfu3jgws24_NiuaL1Mh7MhX1DhEI7c-Qw-xxEGX9feDg4N-PnbGOUckxs_2ViIxPiw2fNqc175Q",
                status="Full",
                registration_deadline=now + timedelta(days=15)
            )
        ]
        db.add_all(events)
        db.commit()
        print("Successfully seeded events!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_events()
