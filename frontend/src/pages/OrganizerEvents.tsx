import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Calendar as CalendarIcon,
  MapPin,
  MoreVertical,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  Share2,
  XCircle,
  QrCode,
  Edit,
} from 'lucide-react';
import OrganizerLayout from '@/components/layout/OrganizerLayout';
import {
  getOrganizerEvents,
  updateEventStatus,
  type OrganizerEvent,
} from '@/lib/api';

type TabStatus = 'all' | 'published' | 'draft' | 'completed' | 'cancelled';

function formatSchedule(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateStr = start.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const startTimeStr = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endTimeStr = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${dateStr} • ${startTimeStr} – ${endTimeStr}`;
}

export default function OrganizerEvents() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'upcoming' | 'recent'>('upcoming');

  // Menus & Modal state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [cancelModalEvent, setCancelModalEvent] = useState<OrganizerEvent | null>(null);
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrganizerEvents(undefined, undefined, sortOption);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizer events');
    } finally {
      setIsLoading(false);
    }
  }, [sortOption]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Tab counts calculation
  const counts = useMemo(() => {
    const now = new Date();
    let published = 0;
    let draft = 0;
    let completed = 0;
    let cancelled = 0;

    events.forEach((ev) => {
      const isPast = new Date(ev.end_time) < now;
      if (ev.status === 'Cancelled') {
        cancelled++;
      } else if (ev.status === 'Draft') {
        draft++;
      } else if (ev.status === 'Completed' || (isPast && ev.status !== 'Draft')) {
        completed++;
      } else if (ev.status === 'Published' || ev.status === 'Registration open' || ev.status === 'Full') {
        published++;
      }
    });

    return {
      all: events.length,
      published,
      draft,
      completed,
      cancelled,
    };
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    const now = new Date();
    return events.filter((ev) => {
      // Tab filter
      if (activeTab === 'published') {
        const isPublished =
          (ev.status === 'Published' || ev.status === 'Registration open' || ev.status === 'Full') &&
          new Date(ev.end_time) >= now;
        if (!isPublished) return false;
      } else if (activeTab === 'draft') {
        if (ev.status !== 'Draft') return false;
      } else if (activeTab === 'completed') {
        const isCompleted = ev.status === 'Completed' || (new Date(ev.end_time) < now && ev.status !== 'Draft' && ev.status !== 'Cancelled');
        if (!isCompleted) return false;
      } else if (activeTab === 'cancelled') {
        if (ev.status !== 'Cancelled') return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesDesc = ev.description.toLowerCase().includes(q);
        const matchesLoc = ev.location.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }

      return true;
    });
  }, [events, activeTab, searchQuery]);

  const handlePublish = async (eventId: string) => {
    setIsSubmittingStatus(true);
    try {
      await updateEventStatus(eventId, 'Published');
      await fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish event');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalEvent) return;
    setIsSubmittingStatus(true);
    try {
      await updateEventStatus(cancelModalEvent.id, 'Cancelled');
      setCancelModalEvent(null);
      await fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel event');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  return (
    <OrganizerLayout>
      <div className="mx-auto max-w-300 w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              My Events
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              View and manage the events you’ve created.
            </p>
          </div>
          <Link
            to="/organizer/events/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Create Event</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger">
            {error}
          </div>
        )}

        {/* Filters & Controls Bar */}
        <div className="mb-6 space-y-4">
          {/* Horizontal Status Tabs */}
          <div className="no-scrollbar flex items-center gap-6 overflow-x-auto border-b border-border text-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-1.5 whitespace-nowrap pb-3 font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>All Events</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  activeTab === 'all'
                    ? 'bg-primary-soft text-primary'
                    : 'border border-border bg-surface text-text-secondary'
                }`}
              >
                {counts.all}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`flex items-center gap-1.5 whitespace-nowrap pb-3 font-semibold transition-colors ${
                activeTab === 'published'
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Published</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  activeTab === 'published'
                    ? 'bg-primary-soft text-primary'
                    : 'border border-border bg-surface text-text-secondary'
                }`}
              >
                {counts.published}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('draft')}
              className={`flex items-center gap-1.5 whitespace-nowrap pb-3 font-semibold transition-colors ${
                activeTab === 'draft'
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Drafts</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  activeTab === 'draft'
                    ? 'bg-primary-soft text-primary'
                    : 'border border-border bg-surface text-text-secondary'
                }`}
              >
                {counts.draft}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-1.5 whitespace-nowrap pb-3 font-semibold transition-colors ${
                activeTab === 'completed'
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Completed</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  activeTab === 'completed'
                    ? 'bg-primary-soft text-primary'
                    : 'border border-border bg-surface text-text-secondary'
                }`}
              >
                {counts.completed}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('cancelled')}
              className={`flex items-center gap-1.5 whitespace-nowrap pb-3 font-semibold transition-colors ${
                activeTab === 'cancelled'
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>Cancelled</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                  activeTab === 'cancelled'
                    ? 'bg-primary-soft text-primary'
                    : 'border border-border bg-surface text-text-secondary'
                }`}
              >
                {counts.cancelled}
              </span>
            </button>
          </div>

          {/* Search & Sort Toolbar */}
          <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your events by title..."
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as 'upcoming' | 'recent')}
                  className="cursor-pointer appearance-none rounded-lg border border-border bg-surface py-2 pl-3 pr-8 text-sm text-text-primary focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="upcoming">Sort: Upcoming first</option>
                  <option value="recent">Sort: Recently created</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-text-secondary" />
              </div>
            </div>
          </div>
        </div>

        {/* Event Cards Stack */}
        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading your organizer events...
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
            <CalendarIcon className="mx-auto h-10 w-10 text-text-secondary/60" />
            <h3 className="mt-3 text-base font-semibold text-text-primary">No events found</h3>
            <p className="mt-1 text-xs text-text-secondary max-w-sm mx-auto">
              {searchQuery
                ? `No events match "${searchQuery}". Try a different keyword.`
                : activeTab !== 'all'
                ? `You have no ${activeTab} events right now.`
                : 'You have not created any events yet.'}
            </p>
            <div className="mt-4">
              <Link
                to="/organizer/events/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Event</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((ev) => {
              const now = new Date();
              const isPast = new Date(ev.end_time) < now;
              const isDraft = ev.status === 'Draft';
              const isCancelled = ev.status === 'Cancelled';
              const isCompleted = ev.status === 'Completed' || (isPast && !isDraft && !isCancelled);
              const isPublished = !isDraft && !isCancelled && !isCompleted;

              const cap = ev.capacity || 1;
              const pct = Math.min(100, Math.round((ev.registered_count / cap) * 100));

              return (
                <article
                  key={ev.id}
                  className="rounded-xl border border-border bg-surface p-5 lg:p-6 transition-all hover:border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                >
                  <div className="flex flex-col gap-5 md:flex-row">
                    {/* Event Cover Image */}
                    <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-primary-soft md:h-36 md:w-56">
                      {ev.image_url ? (
                        <img
                          src={ev.image_url}
                          alt={ev.title}
                          className={`h-full w-full object-cover ${isCompleted ? 'grayscale-25' : ''}`}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                          <CalendarIcon className="h-8 w-8 text-primary/40" />
                          <span className="mt-1 text-xs font-medium text-primary/70">{ev.category}</span>
                        </div>
                      )}
                      {/* Mobile Badge */}
                      <span
                        className={`absolute left-2 top-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold md:hidden ${
                          isPublished
                            ? 'border border-status-success/20 bg-status-success/15 text-status-success'
                            : isDraft
                            ? 'border border-amber-200 bg-amber-50 text-status-warning'
                            : isCompleted
                            ? 'border border-slate-200 bg-slate-100 text-slate-700'
                            : 'border border-red-200 bg-red-50 text-status-danger'
                        }`}
                      >
                        {isPublished ? 'Published' : isDraft ? 'Draft' : isCompleted ? 'Completed' : 'Cancelled'}
                      </span>
                    </div>

                    {/* Details Column */}
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`hidden md:inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isPublished
                                  ? 'border border-status-success/20 bg-status-success/15 text-status-success'
                                  : isDraft
                                  ? 'border border-amber-200 bg-amber-50 text-status-warning'
                                  : isCompleted
                                  ? 'border border-slate-200 bg-slate-100 text-slate-700'
                                  : 'border border-red-200 bg-red-50 text-status-danger'
                              }`}
                            >
                              {isPublished ? 'Published' : isDraft ? 'Draft' : isCompleted ? 'Completed' : 'Cancelled'}
                            </span>
                            {ev.waitlist_count > 0 && !isCancelled && (
                              <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                                {ev.waitlist_count} on waitlist
                              </span>
                            )}
                            {isDraft && (
                              <span className="text-xs text-text-secondary">Draft event</span>
                            )}
                            {isCompleted && (
                              <span className="text-xs text-text-secondary">Past event</span>
                            )}
                          </div>

                          {/* Options dropdown */}
                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === ev.id ? null : ev.id)}
                              aria-label="Event actions"
                              className="rounded p-1 text-text-secondary hover:bg-app-bg hover:text-text-primary transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {activeMenuId === ev.id && (
                              <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg">
                                <Link
                                  to={`/events/${ev.id}`}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:bg-app-bg transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Public page</span>
                                </Link>
                                <button
                                  onClick={() => {
                                    navigator.clipboard?.writeText?.(window.location.origin + `/events/${ev.id}`);
                                    alert('Public event URL copied to clipboard!');
                                    setActiveMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-xs text-text-secondary hover:bg-app-bg transition-colors"
                                >
                                  <Share2 className="h-3.5 w-3.5" />
                                  <span>Share link</span>
                                </button>
                                {!isCancelled && (
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      setCancelModalEvent(ev);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-xs text-status-danger hover:bg-red-50 transition-colors"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                    <span>Cancel event</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title */}
                        <h2 className="mb-2 text-lg font-bold text-text-primary">
                          <Link
                            to={`/organizer/events/${ev.id}/edit`}
                            className="hover:text-primary transition-colors"
                          >
                            {ev.title}
                          </Link>
                        </h2>

                        {/* Date & Location */}
                        <div className="mb-4 grid grid-cols-1 gap-x-4 gap-y-1.5 text-xs text-text-secondary sm:grid-cols-2">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-text-secondary shrink-0" />
                            <span>{formatSchedule(ev.start_time, ev.end_time)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-text-secondary shrink-0" />
                            <span>{ev.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Capacity / Status Indicator and Actions */}
                      <div className="flex flex-col justify-between gap-4 border-t border-border pt-3 sm:flex-row sm:items-center">
                        {/* Status bar */}
                        <div className="flex-1 max-w-sm">
                          {isDraft ? (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <span>Target Capacity: <strong className="text-text-primary">{ev.capacity} seats</strong></span>
                            </div>
                          ) : isCompleted ? (
                            <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                              <CheckCircle2 className="h-4 w-4 text-status-success" />
                              <span>
                                <strong className="text-text-primary">{ev.registered_count} attended</strong> of {ev.capacity} capacity
                              </span>
                            </div>
                          ) : isCancelled ? (
                            <div className="flex items-center gap-1.5 text-xs text-status-danger">
                              <XCircle className="h-4 w-4" />
                              <span>Event cancelled • Registration closed</span>
                            </div>
                          ) : (
                            <>
                              <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="font-medium text-text-primary">
                                  {ev.registered_count} / {ev.capacity} Seats Confirmed
                                </span>
                                <span className="font-semibold text-status-success">{pct}% capacity</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                                <div
                                  className="h-full rounded-full bg-status-success transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                          {isDraft ? (
                            <>
                              <Link
                                to={`/organizer/events/${ev.id}/edit`}
                                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
                              >
                                Edit Draft
                              </Link>
                              <button
                                onClick={() => handlePublish(ev.id)}
                                disabled={isSubmittingStatus}
                                className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-50"
                              >
                                Publish Event
                              </button>
                            </>
                          ) : isCompleted ? (
                            <Link
                              to={`/events/${ev.id}`}
                              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
                            >
                              View Details
                            </Link>
                          ) : isCancelled ? (
                            <Link
                              to={`/organizer/events/${ev.id}/edit`}
                              className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
                            >
                              Edit Event
                            </Link>
                          ) : (
                            <>
                              <Link
                                to={`/organizer/events/${ev.id}/edit`}
                                className="flex items-center gap-1.5 rounded-lg bg-primary-soft px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                              >
                                <QrCode className="h-4 w-4" />
                                <span>Check-in Desk</span>
                              </Link>
                              <Link
                                to={`/organizer/events/${ev.id}/edit`}
                                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
                              >
                                <Edit className="h-3.5 w-3.5 text-text-secondary" />
                                <span>Manage Event</span>
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancellation Modal Dialog */}
      {cancelModalEvent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl transform transition-all">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-status-danger">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Cancel this event?</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Are you sure you want to cancel{' '}
              <strong className="font-semibold text-text-primary">
                "{cancelModalEvent.title}"
              </strong>
              ? This will automatically notify registered attendees and close registration.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCancelModalEvent(null)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
              >
                Keep Event
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingStatus}
                className="rounded-lg bg-status-danger px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmittingStatus ? 'Cancelling...' : 'Cancel Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganizerLayout>
  );
}
