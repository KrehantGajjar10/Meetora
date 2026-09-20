/**
 * Centralized API client for Meetora.
 * Uses configurable base URL from VITE_API_BASE_URL environment variable.
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  database?: {
    connected: boolean;
    status: string;
  };
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Generic fetch wrapper with JSON parsing and standardized error handling.
 */
export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const token = localStorage.getItem('meetora_access_token');
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = errorBody || response.statusText;
    try {
      const parsed = JSON.parse(errorBody) as { detail?: string };
      message = parsed.detail || message;
    } catch {
      // Preserve the raw response when the backend does not return JSON.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch the minimal backend health status.
 */
export async function getHealthStatus(checkDb = false): Promise<HealthResponse> {
  return apiFetch<HealthResponse>(`/api/health${checkDb ? '?check_db=true' : ''}`);
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  location: string;
  is_online: boolean;
  capacity: number;
  registered_count: number;
  host_name: string;
  host_logo_text?: string;
  image_url?: string;
  status: string;
  registration_deadline?: string;
}

export async function getEvents(search?: string, category?: string): Promise<Event[]> {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category) params.append('category', category);
  const qs = params.toString();
  return apiFetch<Event[]>(`/api/events${qs ? '?' + qs : ''}`);
}

export async function getEvent(id: string): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}`);
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  status: 'confirmed' | 'waitlist' | 'cancelled' | string;
  ticket_code: string;
  created_at: string;
  updated_at: string;
  event?: Event;
}

export async function registerForEvent(eventId: string): Promise<Registration> {
  return apiFetch<Registration>(`/api/events/${eventId}/register`, {
    method: 'POST',
  });
}

export async function getEventRegistration(eventId: string): Promise<Registration> {
  return apiFetch<Registration>(`/api/events/${eventId}/registration`);
}

export async function getMyRegistrations(): Promise<Registration[]> {
  return apiFetch<Registration[]>('/api/registrations/me');
}

export async function cancelEventRegistration(eventId: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/events/${eventId}/register`, {
    method: 'DELETE',
  });
}

export interface OrganizerEvent extends Event {
  waitlist_count: number;
  attendance_count: number;
  organizer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendeeActivity {
  id: string;
  user_name: string;
  user_email: string;
  event_title: string;
  event_id: string;
  status: string;
  ticket_code: string;
  created_at: string;
}

export interface OrganizerOverview {
  total_events: number;
  published_events: number;
  draft_events: number;
  completed_events: number;
  cancelled_events: number;
  total_confirmed: number;
  total_waitlist: number;
  total_checked_in: number;
  upcoming_events: OrganizerEvent[];
  recent_activity: AttendeeActivity[];
}

export interface EventCreateData {
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time: string;
  location: string;
  is_online: boolean;
  capacity: number;
  host_name?: string;
  host_logo_text?: string;
  image_url?: string;
  status?: string;
  registration_deadline?: string;
}

export interface EventUpdateData {
  title?: string;
  description?: string;
  category?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  is_online?: boolean;
  capacity?: number;
  host_name?: string;
  host_logo_text?: string;
  image_url?: string;
  status?: string;
  registration_deadline?: string;
}

export async function getOrganizerOverview(): Promise<OrganizerOverview> {
  return apiFetch<OrganizerOverview>('/api/events/organizer/overview');
}

export async function getOrganizerEvents(
  status?: string,
  search?: string,
  sort?: string
): Promise<OrganizerEvent[]> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  if (sort) params.append('sort', sort);
  const qs = params.toString();
  return apiFetch<OrganizerEvent[]>(`/api/events/organizer/my-events${qs ? '?' + qs : ''}`);
}

export async function createEvent(data: EventCreateData): Promise<Event> {
  return apiFetch<Event>('/api/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id: string, data: EventUpdateData): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function updateEventStatus(id: string, status: string): Promise<Event> {
  return apiFetch<Event>(`/api/events/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export interface AttendeeItem {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  ticket_code: string;
  is_checked_in: boolean;
  checked_in_at?: string | null;
  created_at: string;
  full_name: string;
  email: string;
  waitlist_position?: number | null;
}

export interface EventAttendeesOverview {
  event_id: string;
  event_title: string;
  event_status: string;
  start_time: string;
  end_time: string;
  location: string;
  is_online: boolean;
  capacity: number;
  total_registered: number;
  confirmed_count: number;
  waitlist_count: number;
  checked_in_count: number;
  cancelled_count: number;
  attendees: AttendeeItem[];
  waitlist_queue: AttendeeItem[];
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  attendee?: AttendeeItem | null;
  already_checked_in: boolean;
}

export async function getEventAttendees(
  eventId: string,
  status?: string,
  search?: string
): Promise<EventAttendeesOverview> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  const qs = params.toString();
  return apiFetch<EventAttendeesOverview>(`/api/events/${eventId}/attendees${qs ? '?' + qs : ''}`);
}

export async function lookupAttendeesForCheckIn(
  eventId: string,
  query: string
): Promise<AttendeeItem[]> {
  const params = new URLSearchParams({ query });
  return apiFetch<AttendeeItem[]>(`/api/events/${eventId}/check-in/lookup?${params.toString()}`);
}

export async function checkInAttendee(
  eventId: string,
  ticketCode?: string,
  registrationId?: string
): Promise<CheckInResponse> {
  return apiFetch<CheckInResponse>(`/api/events/${eventId}/check-in`, {
    method: 'POST',
    body: JSON.stringify({ ticket_code: ticketCode, registration_id: registrationId }),
  });
}

export async function toggleAttendeeCheckin(
  eventId: string,
  registrationId: string
): Promise<AttendeeItem> {
  return apiFetch<AttendeeItem>(`/api/events/${eventId}/attendees/${registrationId}/toggle-checkin`, {
    method: 'POST',
  });
}

