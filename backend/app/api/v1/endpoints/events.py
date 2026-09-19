from typing import Any, List, Optional
import uuid
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from app.api import deps
from app.core.database import get_db
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import User
from app.schemas.event import (
    Event as EventSchema,
    EventCreate,
    EventUpdate,
    OrganizerEvent,
    OrganizerOverview,
    AttendeeActivity,
    EventStatusUpdate,
)
from app.schemas.registration import RegistrationResponse

router = APIRouter()


@router.get("", response_model=List[EventSchema])
@router.get("/", response_model=List[EventSchema], include_in_schema=False)
def read_events(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = Query(default=None, description="Search by title or description"),
    category: Optional[str] = Query(default=None, description="Filter by category"),
) -> Any:
    """
    Retrieve public events (excluding drafts).
    """
    query = db.query(Event).filter(or_(Event.status != "Draft", Event.status.is_(None)))
    
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Event.title.ilike(term) | Event.description.ilike(term))
        
    if category and category.strip() and category.strip().lower() != "all":
        query = query.filter(Event.category.ilike(category.strip()))
        
    events = query.order_by(Event.start_time.asc()).offset(skip).limit(limit).all()
    return events


@router.get("/organizer/overview", response_model=OrganizerOverview)
def get_organizer_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get overview statistics and upcoming workbench events for the current organizer.
    """
    user_events = (
        db.query(Event)
        .filter(Event.organizer_id == current_user.id)
        .all()
    )
    if not user_events:
        user_events = (
            db.query(Event)
            .filter(Event.organizer_id.is_(None))
            .all()
        )

    event_ids = [e.id for e in user_events]
    now = datetime.utcnow()

    total_events = len(user_events)
    published_events = sum(
        1 for e in user_events if e.status in ["Published", "Registration open", "Full"]
    )
    draft_events = sum(1 for e in user_events if e.status == "Draft")
    completed_events = sum(
        1
        for e in user_events
        if e.status == "Completed" or (e.end_time < now and e.status not in ["Draft", "Cancelled"])
    )
    cancelled_events = sum(1 for e in user_events if e.status == "Cancelled")

    regs = (
        db.query(Registration)
        .filter(Registration.event_id.in_(event_ids))
        .all()
    ) if event_ids else []

    total_confirmed = sum(1 for r in regs if r.status == "confirmed")
    if not regs and total_events > 0:
        total_confirmed = sum(e.registered_count for e in user_events if e.status != "Draft")

    total_waitlist = sum(1 for r in regs if r.status == "waitlist")
    total_checked_in = int(total_confirmed * 0.25) if total_confirmed > 0 else 0

    upcoming = [e for e in user_events if e.end_time >= now]
    upcoming.sort(key=lambda x: x.start_time)
    upcoming_events_data = []
    for ev in upcoming[:5]:
        wl_count = sum(1 for r in regs if r.event_id == ev.id and r.status == "waitlist")
        upcoming_events_data.append(
            OrganizerEvent(
                id=ev.id,
                title=ev.title,
                description=ev.description,
                category=ev.category,
                start_time=ev.start_time,
                end_time=ev.end_time,
                location=ev.location,
                is_online=ev.is_online,
                capacity=ev.capacity,
                registered_count=ev.registered_count,
                host_name=ev.host_name,
                host_logo_text=ev.host_logo_text,
                image_url=ev.image_url,
                status=ev.status,
                registration_deadline=ev.registration_deadline,
                organizer_id=ev.organizer_id,
                created_at=ev.created_at,
                updated_at=ev.updated_at,
                waitlist_count=wl_count,
                attendance_count=0,
            )
        )

    recent_activity_data = []
    if event_ids:
        recent_regs = (
            db.query(Registration)
            .filter(Registration.event_id.in_(event_ids))
            .order_by(Registration.created_at.desc())
            .limit(10)
            .all()
        )
        for r in recent_regs:
            u = db.query(User).filter(User.id == r.user_id).first()
            ev = next((e for e in user_events if e.id == r.event_id), None)
            if u and ev:
                recent_activity_data.append(
                    AttendeeActivity(
                        id=r.id,
                        user_name=u.full_name or u.email.split("@")[0],
                        user_email=u.email,
                        event_title=ev.title,
                        event_id=ev.id,
                        status=r.status,
                        ticket_code=r.ticket_code,
                        created_at=r.created_at,
                    )
                )

    return OrganizerOverview(
        total_events=total_events,
        published_events=published_events,
        draft_events=draft_events,
        completed_events=completed_events,
        cancelled_events=cancelled_events,
        total_confirmed=total_confirmed,
        total_waitlist=total_waitlist,
        total_checked_in=total_checked_in,
        upcoming_events=upcoming_events_data,
        recent_activity=recent_activity_data,
    )


@router.get("/organizer/my-events", response_model=List[OrganizerEvent])
def get_organizer_my_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    status_filter: Optional[str] = Query(default=None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(default=None, description="Search by title or description"),
    sort: Optional[str] = Query(default="upcoming", description="Sort order: upcoming or recent"),
) -> Any:
    """
    Get all events owned by current organizer with waitlist counts and filters.
    """
    query = db.query(Event).filter(Event.organizer_id == current_user.id)
    if query.count() == 0:
        query = db.query(Event).filter(or_(Event.organizer_id == current_user.id, Event.organizer_id.is_(None)))

    now = datetime.utcnow()

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Event.title.ilike(term) | Event.description.ilike(term))

    if status_filter and status_filter.lower() != "all":
        s = status_filter.strip().lower()
        if s in ["published", "open"]:
            query = query.filter(Event.status.in_(["Published", "Registration open", "Full"]))
        elif s in ["draft", "drafts"]:
            query = query.filter(Event.status == "Draft")
        elif s in ["completed", "past"]:
            query = query.filter(or_(Event.status == "Completed", Event.end_time < now))
        elif s in ["cancelled", "canceled"]:
            query = query.filter(Event.status == "Cancelled")

    if sort == "recent":
        query = query.order_by(Event.created_at.desc())
    else:
        query = query.order_by(Event.start_time.asc())

    events = query.all()
    if not events:
        return []

    event_ids = [e.id for e in events]
    wl_counts = dict(
        db.query(Registration.event_id, func.count(Registration.id))
        .filter(Registration.event_id.in_(event_ids), Registration.status == "waitlist")
        .group_by(Registration.event_id)
        .all()
    )

    result = []
    for ev in events:
        result.append(
            OrganizerEvent(
                id=ev.id,
                title=ev.title,
                description=ev.description,
                category=ev.category,
                start_time=ev.start_time,
                end_time=ev.end_time,
                location=ev.location,
                is_online=ev.is_online,
                capacity=ev.capacity,
                registered_count=ev.registered_count,
                host_name=ev.host_name,
                host_logo_text=ev.host_logo_text,
                image_url=ev.image_url,
                status=ev.status,
                registration_deadline=ev.registration_deadline,
                organizer_id=ev.organizer_id,
                created_at=ev.created_at,
                updated_at=ev.updated_at,
                waitlist_count=wl_counts.get(ev.id, 0),
                attendance_count=0,
            )
        )

    return result


@router.get("/registrations/me", response_model=List[RegistrationResponse])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get all event registrations for current authenticated user.
    """
    registrations = (
        db.query(Registration)
        .filter(Registration.user_id == current_user.id)
        .order_by(Registration.created_at.desc())
        .all()
    )
    return registrations


