from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID


class EventBase(BaseModel):
    title: str
    description: str
    category: str
    start_time: datetime
    end_time: datetime
    location: str
    is_online: bool = False
    capacity: int
    host_name: str
    host_logo_text: Optional[str] = None
    image_url: Optional[str] = None
    status: str = "Registration open"
    registration_deadline: Optional[datetime] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    is_online: Optional[bool] = None
    capacity: Optional[int] = None
    host_name: Optional[str] = None
    host_logo_text: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    registration_deadline: Optional[datetime] = None


class EventInDBBase(EventBase):
    id: UUID
    registered_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Event(EventInDBBase):
    pass
