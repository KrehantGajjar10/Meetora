import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ApiError,
  cancelEventRegistration,
  getMyRegistrations,
  type Registration,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

type TabType = 'upcoming' | 'past' | 'all';

function formatEventDate(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatEventTime(value: string) {
  const d = new Date(value);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MyRegistrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states
  const [ticketModalRegistration, setTicketModalRegistration] = useState<Registration | null>(null);
  const [cancelModalRegistration, setCancelModalRegistration] = useState<Registration | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchRegistrations = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getMyRegistrations();
      setRegistrations(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getMyRegistrations()
      .then((data) => {
        if (mounted) setRegistrations(data);
      })
      .catch((err: unknown) => {
        if (mounted) setError(err instanceof ApiError ? err.message : 'Failed to load your registrations');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);


  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalRegistration) return;
    setCancelling(true);
    try {
      await cancelEventRegistration(cancelModalRegistration.event_id);
      setCancelModalRegistration(null);
      await fetchRegistrations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel registration');
    } finally {
      setCancelling(false);
    }
  };

  const now = new Date();
  const upcomingList = registrations.filter((r) => {
    if (!r.event) return true;
    return new Date(r.event.end_time || r.event.start_time) >= now;
  });
  const pastList = registrations.filter((r) => {
    if (!r.event) return false;
    return new Date(r.event.end_time || r.event.start_time) < now;
  });

  const displayedList =
    activeTab === 'upcoming'
      ? upcomingList
      : activeTab === 'past'
      ? pastList
      : registrations;

  return (
    <main className="page-shell flex-1 py-8 md:py-10 max-w-6xl w-full mx-auto px-4 sm:px-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 mb-6 border-b border-border">
        <div>
          <h1 className="text-display-title-mobile md:text-display-title font-display-title text-text-primary">
            My Registrations
          </h1>
          <p className="text-body-sm font-body-sm text-text-secondary mt-1">
            View your event registrations, tickets, and attendance status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/events"
            className="inline-flex items-center gap-1.5 text-label-md font-label-md text-primary hover:text-primary-hover font-semibold transition-colors duration-150"
          >
            <span className="material-symbols-outlined text-lg">explore</span> Explore events
          </Link>
        </div>
      </div>

      {/* Segmented Filter Tabs */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="inline-flex p-1 bg-surface border border-border rounded-xl shadow-xs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'upcoming'}
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-all duration-150 ${
              activeTab === 'upcoming'
                ? 'font-semibold bg-primary-soft text-primary shadow-xs'
                : 'font-medium text-text-secondary hover:text-text-primary'
            }`}
          >
            Upcoming ({upcomingList.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'past'}
            onClick={() => setActiveTab('past')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-all duration-150 ${
              activeTab === 'past'
                ? 'font-semibold bg-primary-soft text-primary shadow-xs'
                : 'font-medium text-text-secondary hover:text-text-primary'
            }`}
          >
            Past ({pastList.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-label-md font-label-md transition-all duration-150 ${
              activeTab === 'all'
                ? 'font-semibold bg-primary-soft text-primary shadow-xs'
                : 'font-medium text-text-secondary hover:text-text-primary'
            }`}
          >
            All ({registrations.length})
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-xl border border-status-danger/30 bg-red-50 p-4 text-body-sm text-status-danger flex items-center justify-between" role="alert">
          <span>{error}</span>
          <button onClick={() => void fetchRegistrations()} className="underline font-medium hover:text-red-800">
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton Feed */}
      {loading ? (
        <div className="space-y-4" aria-label="Loading registrations">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden p-6 animate-pulse flex flex-col lg:flex-row gap-6">
              <div className="lg:w-72 w-full h-44 bg-border/50 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-border/60 rounded w-1/4" />
                <div className="h-7 bg-border/70 rounded w-3/4" />
                <div className="h-4 bg-border/40 rounded w-1/2" />
                <div className="h-16 bg-border/30 rounded-lg mt-4" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border px-6 py-16 text-center max-w-xl mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">confirmation_number</span>
          </div>
          <h2 className="text-section-title font-section-title font-bold text-text-primary">
            {activeTab === 'past' ? 'No past registrations' : 'No registrations yet'}
          </h2>
          <p className="mt-2 text-body-md text-text-secondary max-w-sm mx-auto">
            {activeTab === 'past'
              ? 'You have not attended any completed events yet.'
              : 'Explore campus events and workshops to reserve your seat or join the waitlist.'}
          </p>
          <Link to="/events" className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-medium hover:bg-primary-hover transition-colors mt-6 text-body-sm">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="space-y-4" id="registrations-list">
          {displayedList.map((registration) => {
            const event = registration.event;
            const isWaitlist = registration.status === 'waitlist';

            return (
              <article
                key={registration.id}
                className="bg-surface rounded-xl border border-border overflow-hidden hover:border-text-secondary/40 transition-colors duration-150 shadow-none"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left Media/Thumbnail */}
                  <div className="lg:w-72 w-full shrink-0 relative bg-primary-soft overflow-hidden h-48 lg:h-auto min-h-47.5">
                    {event?.image_url ? (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary text-sm">
                        No Event Image
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      {isWaitlist ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-metadata-sm font-metadata-sm font-semibold bg-amber-50 text-status-warning border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-warning"></span>
                          Waitlisted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-metadata-sm font-metadata-sm font-semibold bg-emerald-50 text-status-success border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                          Confirmed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-5 lg:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Host & Category */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {event && (
                          <span className="inline-block text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-primary-soft text-primary">
                            {event.category}
                          </span>
                        )}
                        {event?.host_name && (
                          <>
                            <span className="text-metadata-sm font-metadata-sm text-text-secondary">•</span>
                            <span className="text-metadata-sm font-metadata-sm text-text-secondary font-medium">
                              Hosted by {event.host_name}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Event Title */}
                      <h2 className="text-section-title font-section-title text-text-primary mb-2 hover:text-primary transition-colors cursor-pointer">
                        <Link to={`/events/${registration.event_id}`}>
                          {event?.title || 'Registered Event'}
                        </Link>
                      </h2>

                      {/* Logistics Grid */}
                      {event && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-4 text-body-sm font-body-sm text-text-secondary">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary text-base shrink-0">calendar_today</span>
                            <span>
                              {formatEventDate(event.start_time)} • {formatEventTime(event.start_time)}
                              {event.end_time && ` – ${formatEventTime(event.end_time)}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-text-secondary text-base shrink-0">location_on</span>
                            <span className="truncate">{event.location}</span>
                          </div>
                        </div>
                      )}

                      {/* Ticket Reference Box */}
                      {isWaitlist ? (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span className="material-symbols-outlined text-status-warning text-xl shrink-0 mt-0.5">hourglass_top</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-label-md font-label-md text-status-warning">
                                  Waitlist Ticket:
                                </span>
                                <span className="font-mono text-label-md font-semibold text-text-primary">
                                  {registration.ticket_code}
                                </span>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover font-medium underline-offset-2 hover:underline ml-1"
                                  onClick={() => handleCopy(registration.ticket_code)}
                                  title="Copy code"
                                >
                                  {copiedCode === registration.ticket_code ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                              <p className="text-[12px] text-text-secondary mt-0.5">
                                You are queued. You will be automatically confirmed if a seat opens.
                              </p>
                            </div>
                          </div>
                          {event && (
                            <span className="text-[11px] px-2 py-0.5 bg-amber-100/70 text-amber-800 rounded font-medium shrink-0 hidden sm:inline-block">
                              Capacity {event.capacity}/{event.capacity}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-app-bg rounded-lg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-surface border border-border flex items-center justify-center text-primary shrink-0">
                              <span className="material-symbols-outlined text-lg">qr_code_2</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-metadata-sm font-metadata-sm text-text-secondary uppercase">
                                  Ticket Ref:
                                </span>
                                <span className="text-label-md font-label-md font-semibold text-text-primary">
                                  {registration.ticket_code}
                                </span>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary-hover font-medium underline-offset-2 hover:underline ml-1"
                                  onClick={() => handleCopy(registration.ticket_code)}
                                  title="Copy code"
                                >
                                  {copiedCode === registration.ticket_code ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                              <p className="text-[12px] text-text-secondary mt-0.5">
                                Instant QR verification available at check-in
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center self-start sm:self-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            Seat Reserved
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setCancelModalRegistration(registration)}
                        className="text-body-sm font-body-sm text-text-secondary hover:text-status-danger underline-offset-2 hover:underline transition-colors duration-150"
                      >
                        Cancel registration
                      </button>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/events/${registration.event_id}`}
                          className="px-3.5 py-1.5 rounded-lg border border-border text-text-primary font-label-md hover:bg-app-bg hover:border-outline transition-colors"
                        >
                          View Details
                        </Link>
                        {!isWaitlist && (
                          <button
                            type="button"
                            onClick={() => setTicketModalRegistration(registration)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-body-sm font-body-sm font-medium bg-primary hover:bg-primary-hover text-on-primary transition-colors duration-150 active:scale-[0.98]"
                          >
                            <span className="material-symbols-outlined text-lg">confirmation_number</span>
                            View Ticket
                          </button>
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

      {/* QR TICKET MODAL */}
      {ticketModalRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setTicketModalRegistration(null)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-app-bg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center pt-2 pb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-metadata-sm font-semibold bg-emerald-50 text-status-success border border-emerald-200 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                Confirmed Admission Ticket
              </span>
              <h3 className="text-section-title font-bold text-text-primary">
                {ticketModalRegistration.event?.title || 'Meetora Event Ticket'}
              </h3>
              <p className="text-body-sm text-text-secondary mt-1">
                Attendee: <span className="font-semibold text-text-primary">{user?.full_name}</span>
              </p>
            </div>

            {/* QR Mock Display */}
            <div className="p-6 bg-app-bg rounded-xl border border-border text-center space-y-3">
              <div className="w-44 h-44 mx-auto bg-surface p-3 rounded-lg border border-border flex items-center justify-center shadow-xs">
                {/* Visual QR representation */}
                <div className="w-full h-full border-4 border-text-primary flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 bg-text-primary" />
                    <div className="w-6 h-6 bg-text-primary" />
                  </div>
                  <div className="text-center font-mono text-[10px] font-bold text-text-primary">
                    {ticketModalRegistration.ticket_code}
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 bg-text-primary" />
                    <div className="w-6 h-6 bg-text-primary" />
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm font-bold text-text-primary">
                {ticketModalRegistration.ticket_code}
              </div>
              <p className="text-metadata-sm text-text-secondary">
                Scan this code at event venue check-in desk
              </p>
            </div>

            {/* Ticket Info */}
            {ticketModalRegistration.event && (
              <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-metadata-sm text-text-secondary">
                <div className="flex justify-between">
                  <span>Date &amp; Time</span>
                  <span className="font-medium text-text-primary">
                    {formatEventDate(ticketModalRegistration.event.start_time)} • {formatEventTime(ticketModalRegistration.event.start_time)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Location</span>
                  <span className="font-medium text-text-primary">
                    {ticketModalRegistration.event.location}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => handleCopy(ticketModalRegistration.ticket_code)}
                className="button-secondary flex-1 min-h-10 text-body-sm"
              >
                {copiedCode === ticketModalRegistration.ticket_code ? 'Copied Code!' : 'Copy Ticket Code'}
              </button>
              <button
                type="button"
                onClick={() => setTicketModalRegistration(null)}
                className="button-primary flex-1 min-h-10 text-body-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION MODAL */}
      {cancelModalRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-status-danger flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-section-title font-bold text-text-primary">
                  Cancel Registration?
                </h3>
                <p className="text-metadata-sm text-text-secondary">
                  Ticket Ref: {cancelModalRegistration.ticket_code}
                </p>
              </div>
            </div>

            <p className="text-body-sm text-text-secondary mb-6">
              Are you sure you want to cancel your place for{' '}
              <strong className="text-text-primary">
                {cancelModalRegistration.event?.title || 'this event'}
              </strong>
              ? If you cancel, your seat will be immediately released to attendees on the waitlist.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModalRegistration(null)}
                className="button-secondary min-h-10 px-4 text-body-sm"
              >
                Keep Registration
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={() => void handleConfirmCancel()}
                className="px-4 py-2 rounded-lg bg-status-danger hover:bg-red-700 text-white font-medium text-body-sm transition-colors disabled:opacity-60"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
