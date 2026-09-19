import { useEffect, useState, useId } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Building,
  Video,
  Layers,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  Info,
  Timer,
  BadgeCheck,
} from 'lucide-react';
import OrganizerLayout from '@/components/layout/OrganizerLayout';
import {
  createEvent,
  updateEvent,
  getEvent,
  type EventCreateData,
  type EventUpdateData,
} from '@/lib/api';

const PRESET_COVERS = [
  {
    name: 'Technology & Architecture',
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Design & UX Studio',
    url: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Hackathon & Coding',
    url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Campus Gathering',
    url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function CreateEditEvent() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  // Form field state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Technology & Engineering');
  const [description, setDescription] = useState('');

  // Schedule state (defaults: tomorrow 10:00 AM to 2:00 PM)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState(defaultDateStr);
  const [endTime, setEndTime] = useState('14:00');

  // Format & Location
  const [eventFormat, setEventFormat] = useState<'in_person' | 'online' | 'hybrid'>('in_person');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [streamUrl, setStreamUrl] = useState('');

  // Capacity & Waitlist
  const [capacity, setCapacity] = useState(100);
  const [enableWaitlist, setEnableWaitlist] = useState(true);

  // Cover Image
  const [imageUrl, setImageUrl] = useState(PRESET_COVERS[0].url);

  // Status & Lifecycle
  const [status, setStatus] = useState<string>('Draft');
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  const eventTitleId = useId();
  const eventCategoryId = useId();
  const eventDescriptionId = useId();
  const startDateId = useId();
  const startTimeId = useId();
  const endDateId = useId();
  const endTimeId = useId();
  const venueNameId = useId();
  const venueAddressId = useId();
  const streamUrlId = useId();
  const eventCapacityId = useId();
  const waitlistToggleId = useId();
  const coverUrlId = useId();

  useEffect(() => {
    if (!id) return;
    async function loadEvent() {
      setIsLoading(true);
      setFeedbackError(null);
      try {
        const ev = await getEvent(id!);
        setTitle(ev.title);
        setCategory(ev.category || 'Technology & Engineering');
        setDescription(ev.description);
        setStatus(ev.status || 'Draft');
        setCapacity(ev.capacity);
        setRegisteredCount(ev.registered_count || 0);

        if (ev.image_url) setImageUrl(ev.image_url);

        // Parse schedule
        if (ev.start_time) {
          const s = new Date(ev.start_time);
          setStartDate(s.toISOString().split('T')[0]);
          setStartTime(s.toTimeString().slice(0, 5));
        }
        if (ev.end_time) {
          const e = new Date(ev.end_time);
          setEndDate(e.toISOString().split('T')[0]);
          setEndTime(e.toTimeString().slice(0, 5));
        }

        // Parse location & format
        if (ev.is_online) {
          if (ev.location && ev.location.toLowerCase().includes('hall')) {
            setEventFormat('hybrid');
            setVenueName(ev.location);
          } else {
            setEventFormat('online');
            setStreamUrl(ev.location);
          }
        } else {
          setEventFormat('in_person');
          setVenueName(ev.location);
        }
      } catch (err) {
        setFeedbackError(err instanceof Error ? err.message : 'Failed to load event data');
      } finally {
        setIsLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  // Duration calculation
  const calculatedDuration = () => {
    try {
      const start = new Date(`${startDate}T${startTime}:00`);
      const end = new Date(`${endDate}T${endTime}:00`);
      const diffHrs = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (diffHrs <= 0) return 'Invalid (end time must be after start time)';
      if (diffHrs === 1) return '1 hour';
      if (diffHrs < 1) return `${Math.round(diffHrs * 60)} minutes`;
      return `${Math.round(diffHrs * 10) / 10} hours`;
    } catch {
      return 'N/A';
    }
  };

  const constructLocationString = () => {
    if (eventFormat === 'online') {
      return streamUrl.trim() || 'Online Meeting / Stream';
    }
    if (eventFormat === 'hybrid') {
      const v = venueName.trim() || 'Campus Venue';
      return streamUrl.trim() ? `${v} + Online Stream` : `${v} (Hybrid)`;
    }
    const name = venueName.trim() || 'Campus Hall';
    const addr = venueAddress.trim();
    return addr ? `${name} (${addr})` : name;
  };

  const handleSubmit = async (publish: boolean) => {
    setFeedbackError(null);
    setFeedbackSuccess(null);

    // Form validation
    if (!title.trim()) {
      setFeedbackError('Event title is required.');
      return;
    }
    if (!description.trim()) {
      setFeedbackError('Event description is required.');
      return;
    }
    if (!startDate || !startTime || !endDate || !endTime) {
      setFeedbackError('Please set complete start and end schedules.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);
    if (endDateTime <= startDateTime) {
      setFeedbackError('End schedule must be chronologically after the start schedule.');
      return;
    }

    if (eventFormat !== 'online' && !venueName.trim()) {
      setFeedbackError('Venue name is required for in-person and hybrid events.');
      return;
    }

    if (capacity < 1) {
      setFeedbackError('Capacity must be at least 1 attendee.');
      return;
    }

    setIsSubmitting(true);

    const chosenStatus = publish ? 'Published' : 'Draft';
    const locationStr = constructLocationString();
    const isOnline = eventFormat === 'online' || eventFormat === 'hybrid';

    try {
      if (isEditing && id) {
        const updatePayload: EventUpdateData = {
          title: title.trim(),
          category,
          description: description.trim(),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: locationStr,
          is_online: isOnline,
          capacity: Number(capacity),
          image_url: imageUrl,
          status: chosenStatus,
        };
        await updateEvent(id, updatePayload);
        setFeedbackSuccess(
          publish ? 'Event published successfully!' : 'Draft changes saved!'
        );
        setTimeout(() => {
          navigate('/organizer/events');
        }, 1200);
      } else {
        const createPayload: EventCreateData = {
          title: title.trim(),
          category,
          description: description.trim(),
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          location: locationStr,
          is_online: isOnline,
          capacity: Number(capacity),
          image_url: imageUrl,
          status: chosenStatus,
        };
        await createEvent(createPayload);
        setFeedbackSuccess(
          publish
            ? 'Event published to campus catalog!'
            : 'Event draft created in your workspace!'
        );
        setTimeout(() => {
          navigate('/organizer/events');
        }, 1200);
      }
    } catch (err) {
      setFeedbackError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDraft = status === 'Draft';

  return (
    <OrganizerLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Top Breadcrumb & Status */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/organizer/events"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to My Events</span>
          </Link>
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold border ${
              isDraft
                ? 'border-status-warning/30 bg-status-warning/10 text-status-warning'
                : 'border-status-success/30 bg-status-success/10 text-status-success'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isDraft ? 'bg-status-warning' : 'bg-status-success'
              }`}
            />
            <span>{isDraft ? 'Draft — Unpublished' : 'Published — Live in Catalog'}</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
            {isEditing ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="mt-1.5 text-sm text-text-secondary">
            Add the details for your event and choose when to publish it to the campus discovery catalog.
          </p>
        </div>

        {/* Feedback alerts */}
        {feedbackError && (
          <div className="mb-6 rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger">
            {feedbackError}
          </div>
        )}
        {feedbackSuccess && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-status-success/30 bg-status-success/10 p-4 text-sm font-medium text-status-success">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading event details...
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(true);
            }}
            className="space-y-6 pb-28"
          >
            {/* SECTION A: Basic Information */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Info className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Basic Information</h2>
                  <p className="text-xs text-text-secondary">
                    Provide clear naming and taxonomy so attendees can easily find your session.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Title */}
                <div>
                  <label htmlFor={eventTitleId} className="mb-1.5 block text-xs font-semibold text-text-primary">
                    Event title <span className="text-status-danger">*</span>
                  </label>
                  <input
                    id={eventTitleId}
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Full-Stack Web Architecture with FastAPI & React"
                    className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft transition"
                  />
                  <p className="mt-1 text-[11px] text-text-secondary">
                    Keep titles descriptive, under 70 characters for best student engagement.
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor={eventCategoryId} className="mb-1.5 block text-xs font-semibold text-text-primary">
                    Category <span className="text-status-danger">*</span>
                  </label>
                  <select
                    id={eventCategoryId}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full cursor-pointer rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft transition"
                  >
                    <option value="Technology & Engineering">Technology & Engineering</option>
                    <option value="Design & UX">Design & UX</option>
                    <option value="Workshops & Hands-on Labs">Workshops & Hands-on Labs</option>
                    <option value="Hackathons & Competitions">Hackathons & Competitions</option>
                    <option value="Career & Tech Talks">Career & Tech Talks</option>
                    <option value="Other / Social Gathering">Other / Social Gathering</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor={eventDescriptionId} className="block text-xs font-semibold text-text-primary">
                      Event description <span className="text-status-danger">*</span>
                    </label>
                    <span className="text-[11px] text-text-secondary">Markdown supported</span>
                  </div>
                  <textarea
                    id={eventDescriptionId}
                    required
                    rows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what attendees can expect from your event, prerequisites, and learning outcomes..."
                    className="w-full rounded-lg border border-border bg-surface p-3.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft transition leading-relaxed"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-text-secondary">
                    <span>Minimum 50 characters recommended for high discovery score.</span>
                    <span>{description.length} characters</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B: Date & Time Schedule */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Schedule</h2>
                  <p className="text-xs text-text-secondary">Set your event start and end times.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Start Block */}
                <div className="rounded-lg border border-border/80 bg-app-bg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-status-success" />
                    <span className="text-xs font-semibold text-text-primary">Start Schedule</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={startDateId} className="mb-1 block text-[11px] text-text-secondary">Start Date</label>
                      <input
                        id={startDateId}
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                      />
                    </div>
                    <div>
                      <label htmlFor={startTimeId} className="mb-1 block text-[11px] text-text-secondary">Start Time</label>
                      <input
                        id={startTimeId}
                        type="time"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                      />
                    </div>
                  </div>
                </div>

                {/* End Block */}
                <div className="rounded-lg border border-border/80 bg-app-bg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                    <span className="text-xs font-semibold text-text-primary">End Schedule</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={endDateId} className="mb-1 block text-[11px] text-text-secondary">End Date</label>
                      <input
                        id={endDateId}
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                      />
                    </div>
                    <div>
                      <label htmlFor={endTimeId} className="mb-1 block text-[11px] text-text-secondary">End Time</label>
                      <input
                        id={endTimeId}
                        type="time"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Schedule duration helper */}
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-app-bg px-3.5 py-2.5 text-xs text-text-secondary">
                <Calendar className="h-4 w-4 text-primary shrink-0" />
                <span>
                  Total Duration: <strong className="text-text-primary">{calculatedDuration()}</strong>.
                </span>
              </div>
            </div>

            {/* SECTION C: Location & Format */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Location &amp; Format</h2>
                  <p className="text-xs text-text-secondary">Specify how participants will attend your session.</p>
                </div>
              </div>

              {/* Format Segmented Radio Cards */}
              <div className="mb-6">
                <label className="mb-2.5 block text-xs font-semibold text-text-primary">
                  Event Format <span className="text-status-danger">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {/* In-Person */}
                  <button
                    type="button"
                    onClick={() => setEventFormat('in_person')}
                    className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                      eventFormat === 'in_person'
                        ? 'border-primary bg-primary-soft/40 ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:bg-app-bg'
                    }`}
                  >
                    <Building className={`h-5 w-5 mb-2 ${eventFormat === 'in_person' ? 'text-primary' : 'text-text-secondary'}`} />
                    <span className="text-sm font-semibold text-text-primary">In person</span>
                    <span className="text-[11px] text-text-secondary mt-0.5">Physical campus location</span>
                  </button>

                  {/* Online */}
                  <button
                    type="button"
                    onClick={() => setEventFormat('online')}
                    className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                      eventFormat === 'online'
                        ? 'border-primary bg-primary-soft/40 ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:bg-app-bg'
                    }`}
                  >
                    <Video className={`h-5 w-5 mb-2 ${eventFormat === 'online' ? 'text-primary' : 'text-text-secondary'}`} />
                    <span className="text-sm font-semibold text-text-primary">Online</span>
                    <span className="text-[11px] text-text-secondary mt-0.5">Virtual link / webinar</span>
                  </button>

                  {/* Hybrid */}
                  <button
                    type="button"
                    onClick={() => setEventFormat('hybrid')}
                    className={`flex flex-col p-4 rounded-xl border text-left transition-all ${
                      eventFormat === 'hybrid'
                        ? 'border-primary bg-primary-soft/40 ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:bg-app-bg'
                    }`}
                  >
                    <Layers className={`h-5 w-5 mb-2 ${eventFormat === 'hybrid' ? 'text-primary' : 'text-text-secondary'}`} />
                    <span className="text-sm font-semibold text-text-primary">Hybrid</span>
                    <span className="text-[11px] text-text-secondary mt-0.5">Both in-person & stream</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Venue / Links Container */}
              <div className="space-y-4">
                {eventFormat !== 'online' && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor={venueNameId} className="mb-1.5 block text-xs font-semibold text-text-primary">
                        Venue Name <span className="text-status-danger">*</span>
                      </label>
                      <input
                        id={venueNameId}
                        type="text"
                        required
                        value={venueName}
                        onChange={(e) => setVenueName(e.target.value)}
                        placeholder="e.g. CS Building Hall A"
                        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                      />
                    </div>
                    <div>
                      <label htmlFor={venueAddressId} className="mb-1.5 block text-xs font-semibold text-text-primary">
                        Venue Address / Campus Location
                      </label>
                      <input
                        id={venueAddressId}
                        type="text"
                        value={venueAddress}
                        onChange={(e) => setVenueAddress(e.target.value)}
                        placeholder="e.g. 100 Innovation Way, Campus Tech Hub"
                        className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                      />
                    </div>
                  </div>
                )}

                {(eventFormat === 'online' || eventFormat === 'hybrid') && (
                  <div>
                    <label htmlFor={streamUrlId} className="mb-1.5 block text-xs font-semibold text-text-primary">
                      Virtual Meeting / Stream Link{' '}
                      <span className="text-text-secondary font-normal">
                        ({eventFormat === 'online' ? 'Required' : 'Optional'})
                      </span>
                    </label>
                    <input
                      id={streamUrlId}
                      type="text"
                      value={streamUrl}
                      onChange={(e) => setStreamUrl(e.target.value)}
                      placeholder="https://meet.campus.edu/cs-fastapi-react"
                      className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                    />
                    <p className="mt-1 text-[11px] text-text-secondary">
                      Attendees only receive this link after their registration is confirmed.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION D: Registration & Capacity */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Registration &amp; Capacity</h2>
                  <p className="text-xs text-text-secondary">Control room capacity and automated waitlist logic.</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Capacity Input */}
                <div className="max-w-md">
                  <label htmlFor={eventCapacityId} className="mb-1.5 block text-xs font-semibold text-text-primary">
                    Maximum attendees (Capacity) <span className="text-status-danger">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id={eventCapacityId}
                      type="number"
                      min={Math.max(1, registeredCount)}
                      max={5000}
                      required
                      value={capacity}
                      onChange={(e) => setCapacity(Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 pr-14 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs text-text-secondary">
                      Seats
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-text-secondary">
                    Set total seats available. Meetora safely manages registrations and triggers waitlist flows when limit is reached.
                  </p>
                </div>

                {/* Waitlist Switch */}
                <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-app-bg p-4">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <label htmlFor={waitlistToggleId} className="cursor-pointer text-xs font-semibold text-text-primary">
                        Enable waitlist when event is full
                      </label>
                      <p className="mt-0.5 text-[11px] text-text-secondary leading-relaxed">
                        When enabled, waitlisted students are automatically promoted in FIFO order if a registered attendee cancels.
                      </p>
                    </div>
                  </div>
                  <input
                    id={waitlistToggleId}
                    type="checkbox"
                    checked={enableWaitlist}
                    onChange={(e) => setEnableWaitlist(e.target.checked)}
                    className="h-5 w-5 rounded border-border text-primary focus:ring-primary-soft cursor-pointer mt-0.5"
                  />
                </div>

                {/* Registration Window Rule Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
                  <div className="rounded-lg border border-border bg-surface p-3.5">
                    <div className="mb-1 flex items-center gap-2">
                      <Timer className="h-4 w-4 text-text-secondary" />
                      <span className="text-xs font-semibold text-text-primary">Registration Deadline</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Closes automatically before event start so organizers have verified rosters.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-surface p-3.5">
                    <div className="mb-1 flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4 text-text-secondary" />
                      <span className="text-xs font-semibold text-text-primary">Eligibility</span>
                    </div>
                    <p className="text-[11px] text-text-secondary">
                      Open to all verified campus students, faculty, and registered club attendees.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION E: Event Cover Image */}
            <div className="rounded-xl border border-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] sm:p-7">
              <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">Event Cover Image</h2>
                  <p className="text-xs text-text-secondary">Recommended 16:9 ratio. Displayed on discovery cards and event banners.</p>
                </div>
              </div>

              {/* Image Preview Box */}
              <div className="space-y-4">
                <div className="relative aspect-video max-h-72 w-full overflow-hidden rounded-xl border border-border bg-app-bg group">
                  {imageUrl ? (
                    <img src={imageUrl} alt="Event Cover Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary">
                      No cover image selected
                    </div>
                  )}
                </div>

                {/* Preset image selection */}
                <div>
                  <label className="mb-2 block text-xs font-semibold text-text-primary">
                    Choose from campus presets or enter custom image URL:
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PRESET_COVERS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`rounded-lg border p-2 text-left transition-all ${
                          imageUrl === preset.url
                            ? 'border-primary bg-primary-soft/40 ring-1 ring-primary'
                            : 'border-border bg-surface hover:bg-app-bg'
                        }`}
                      >
                        <div className="h-14 w-full rounded overflow-hidden mb-1">
                          <img src={preset.url} alt={preset.name} className="h-full w-full object-cover" />
                        </div>
                        <p className="text-[11px] font-medium text-text-primary truncate">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div>
                  <label htmlFor={coverUrlId} className="mb-1 block text-xs text-text-secondary">Image URL</label>
                  <input
                    id={coverUrlId}
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sticky / Fixed Bottom Form Actions Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 px-4 py-4 backdrop-blur-md shadow-[0_-4px_16px_rgba(32,32,51,0.06)] lg:pl-64">
              <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Discard changes and return to My Events?')) {
                      navigate('/organizer/events');
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-transparent px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-app-bg transition-colors active:scale-[0.98] sm:w-auto"
                >
                  Cancel
                </button>

                <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-text-primary shadow-sm hover:bg-app-bg transition-all active:scale-[0.98] disabled:opacity-50 sm:flex-none"
                  >
                    <Bookmark className="h-4 w-4 text-text-secondary" />
                    <span>Save Draft</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-hover transition-all active:scale-[0.98] disabled:opacity-50 sm:flex-none"
                  >
                    <span>{isSubmitting ? 'Saving...' : 'Publish Event'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mx-auto mt-1 max-w-5xl text-center sm:text-right">
                <p className="text-[11px] text-text-secondary">
                  Published events immediately appear in the Explore Events catalog for student registrations.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </OrganizerLayout>
  );
}
