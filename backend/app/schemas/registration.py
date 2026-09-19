from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.schemas.event import Event


class RegistrationBase(BaseModel):
    event_id: UUID
    status: str = "confirmed"
    ticket_code: str


class RegistrationCreate(BaseModel):
    pass


class RegistrationResponse(BaseModel):
    id: UUID
    user_id: UUID
    event_id: UUID
    status: str
    ticket_code: str
    created_at: datetime
    updated_at: datetime
    event: Optional[Event] = None

    model_config = ConfigDict(from_attributes=True)
