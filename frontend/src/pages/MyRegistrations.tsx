import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ApiError,
  cancelEventRegistration,
  getMyRegistrations,
  type Registration,
} from '@/lib/api';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRegistrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRegistrations(await getMyRegistrations());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load your registrations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRegistrations();
  }, [loadRegistrations]);

  const handleCancel = async (eventId: string) => {
    setCancellingId(eventId);
    setError(null);
    try {
      await cancelEventRegistration(eventId);
      await loadRegistrations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to cancel registration');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="page-shell flex-1 py-10 md:py-12">
      <div className="page-header">
        <h1 className="text-display-title-mobile md:text-display-title font-display-title text-text-primary">
          My Registrations
        </h1>
        <p className="text-body-md font-body-md text-text-secondary">
          Keep track of the events you have joined and your waitlist status.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-status-danger/30 bg-red-50 px-4 py-3 text-body-sm text-status-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-label="Loading registrations">
          {[1, 2].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </div>
      ) : registrations.length === 0 ? (
        <div className="surface-card px-6 py-16 text-center">
          <h2 className="text-section-title font-section-title font-bold text-text-primary">No registrations yet</h2>
          <p className="mt-2 text-body-md text-text-secondary">Explore events and reserve your place.</p>
          <Link to="/events" className="button-primary mt-6 px-5">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {registrations.map((registration) => (
            <article key={registration.id} className="surface-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-metadata-sm font-metadata-sm uppercase tracking-wider text-text-secondary">
                    {registration.status}
                  </span>
                  <h2 className="mt-1 text-card-title font-card-title font-semibold text-text-primary">
                    {registration.event?.title || 'Registered event'}
                  </h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-metadata-sm font-semibold ${
                  registration.status === 'waitlist'
                    ? 'border-status-warning/20 bg-status-warning-soft text-status-warning'
                    : 'border-status-success/20 bg-status-success-soft text-status-success'
                }`}>
                  {registration.status === 'waitlist' ? 'Waitlist' : 'Confirmed'}
                </span>
              </div>
              {registration.event && (
                <div className="mt-4 space-y-1 text-body-sm text-text-secondary">
                  <p>{formatDate(registration.event.start_time)} · {registration.event.location}</p>
                  <p>Ticket: <span className="font-medium text-text-primary">{registration.ticket_code}</span></p>
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to={`/events/${registration.event_id}`} className="button-secondary min-h-10 px-4 text-label-md">
                  View event
                </Link>
                <button
                  type="button"
                  disabled={cancellingId === registration.event_id}
                  onClick={() => void handleCancel(registration.event_id)}
                  className="button-secondary min-h-10 border-transparent px-4 text-label-md text-status-danger hover:border-transparent hover:bg-red-50 disabled:opacity-60"
                >
                  {cancellingId === registration.event_id ? 'Cancelling...' : 'Cancel registration'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