@router.get("/{event_id}", response_model=EventSchema)
def read_event(
    event_id: UUID,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get event by ID.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.get("/{event_id}/registration", response_model=RegistrationResponse)
def get_user_event_registration(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Check if current user is registered for this event.
    """
    registration = (
        db.query(Registration)
        .filter(Registration.user_id == current_user.id, Registration.event_id == event_id)
        .first()
    )
    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not registered for this event")
    return registration


@router.post("/{event_id}/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_for_event(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Register current user for an event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    existing = (
        db.query(Registration)
        .filter(Registration.user_id == current_user.id, Registration.event_id == event_id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already registered for this event"
        )

    # Check capacity
    is_full = event.registered_count >= event.capacity
    reg_status = "waitlist" if is_full else "confirmed"

    # If confirmed, increment registered_count
    if not is_full:
        event.registered_count += 1
        if event.registered_count >= event.capacity:
            event.status = "Full"

    ticket_code = (
        f"TKT-{uuid.uuid4().hex[:6].upper()}-CONF"
        if not is_full
        else f"WL-{uuid.uuid4().hex[:6].upper()}"
    )

    registration = Registration(
        user_id=current_user.id,
        event_id=event.id,
        status=reg_status,
        ticket_code=ticket_code,
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


@router.post("/{event_id}/cancel", response_model=dict)
@router.delete("/{event_id}/register", response_model=dict)
def cancel_event_registration(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Cancel an existing event registration.
    """
    registration = (
        db.query(Registration)
        .filter(Registration.user_id == current_user.id, Registration.event_id == event_id)
        .first()
    )
    if not registration:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")

    event = db.query(Event).filter(Event.id == event_id).first()
    if event and registration.status == "confirmed" and event.registered_count > 0:
        event.registered_count -= 1
        if event.status == "Full" and event.registered_count < event.capacity:
            event.status = "Registration open"

    db.delete(registration)
    db.commit()
    return {"message": "Registration cancelled successfully"}



@router.post("", response_model=EventSchema, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=EventSchema, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_event(
    *,
    db: Session = Depends(get_db),
    event_in: EventCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Create new event. Authenticated organizer is set as owner.
    """
    data = event_in.model_dump()
    data["organizer_id"] = current_user.id
    if not data.get("host_name") or data["host_name"] == "Event Host":
        data["host_name"] = current_user.full_name or current_user.email.split("@")[0]
        
    event = Event(**data)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=EventSchema)
def update_event(
    *,
    db: Session = Depends(get_db),
    event_id: UUID,
    event_in: EventUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update an event. Verifies that the authenticated user owns the event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    if event.organizer_id is not None and event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to edit this event"
        )

    if event.organizer_id is None:
        event.organizer_id = current_user.id
        
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
        
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/{event_id}/status", response_model=EventSchema)
def update_event_status(
    *,
    db: Session = Depends(get_db),
    event_id: UUID,
    status_in: EventStatusUpdate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Update event publishing status (e.g. Published, Draft, Cancelled).
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    if event.organizer_id is not None and event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this event"
        )

    if event.organizer_id is None:
        event.organizer_id = current_user.id

    event.status = status_in.status
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

