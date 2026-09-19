import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ApiError,
  cancelEventRegistration,
  getEvent,
  getEventRegistration,
  registerForEvent,
  type Event,
  type Registration,
} from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false);

  // Modals
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchEventData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, currentRegistration] = await Promise.all([
          getEvent(id),
          getEventRegistration(id).catch((err: unknown) => {
            if (err instanceof ApiError && err.status === 404) return null;
            return null;
          }),
        ]);
        setEvent(data);
        setRegistration(currentRegistration);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load event details');
      } finally {
        setLoading(false);
        setRegistrationLoading(false);
      }
    };
    void fetchEventData();
  }, [id]);

  const handleRegistration = async () => {
    if (!id) return;
    setRegistrationSubmitting(true);
    setRegistrationError(null);
    try {
      const reg = await registerForEvent(id);
      setRegistration(reg);
      const updatedEvent = await getEvent(id);
      setEvent(updatedEvent);
    } catch (err) {
      setRegistrationError(err instanceof ApiError ? err.message : 'Unable to complete registration');
    } finally {
      setRegistrationSubmitting(false);
    }
  };

  const handleCancellation = async () => {
    if (!id) return;
    setRegistrationSubmitting(true);
    setRegistrationError(null);
    try {
      await cancelEventRegistration(id);
      setRegistration(null);
      setShowCancelModal(false);
      const updatedEvent = await getEvent(id);
      setEvent(updatedEvent);
    } catch (err) {
      setRegistrationError(err instanceof ApiError ? err.message : 'Unable to cancel registration');
    } finally {
      setRegistrationSubmitting(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="page-shell min-h-screen flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-border/60 rounded-md w-1/3"></div>
          <div className="h-10 bg-border/60 rounded-md w-2/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <div className="aspect-video bg-border/50 rounded-xl"></div>
              <div className="h-32 bg-border/40 rounded-xl"></div>
              <div className="h-48 bg-border/40 rounded-xl"></div>
            </div>
            <div className="lg:col-span-4 space-y-4">
              <div className="h-72 bg-border/50 rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="page-shell min-h-screen flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center py-20 bg-surface rounded-xl border border-border my-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">event_busy</span>
          </div>
          <h2 className="text-section-title font-section-title text-text-primary font-bold mb-2">Event Not Found</h2>
          <p className="text-body-md font-body-md text-text-secondary max-w-md mx-auto mb-6">
            {error || 'This event could not be found or may have been removed.'}
          </p>
          <button 
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-medium hover:bg-primary-hover transition-colors text-body-sm" 
            onClick={() => navigate('/events')}
          >
            Return to Active Listing
          </button>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.start_time);
  const endDate = new Date(event.end_time);
  const deadline = event.registration_deadline ? new Date(event.registration_deadline) : null;
  const isFull = event.registered_count >= event.capacity;
  const fillPercentage = Math.min(100, Math.round((event.registered_count / event.capacity) * 100));
  const isWaitlist = registration?.status === 'waitlist';
  const isConfirmed = registration?.status === 'confirmed';

  return (
    <div className="bg-app-bg text-text-primary min-h-screen flex flex-col font-body-sm antialiased selection:bg-primary-soft selection:text-primary">
      {/* Breadcrumbs */}
      <div className="border-b border-border bg-surface py-2.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-label-md font-label-md text-text-secondary">
          <button className="hover:text-primary transition-colors flex items-center gap-1" onClick={() => navigate('/events')}>
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Explore Events</span>
          </button>
          <span className="text-border">/</span>
          <span className="text-text-secondary">{event.category}</span>
          <span className="text-border">/</span>
          <span className="text-text-primary font-medium truncate">{event.title}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 py-8 sm:py-10 w-full">
        <div className="space-y-6">
          {/* Header Card */}
          <section className="bg-surface rounded-xl border border-border p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md text-metadata-sm font-metadata-sm bg-app-bg text-text-secondary border border-border font-medium">
                {event.category}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-metadata-sm font-metadata-sm font-semibold border ${
                isFull 
                  ? 'bg-status-warning-soft text-status-warning border-status-warning/20' 
                  : 'bg-status-success-soft text-status-success border-status-success/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-status-warning' : 'bg-status-success'}`}></span>
                <span>{event.status}</span>
              </span>
              <span className="text-metadata-sm font-metadata-sm text-text-secondary ml-auto hidden sm:inline">
                Event ID: #{event.id.split('-')[0].toUpperCase()}
              </span>
            </div>
            
            <h1 className="text-display-title-mobile sm:text-display-title font-display-title text-text-primary mb-4">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-body-sm font-body-sm text-text-secondary pt-3 border-t border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary-soft text-primary font-bold flex items-center justify-center text-metadata-sm">
                  {event.host_logo_text || event.host_name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-text-primary font-medium">Hosted by {event.host_name}</span>
                <span className="material-symbols-outlined text-primary text-[18px]" title="Verified Campus Department">verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                <span className="text-text-primary">{startDate.toLocaleDateString()}</span>
                <span>•</span>
                <span>{startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                <span className="text-text-primary">{event.location}</span>
                {event.is_online && <span>+ Online Stream</span>}
              </div>
              {deadline && (
                <div className="flex items-center gap-1.5 text-status-warning font-medium">
                  <span className="material-symbols-outlined text-[18px]">alarm</span>
                  <span>Closes {deadline.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </section>

          {/* Grid Layout: Main Details + Sticky Registration CTA Sidebar */}
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Left Col (8) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Media Container */}
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-app-bg relative">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-border text-lg">No Image</div>
                )}
                {event.is_online && (
                  <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-xs border border-border px-3 py-1 rounded-md text-metadata-sm font-metadata-sm text-text-primary font-medium shadow-xs flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-status-success text-[16px]">sensors</span>
                    Hybrid In-Person &amp; Verified Stream
                  </div>
                )}
              </div>

              {/* Description */}
              <section className="bg-surface rounded-xl border border-border p-6 sm:p-7 space-y-4">
                <div className="border-b border-border pb-3">
                  <h2 className="text-section-title font-section-title text-text-primary font-bold">About this event</h2>
                </div>
                <div className="text-body-md font-body-md text-text-primary leading-relaxed">
                  <p>{event.description}</p>
                </div>
              </section>

              {/* Venue & Logistics */}
              <section className="bg-surface rounded-xl border border-border p-6 sm:p-7">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <h2 className="text-section-title font-section-title text-text-primary font-bold">Venue &amp; Logistics</h2>
                  <span className="material-symbols-outlined text-text-secondary text-[24px]">apartment</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-4 bg-app-bg/60">
                    <span className="text-metadata-sm font-metadata-sm uppercase font-bold text-text-secondary block mb-1">Location</span>
                    <div className="text-card-title font-card-title text-text-primary font-semibold">{event.location}</div>
                  </div>
                  {event.is_online && (
                    <div className="border border-border rounded-lg p-4 bg-app-bg/60">
                      <span className="text-metadata-sm font-metadata-sm uppercase font-bold text-text-secondary block mb-1">Online Access</span>
                      <div className="text-card-title font-card-title text-text-primary font-semibold">Live Stream</div>
                      <p className="text-body-sm font-body-sm text-text-secondary mt-0.5">Stream link available in your ticket registration.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Col (4): Sticky Registration Box (Matching Stitch P02) */}
            <div className="space-y-4 lg:sticky lg:top-20 lg:col-span-4">
              <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-metadata-sm font-metadata-sm text-text-secondary uppercase tracking-wider block">Admission</span>
                    <span className="text-[24px] font-bold text-text-primary leading-tight">Free</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-metadata-sm font-metadata-sm font-semibold bg-primary-soft text-primary border border-primary/20">
                    RSVP Required
                  </span>
                </div>

                {/* Capacity Gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-metadata-sm font-metadata-sm">
                    <span className="font-medium text-text-primary">{event.registered_count} of {event.capacity} seats filled</span>
                    <span className={`${isFull ? 'text-status-danger' : 'text-status-warning'} font-semibold`}>
                      {isFull ? 'Full capacity' : `${event.capacity - event.registered_count} seats remaining`}
                    </span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-status-danger' : 'bg-primary'}`} style={{ width: `${fillPercentage}%` }}></div>
                  </div>
                </div>

                {/* Registration Action Area */}
                <div className="space-y-3 pt-1">
                  {registrationLoading ? (
                    <button disabled className="w-full py-3 px-4 rounded-lg bg-border text-text-secondary font-medium flex items-center justify-center gap-2 cursor-not-allowed text-body-sm">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Checking registration status...
                    </button>
                  ) : isConfirmed ? (
                    /* State: User Confirmed */
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2.5 text-status-success text-body-sm font-medium">
                        <span className="material-symbols-outlined text-[20px]">check_circle</span>
                        <span>You are registered for this event!</span>
                      </div>
                      <div className="p-3 bg-app-bg border border-border rounded-lg flex items-center justify-between text-metadata-sm">
                        <span className="text-text-secondary">Ticket: <strong className="text-text-primary font-mono">{registration.ticket_code}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(registration.ticket_code)}
                          className="text-primary hover:text-primary-hover font-semibold underline text-xs"
                        >
                          {copiedCode ? 'Copied!' : 'Copy code'}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTicketModal(true)}
                        className="w-full py-2.5 px-4 bg-primary-soft text-primary hover:bg-primary hover:text-on-primary active:scale-[0.98] font-medium rounded-lg transition duration-150 flex items-center justify-center gap-2 border border-primary/20 text-body-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
                        View My QR Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-2 px-4 text-status-danger hover:bg-red-50 text-metadata-sm font-medium rounded transition duration-150"
                      >
                        Cancel Registration
                      </button>
                    </div>
                  ) : isWaitlist ? (
                    /* State: User Waitlisted */
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-status-warning text-body-sm font-medium">
                        <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                        <span>You are on the waitlist! Ticket: {registration.ticket_code}</span>
                      </div>
                      <p className="text-metadata-sm text-text-secondary">
                        If a registered attendee cancels, your ticket will be automatically confirmed.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-2 px-4 text-status-danger hover:bg-red-50 text-metadata-sm font-medium rounded transition duration-150"
                      >
                        Leave Waitlist
                      </button>
                    </div>
                  ) : isFull ? (
                    /* State: Not Registered & Event Full */
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={registrationSubmitting}
                        onClick={() => void handleRegistration()}
                        className="w-full py-3 px-4 bg-status-warning hover:bg-amber-700 text-white font-medium rounded-lg transition duration-150 flex items-center justify-center gap-2 active:scale-[0.98] text-card-title font-card-title shadow-xs disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                        {registrationSubmitting ? 'Joining Waitlist...' : 'Join Waitlist'}
                      </button>
                      <p className="text-metadata-sm text-text-secondary text-center">
                        Event is full. Joining waitlist reserves your queue position.
                      </p>
                    </div>
                  ) : (
                    /* State: Not Registered & Event Open */
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={registrationSubmitting}
                        onClick={() => void handleRegistration()}
                        className="w-full py-3 px-4 bg-primary-container hover:bg-primary-hover active:scale-[0.98] text-on-primary font-medium rounded-lg transition duration-150 flex items-center justify-center gap-2 shadow-xs text-card-title font-card-title disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                        {registrationSubmitting ? 'Registering...' : 'Register for Event'}
                      </button>
                      <p className="text-metadata-sm text-text-secondary text-center">
                        Instant confirmation. QR ticket issued directly upon registration.
                      </p>
                    </div>
                  )}

                  {registrationError && (
                    <div className="p-3 bg-red-50 border border-status-danger/30 rounded-lg text-metadata-sm text-status-danger" role="alert">
                      {registrationError}
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Badge */}
              <div className="p-4 rounded-xl border border-border bg-surface text-text-secondary text-metadata-sm font-metadata-sm space-y-1.5">
                <div className="flex items-center gap-1.5 text-text-primary font-semibold">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                  Campus Verification Guarantee
                </div>
                <p>
                  Managed under university student association charter. Attendance auto-syncs with your co-curricular record.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR TICKET MODAL */}
      {showTicketModal && registration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowTicketModal(false)}
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
                {event.title}
              </h3>
              <p className="text-body-sm text-text-secondary mt-1">
                Attendee: <span className="font-semibold text-text-primary">{user?.full_name}</span>
              </p>
            </div>

            {/* QR Mock Display */}
            <div className="p-6 bg-app-bg rounded-xl border border-border text-center space-y-3">
              <div className="w-44 h-44 mx-auto bg-surface p-3 rounded-lg border border-border flex items-center justify-center shadow-xs">
                <div className="w-full h-full border-4 border-text-primary flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-6 h-6 bg-text-primary" />
                    <div className="w-6 h-6 bg-text-primary" />
                  </div>
                  <div className="text-center font-mono text-[10px] font-bold text-text-primary">
                    {registration.ticket_code}
                  </div>
                  <div className="flex justify-between">
                    <div className="w-6 h-6 bg-text-primary" />
                    <div className="w-6 h-6 bg-text-primary" />
                  </div>
                </div>
              </div>
              <div className="font-mono text-sm font-bold text-text-primary">
                {registration.ticket_code}
              </div>
              <p className="text-metadata-sm text-text-secondary">
                Scan this code at event venue check-in desk
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border space-y-1.5 text-metadata-sm text-text-secondary">
              <div className="flex justify-between">
                <span>Date &amp; Time</span>
                <span className="font-medium text-text-primary">
                  {startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Location</span>
                <span className="font-medium text-text-primary">
                  {event.location}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => handleCopy(registration.ticket_code)}
                className="button-secondary flex-1 min-h-10 text-body-sm"
              >
                {copiedCode ? 'Copied Code!' : 'Copy Ticket Code'}
              </button>
              <button
                type="button"
                onClick={() => setShowTicketModal(false)}
                className="button-primary flex-1 min-h-10 text-body-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL REGISTRATION CONFIRMATION MODAL */}
      {showCancelModal && registration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl border border-border p-6 max-w-md w-full shadow-lg relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-status-danger flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">warning</span>
              </div>
              <div>
                <h3 className="text-section-title font-bold text-text-primary">
                  {isWaitlist ? 'Leave Waitlist?' : 'Cancel Registration?'}
                </h3>
                <p className="text-metadata-sm text-text-secondary">
                  Ticket Ref: {registration.ticket_code}
                </p>
              </div>
            </div>

            <p className="text-body-sm text-text-secondary mb-6">
              {isWaitlist
                ? 'Are you sure you want to leave the waitlist for this event? You will lose your queue position.'
                : 'Are you sure you want to cancel your place? Your reserved seat will be immediately released to attendees on the waitlist.'}
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={registrationSubmitting}
                onClick={() => setShowCancelModal(false)}
                className="button-secondary min-h-10 px-4 text-body-sm"
              >
                Keep {isWaitlist ? 'Waitlist' : 'Registration'}
              </button>
              <button
                type="button"
                disabled={registrationSubmitting}
                onClick={() => void handleCancellation()}
                className="px-4 py-2 rounded-lg bg-status-danger hover:bg-red-700 text-white font-medium text-body-sm transition-colors disabled:opacity-60"
              >
                {registrationSubmitting ? 'Processing...' : isWaitlist ? 'Confirm Leave' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
