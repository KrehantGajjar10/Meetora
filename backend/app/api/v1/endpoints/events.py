from typing import Any, List, Optional
import uuid
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session


from app.api import deps
from app.core.database import get_db
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import User
from app.schemas.event import Event as EventSchema, EventCreate, EventUpdate
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
    Retrieve events.
    """
    query = db.query(Event)
    
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(Event.title.ilike(term) | Event.description.ilike(term))
        
    if category and category.strip() and category.strip().lower() != "all":
        query = query.filter(Event.category.ilike(category.strip()))
        
    events = query.order_by(Event.start_time.asc()).offset(skip).limit(limit).all()
    return events


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
) -> Any:
    """
    Create new event.
    """
    event = Event(**event_in.model_dump())
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
) -> Any:
    """
    Update an event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        
    update_data = event_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)
        
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

