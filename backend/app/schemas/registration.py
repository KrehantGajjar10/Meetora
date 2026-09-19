from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.schemas.event import Event


class RegistrationBase(BaseModel):
    event_id: UUID
    status: str = "confirmed"
    ticket_code: str
    is_checked_in: bool = False
    checked_in_at: Optional[datetime] = None


class RegistrationCreate(BaseModel):
    pass


class RegistrationResponse(BaseModel):
    id: UUID
    user_id: UUID
    event_id: UUID
    status: str
    ticket_code: str
    is_checked_in: bool = False
    checked_in_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    event: Optional[Event] = None

    model_config = ConfigDict(from_attributes=True)


class AttendeeItem(BaseModel):
    id: UUID
    user_id: UUID
    event_id: UUID
    status: str
    ticket_code: str
    is_checked_in: bool = False
    checked_in_at: Optional[datetime] = None
    created_at: datetime
    full_name: str
    email: str
    waitlist_position: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class CheckInRequest(BaseModel):
    ticket_code: Optional[str] = None
    registration_id: Optional[UUID] = None


class CheckInResponse(BaseModel):
    success: bool
    message: str
    attendee: Optional[AttendeeItem] = None
    already_checked_in: bool = False


class EventAttendeesOverview(BaseModel):
    event_id: UUID
    event_title: str
    event_status: str
    start_time: datetime
    end_time: datetime
    location: str
    is_online: bool
    capacity: int
    total_registered: int
    confirmed_count: int
    waitlist_count: int
    checked_in_count: int
    cancelled_count: int
    attendees: List[AttendeeItem]
    waitlist_queue: List[AttendeeItem]

