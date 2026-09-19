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

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(true);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false);

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
            throw err;
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
    fetchEventData();
  }, [id]);

  const handleRegistration = async () => {
    if (!id) return;
    setRegistrationSubmitting(true);
    setRegistrationError(null);
    try {
      setRegistration(await registerForEvent(id));
      setEvent(await getEvent(id));
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
      setEvent(await getEvent(id));
    } catch (err) {
      setRegistrationError(err instanceof ApiError ? err.message : 'Unable to cancel registration');
    } finally {
      setRegistrationSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell min-h-screen flex-1 py-10">
        <div className="animate-pulse space-y-6" id="state-skeleton-container">
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
      <div className="page-shell min-h-screen flex-1 py-10">
        <div className="text-center py-20 bg-surface rounded-xl border border-border my-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">event_busy</span>
          </div>
          <h2 className="text-section-title font-section-title text-text-primary font-bold mb-2">Event Not Found</h2>
          <p className="text-body-md font-body-md text-text-secondary max-w-md mx-auto mb-6">
            {error || 'This event could not be found or may have been removed.'}
          </p>
          <button 
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary-container text-on-primary font-medium hover:bg-primary-hover transition-colors" 
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

  return (
    <div className="bg-app-bg text-text-primary min-h-screen flex flex-col font-body-sm antialiased selection:bg-primary-soft selection:text-primary">
      <div className="border-b border-border bg-surface py-2.5">
        <div className="page-shell flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap text-label-md font-label-md text-text-secondary">
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

      <main className="page-shell flex-1 py-8 sm:py-10">
        <div className="space-y-6">
          <section className="surface-card p-5 sm:p-8">
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
            
            <h1 className="text-display-title-mobile sm:text-display-title font-display-title text-text-primary mb-5">
              {event.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-y-3 gap-x-6 text-body-sm font-body-sm text-text-secondary pt-2 border-t border-border">
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

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-border bg-app-bg relative">
                {event.image_url ? (
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-border text-lg">No Image</div>
                )}
                {event.is_online && (
                  <div className="absolute bottom-3 left-3 bg-surface/90 backdrop-blur-sm border border-border px-3 py-1 rounded-md text-metadata-sm font-metadata-sm text-text-primary font-medium shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-status-success text-[16px]">sensors</span>
                    Hybrid In-Person &amp; Verified HD Stream
                  </div>
                )}
              </div>

              <section className="bg-surface rounded-xl border border-border p-6 sm:p-7 space-y-5">
                <div className="border-b border-border pb-3">
                  <h2 className="text-section-title font-section-title text-text-primary font-bold">About this event</h2>
                </div>
                <div className="space-y-4 text-body-md font-body-md text-text-primary leading-relaxed text-[16px]">
                  <p>{event.description}</p>
                </div>
              </section>

              <section className="bg-surface rounded-xl border border-border p-6 sm:p-7">
                <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                  <div>
                    <h2 className="text-section-title font-section-title text-text-primary font-bold">Venue &amp; Logistics</h2>
                  </div>
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
                      <p className="text-body-sm font-body-sm text-text-secondary mt-0.5 mb-2">Stream link issued upon registration.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-4 lg:sticky lg:top-20 lg:col-span-4">
              <div className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-metadata-sm font-metadata-sm text-text-secondary uppercase tracking-wider block">Admission</span>
                    <span className="text-[24px] font-bold text-text-primary leading-tight">Free</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-metadata-sm font-metadata-sm font-semibold bg-primary-soft text-primary border border-primary/20">
                    RSVP Required
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-metadata-sm font-metadata-sm">
                    <span className="font-medium text-text-primary">{event.registered_count} of {event.capacity} seats filled</span>
                    <span className="text-status-warning font-semibold">{event.capacity - event.registered_count} seats remaining</span>
                  </div>
                  <div className="w-full bg-border h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-status-danger' : 'bg-primary'}`} style={{ width: `${fillPercentage}%` }}></div>
                  </div>
                </div>

                <div className="space-y-3">
                  {registrationLoading ? (
                    <button disabled className="button-primary w-full py-3 text-card-title font-card-title">
                      Checking registration...
                    </button>
                  ) : registration ? (
                    <button type="button" disabled={registrationSubmitting} onClick={() => void handleCancellation()} className="button-secondary min-h-12 w-full border-status-danger text-status-danger hover:border-status-danger hover:bg-red-50 text-card-title font-card-title disabled:opacity-60">
                      {registrationSubmitting ? 'Cancelling...' : `Cancel ${registration.status === 'waitlist' ? 'waitlist' : 'registration'}`}
                    </button>
                  ) : isFull ? (
                    <button type="button" disabled={registrationSubmitting} onClick={() => void handleRegistration()} className="button-primary min-h-12 w-full bg-status-warning hover:bg-status-warning-hover text-card-title font-card-title">
                      <span className="material-symbols-outlined text-[20px]">hourglass_top</span>
                      {registrationSubmitting ? 'Joining...' : 'Join Waitlist'}
                    </button>
                  ) : (
                    <button type="button" disabled={registrationSubmitting} onClick={() => void handleRegistration()} className="button-primary min-h-12 w-full text-card-title font-card-title">
                      <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                      {registrationSubmitting ? 'Registering...' : 'Register for Event'}
                    </button>
                  )}
                  {registration && (
                    <p className="text-metadata-sm font-metadata-sm text-center text-status-success">
                      {registration.status === 'waitlist' ? 'You are on the waitlist.' : 'You are registered for this event.'}
                    </p>
                  )}
                  {registrationError && (
                    <p className="text-metadata-sm font-metadata-sm text-center text-status-danger" role="alert">
                      {registrationError}
                    </p>
                  )}
                  <p className="text-metadata-sm font-metadata-sm text-text-secondary text-center mt-2.5">
                    Instant confirmation. QR ticket issued directly upon registration.
                  </p>
                </div>

              </div>

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
    </div>
  );
}
