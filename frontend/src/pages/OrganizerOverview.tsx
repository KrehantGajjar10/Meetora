import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Users,
  QrCode,
  Plus,
  ArrowRight,
  Clock,
  MapPin,
  Zap,
  ListFilter,
  ScanLine,
  ExternalLink,
} from 'lucide-react';
import OrganizerLayout from '@/components/layout/OrganizerLayout';
import {
  getOrganizerOverview,
  updateEventStatus,
  type OrganizerOverview as IOrganizerOverview,
} from '@/lib/api';

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

function formatRelativeTime(isoString: string) {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export default function OrganizerOverview() {
  const [overview, setOverview] = useState<IOrganizerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOrganizerOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organizer overview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getOrganizerOverview()
      .then((data) => {
        if (mounted) {
          setOverview(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load organizer overview');
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handlePublish = async (eventId: string) => {
    setPublishingId(eventId);
    try {
      await updateEventStatus(eventId, 'Published');
      await fetchOverview();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish event');
    } finally {
      setPublishingId(null);
    }
  };

  return (
    <OrganizerLayout>
      {/* Top Action Bar */}
      <header className="border-b border-border bg-surface px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
              Organizer Overview
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage your events, registrations, and attendee activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/organizer/events/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Event</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="mx-auto max-w-7xl p-4 sm:p-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Loading organizer workspace metrics...
            </div>
          </div>
        ) : overview ? (
          <>
            {/* Summary Metric Cards Grid */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Metric 1: Total Events */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-app-bg text-text-secondary">
                    <Calendar className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-text-primary">
                    {overview.total_events}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    {overview.published_events} active, {overview.draft_events} draft
                  </div>
                </div>
              </div>

              {/* Metric 2: Published Events */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-xs font-semibold uppercase tracking-wider">Published Events</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-status-success/20 bg-status-success/10 text-status-success">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-text-primary">
                    {overview.published_events}
                  </div>
                  <div className="mt-1 text-xs text-status-success font-medium">
                    Open for registration & waitlist
                  </div>
                </div>
              </div>

              {/* Metric 3: Total Registrations */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Registrations</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary-soft text-primary">
                    <Users className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-text-primary">
                    {overview.total_confirmed}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    {overview.total_confirmed} confirmed seats, {overview.total_waitlist} on waitlist
                  </div>
                </div>
              </div>

              {/* Metric 4: Checked-in Attendees */}
              <div className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between text-text-secondary">
                  <span className="text-xs font-semibold uppercase tracking-wider">Checked-in Attendees</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-status-info/20 bg-status-info/10 text-status-info">
                    <QrCode className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-text-primary">
                    {overview.total_checked_in}
                  </div>
                  <div className="mt-1 text-xs text-text-secondary">
                    Active check-in verification log
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Operations Bar */}
            <section className="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-border bg-surface p-5 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">Quick Operations</p>
                  <p className="text-xs text-text-secondary">Frequently accessed organizer tooling & event shortcuts</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to="/organizer/events/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Event</span>
                </Link>
                <Link
                  to="/organizer/events"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
                >
                  <ListFilter className="h-4 w-4 text-text-secondary" />
                  <span>View My Events</span>
                </Link>
                <Link
                  to="/organizer/events"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
                >
                  <ScanLine className="h-4 w-4 text-text-secondary" />
                  <span>Scan & Check-in Desk</span>
                </Link>
              </div>
            </section>

            {/* Main Workbench: Upcoming Events (2 cols) + Recent Activity Feed (1 col) */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
              {/* Upcoming Events Section (Left 2 cols) */}
              <section className="space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Upcoming Events</h2>
                    <p className="text-xs text-text-secondary">Manage registrations, venues, and status</p>
                  </div>
                  <Link
                    to="/organizer/events"
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover"
                  >
                    <span>View all events ({overview.total_events})</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {overview.upcoming_events.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
                    <p className="text-sm font-medium text-text-primary">No upcoming events found</p>
                    <p className="mt-1 text-xs text-text-secondary">Create a new event or publish a draft to get started.</p>
                    <Link
                      to="/organizer/events/new"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white"
                    >
                      <Plus className="h-4 w-4" />
                      Create Event
                    </Link>
                  </div>
                ) : (
                  overview.upcoming_events.map((ev) => {
                    const isDraft = ev.status === 'Draft';
                    const cap = ev.capacity || 1;
                    const pct = Math.min(100, Math.round((ev.registered_count / cap) * 100));

                    return (
                      <article
                        key={ev.id}
                        className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-outline-variant shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                      >
                        <div className="flex flex-col justify-between gap-2.5 sm:flex-row sm:items-start">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ${
                                  isDraft
                                    ? 'bg-status-warning/15 text-status-warning border-status-warning/30'
                                    : 'bg-status-success/15 text-status-success border-status-success/30'
                                }`}
                              >
                                {isDraft ? 'Draft' : 'Published'}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-text-secondary">
                                <Clock className="h-3.5 w-3.5" />
                                {formatSchedule(ev.start_time, ev.end_time)}
                              </span>
                            </div>
                            <h3 className="pt-1 text-base font-bold text-text-primary">
                              <Link
                                to={`/events/${ev.id}`}
                                className="hover:text-primary transition-colors inline-flex items-center gap-1.5"
                              >
                                <span>{ev.title}</span>
                                <ExternalLink className="h-3.5 w-3.5 text-text-secondary" />
                              </Link>
                            </h3>
                            <p className="flex items-center gap-1 text-xs text-text-secondary">
                              <MapPin className="h-3.5 w-3.5" />
                              {ev.location}
                            </p>
                          </div>
                        </div>

                        {/* Capacity & Progress */}
                        <div className="mt-4 border-t border-border pt-3">
                          {isDraft ? (
                            <div className="flex items-center justify-between text-xs text-text-secondary">
                              <span>
                                Target Capacity: <strong className="text-text-primary">{ev.capacity} seats</strong> (Registration not open)
                              </span>
                              <span className="italic">Unpublished</span>
                            </div>
                          ) : (
                            <>
                              <div className="mb-1.5 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-text-primary">
                                    {ev.registered_count} / {ev.capacity} Seats Confirmed
                                  </span>
                                  <span className="font-medium text-status-success">({pct}% capacity)</span>
                                </div>
                                {ev.waitlist_count > 0 && (
                                  <span className="font-medium text-status-warning">
                                    {ev.waitlist_count} on waitlist
                                  </span>
                                )}
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

                        {/* Actions Bottom Bar */}
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                          <div className="text-xs text-text-secondary">
                            {isDraft ? 'Saved as draft' : `Updated ${formatRelativeTime(ev.updated_at || ev.created_at)}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={isDraft ? `/organizer/events/${ev.id}/edit` : `/organizer/events/${ev.id}/attendees`}
                              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary transition-colors hover:bg-app-bg"
                            >
                              {isDraft ? 'Edit Draft' : 'Manage Attendees'}
                            </Link>
                            {isDraft ? (
                              <button
                                onClick={() => handlePublish(ev.id)}
                                disabled={publishingId === ev.id}
                                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                              >
                                {publishingId === ev.id ? 'Publishing...' : 'Publish Event'}
                              </button>
                            ) : (
                              <Link
                                to={`/organizer/events/${ev.id}/checkin`}
                                className="flex items-center gap-1 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                              >
                                <QrCode className="h-3.5 w-3.5" />
                                <span>Check-in Desk</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </section>

              {/* Attendee Activity Section (Right 1 col) */}
              <section className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Attendee Activity</h2>
                  <p className="text-xs text-text-secondary">Recent ledger records & desk verification</p>
                </div>

                <div className="divide-y divide-border rounded-xl border border-border bg-surface p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  {overview.recent_activity.length === 0 ? (
                    <div className="py-6 text-center text-xs text-text-secondary">
                      No attendee registrations yet for your events.
                    </div>
                  ) : (
                    overview.recent_activity.map((item) => (
                      <div key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            item.status === 'confirmed'
                              ? 'bg-status-success/15 text-status-success'
                              : item.status === 'waitlist'
                              ? 'bg-status-warning/15 text-status-warning'
                              : 'bg-status-danger/15 text-status-danger'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-text-primary leading-relaxed">
                            <span className="font-semibold">{item.user_name}</span>{' '}
                            {item.status === 'confirmed' ? (
                              <span>registered for </span>
                            ) : item.status === 'waitlist' ? (
                              <span>joined waitlist for </span>
                            ) : (
                              <span>cancelled registration for </span>
                            )}
                            <span className="font-medium text-text-primary">{item.event_title}</span>.
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-secondary">
                            {formatRelativeTime(item.created_at)} • Ticket: {item.ticket_code}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </OrganizerLayout>
  );
}
