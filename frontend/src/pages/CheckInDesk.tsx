import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import OrganizerLayout from '@/components/layout/OrganizerLayout';
import {
  getEventAttendees,
  checkInAttendee,
  lookupAttendeesForCheckIn,
  type EventAttendeesOverview,
  type AttendeeItem,
  ApiError,
} from '@/lib/api';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  UserCheck,
  History,
  XCircle,
} from 'lucide-react';
import {
  StatCardSkeleton,
  ErrorAlert,
  Toast,
} from '@/components/SharedStates';

export default function CheckInDesk() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<EventAttendeesOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Mode
  const [searchMode, setSearchMode] = useState<'lookup' | 'code'>('lookup');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Active candidate & verification state
  const [candidate, setCandidate] = useState<AttendeeItem | null>(null);
  const [candidateLookupError, setCandidateLookupError] = useState<string | null>(null);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message?: string;
  } | null>(null);

  // Recent checked-in feed
  const [recentCheckIns, setRecentCheckIns] = useState<AttendeeItem[]>([]);

  const fetchOverview = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEventAttendees(eventId);
      setOverview(data);

      // Prepopulate recent check-ins with attendees who are checked in
      const checked = data.attendees
        .filter((a) => a.is_checked_in)
        .sort((a, b) => {
          const tA = a.checked_in_at ? new Date(a.checked_in_at).getTime() : 0;
          const tB = b.checked_in_at ? new Date(b.checked_in_at).getTime() : 0;
          return tB - tA;
        });
      setRecentCheckIns(checked.slice(0, 10));
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError('You do not have permission to manage check-ins for this event.');
        } else if (err.status === 404) {
          setError('Event not found.');
        } else {
          setError(err.message || 'Failed to initialize check-in desk.');
        }
      } else {
        setError('Failed to initialize check-in desk. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Search / Lookup handler
  const handleFindCandidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!eventId || !searchQuery.trim()) return;

    setCandidateLookupError(null);
    setIsSearching(true);

    try {
      const q = searchQuery.trim();

      // If in manual code mode, search exactly for code, or use lookup
      const matches = await lookupAttendeesForCheckIn(eventId, q);

      if (matches.length === 0) {
        setCandidate(null);
        setCandidateLookupError(`No matching registration found for "${q}". Verify the ticket code or spelling.`);
      } else {
        setCandidate(matches[0]);
      }
    } catch (err: unknown) {
      setCandidate(null);
      setCandidateLookupError(err instanceof Error ? err.message : 'Lookup failed. Please check the network.');
    } finally {
      setIsSearching(false);
    }
  };

  // Check In action
  const handleMarkCheckedIn = async () => {
    if (!eventId || !candidate || isSubmittingCheckIn) return;

    setIsSubmittingCheckIn(true);
    try {
      const resp = await checkInAttendee(eventId, candidate.ticket_code, candidate.id);

      if (resp.already_checked_in) {
        setToast({
          type: 'warning',
          title: 'Already Checked In',
          message: `${candidate.full_name} was already checked in earlier.`,
        });
      } else {
        setToast({
          type: 'success',
          title: 'Check-in Verified!',
          message: resp.message || `Successfully checked in ${candidate.full_name}.`,
        });
      }

      if (resp.attendee) {
        setCandidate(resp.attendee);

        // Add to recent feed (at the top, avoiding duplicates)
        setRecentCheckIns((prev) => [
          resp.attendee!,
          ...prev.filter((item) => item.id !== resp.attendee!.id),
        ]);

        // Update overview counters
        setOverview((prev) => {
          if (!prev) return null;
          const updatedAttendees = prev.attendees.map((a) =>
            a.id === resp.attendee!.id ? resp.attendee! : a
          );
          const newCheckedInCount = updatedAttendees.filter((a) => a.is_checked_in).length;
          return {
            ...prev,
            attendees: updatedAttendees,
            checked_in_count: newCheckedInCount,
          };
        });
      }
    } catch (err: unknown) {
      setToast({
        type: 'error',
        title: 'Check-in Failed',
        message: err instanceof Error ? err.message : 'Could not complete check-in.',
      });
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const handleClearCandidate = () => {
    setCandidate(null);
    setCandidateLookupError(null);
    setSearchQuery('');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AT';
  };

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return 'Just now';
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const confirmedCount = overview?.confirmed_count || 0;
  const checkedInCount = overview?.checked_in_count || 0;
  const remainingCount = Math.max(0, confirmedCount - checkedInCount);
  const capacity = overview?.capacity || 1;
  const attendanceRate = confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0;

  return (
    <OrganizerLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-20 right-6 z-50 max-w-md animate-in fade-in slide-in-from-top-4">
            <Toast
              type={toast.type}
              title={toast.title}
              message={toast.message}
              onClose={() => setToast(null)}
            />
          </div>
        )}

        {/* Breadcrumb & Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <nav className="flex items-center gap-2 text-xs font-medium text-text-secondary overflow-x-auto whitespace-nowrap">
            <Link to="/organizer/events" className="hover:text-primary transition-colors">
              My Events
            </Link>
            <span className="text-border">/</span>
            <span className="max-w-55 truncate text-text-secondary">
              {overview?.event_title || 'Event Desk'}
            </span>
            <span className="text-border">/</span>
            <span className="font-semibold text-text-primary">Check-in Desk</span>
          </nav>

          <button
            onClick={() => navigate(`/organizer/events/${eventId}/attendees`)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-app-bg hover:text-text-primary transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Attendees</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <ErrorAlert
            title="Desk Unavailable"
            message={error}
            onRetry={fetchOverview}
          />
        )}

        {/* Page Header with Live Badges */}
        {isLoading && !overview ? (
          <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
            <div className="h-6 w-1/3 animate-pulse rounded bg-border" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
          </div>
        ) : overview ? (
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                    Check-in Desk
                  </h1>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-status-success">
                    Published
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-status-info">
                    <span className="h-2 w-2 rounded-full bg-status-info animate-pulse" />
                    Live Desk Active
                  </span>
                </div>
                <p className="text-xs text-text-secondary">
                  Verify attendee registrations, validate ticket credentials, and record real-time attendance.
                </p>
              </div>

              {/* Event Context Strip */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary bg-app-bg p-3 rounded-lg border border-border">
                <span className="flex items-center gap-1.5 font-medium text-text-primary">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  {new Date(overview.start_time).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span className="hidden sm:inline text-border">•</span>
                <span className="flex items-center gap-1.5 font-medium text-text-primary">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {overview.is_online ? 'Online Video Stream' : overview.location || 'Campus Hall'}
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Top Metric Summary Strip */}
        {isLoading && !overview ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Checked In */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Checked In</span>
                <UserCheck className="h-4 w-4 text-status-success" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                  {checkedInCount}
                </span>
                <span className="text-xs font-semibold text-status-success bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {attendanceRate}% Rate
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-1.5 mt-2.5 overflow-hidden">
                <div
                  className="bg-status-success h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, attendanceRate)}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Confirmed */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed</span>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                  {confirmedCount}
                </span>
                <span className="text-xs text-text-secondary">Attendees</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-2">
                {Math.round((confirmedCount / capacity) * 100)}% of total capacity
              </p>
            </div>

            {/* Metric 3: Remaining */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Remaining</span>
                <Clock className="h-4 w-4 text-status-warning" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                  {remainingCount}
                </span>
                <span className="text-xs font-semibold text-status-warning bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Awaiting Arrival
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-2">
                Unclaimed seats prior to cutoff
              </p>
            </div>

            {/* Metric 4: Capacity */}
            <div className="rounded-xl border border-border bg-surface p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Capacity</span>
                <MapPin className="h-4 w-4 text-text-secondary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-bold text-text-primary">
                  {confirmedCount} / {capacity}
                </span>
                <span className="text-xs text-text-secondary">Seats</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-text-secondary">
                <span
                  className={`h-2 w-2 rounded-full ${
                    capacity - confirmedCount > 0 ? 'bg-status-success' : 'bg-status-danger'
                  }`}
                />
                <span>
                  {Math.max(0, capacity - confirmedCount)} unassigned seats
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main Operational Workspace Grid (Left 7 cols + Right 5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Action Station (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary">
                    Find Attendee &amp; Verify Ticket
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Lookup roster record by name/email or enter a ticket reference code.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 bg-primary-soft text-primary px-2.5 py-1 rounded text-xs font-semibold">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Instant Match</span>
                </div>
              </div>

              {/* Segmented Mode Switcher */}
              <div className="flex bg-app-bg p-1 rounded-lg border border-border mb-4 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => { setSearchMode('lookup'); }}
                  className={`flex-1 py-1.5 rounded transition-all ${
                    searchMode === 'lookup'
                      ? 'bg-surface text-primary shadow-xs font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Attendee Lookup (Name / Email)
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchMode('code'); }}
                  className={`flex-1 py-1.5 rounded transition-all ${
                    searchMode === 'code'
                      ? 'bg-surface text-primary shadow-xs font-semibold'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Manual Ticket Code (e.g. TKT-...)
                </button>
              </div>

              {/* Unified Search Form */}
              <form onSubmit={handleFindCandidate} className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      searchMode === 'lookup'
                        ? 'Search attendee name, campus email, or ticket...'
                        : 'Enter full ticket reference (e.g. TKT-F91A2B-CONF)...'
                    }
                    className="w-full h-11 pl-10 pr-24 rounded-lg border border-border bg-surface text-xs text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3.5 rounded-md bg-primary hover:bg-primary-hover text-white font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSearching ? (
                      <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    <span>Find</span>
                  </button>
                </div>
              </form>

              {/* Lookup Error Notice */}
              {candidateLookupError && (
                <div className="mb-4 p-3 rounded-lg border border-status-danger/30 bg-red-50 text-xs text-status-danger flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{candidateLookupError}</span>
                </div>
              )}

              {/* Verified Candidate Action Card */}
              {candidate ? (
                <div className="rounded-xl border-2 border-primary/40 bg-surface p-5 shadow-xs relative transition-all">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-base">
                        {getInitials(candidate.full_name)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-text-primary">
                          {candidate.full_name}
                        </h3>
                        <p className="text-xs text-text-secondary">{candidate.email}</p>
                      </div>
                    </div>

                    {candidate.status === 'waitlist' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-status-warning border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Waitlisted (Ineligible)</span>
                      </span>
                    ) : candidate.status === 'cancelled' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-status-danger border border-red-200 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" />
                        <span>Cancelled</span>
                      </span>
                    ) : candidate.is_checked_in ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-status-success border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Already Checked In</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-status-success border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Confirmed — Eligible</span>
                      </span>
                    )}
                  </div>

                  {/* Ticket Spec Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-app-bg p-3.5 rounded-lg border border-border mb-5 text-xs">
                    <div>
                      <span className="text-text-secondary block text-[11px]">
                        Registration Reference
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono font-bold text-text-primary">
                          {candidate.ticket_code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(candidate.ticket_code)}
                          className="text-text-secondary hover:text-primary transition-colors"
                          title="Copy ticket code"
                        >
                          {copiedCode ? (
                            <Check className="h-3.5 w-3.5 text-status-success" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-text-secondary block text-[11px]">
                        Assigned Format
                      </span>
                      <div className="font-medium text-text-primary mt-0.5">
                        {overview?.is_online ? 'Online Stream Pass' : 'In-Person Pass (General Access)'}
                      </div>
                    </div>

                    <div>
                      <span className="text-text-secondary block text-[11px]">
                        Registered Timestamp
                      </span>
                      <span className="font-medium text-text-primary mt-0.5 block">
                        {new Date(candidate.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-text-secondary block text-[11px]">
                        Identity Verification
                      </span>
                      <span className="text-status-success font-medium flex items-center gap-1 mt-0.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified Account
                      </span>
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {candidate.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={handleMarkCheckedIn}
                        disabled={isSubmittingCheckIn}
                        className={`w-full sm:flex-1 h-11 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99] ${
                          candidate.is_checked_in
                            ? 'bg-emerald-50 text-status-success border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-primary hover:bg-primary-hover text-white'
                        }`}
                      >
                        {isSubmittingCheckIn ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span>
                          {candidate.is_checked_in ? 'Verify / Confirm Again' : 'Mark as Checked In'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleClearCandidate}
                      className="w-full sm:w-auto px-4 h-11 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-app-bg text-xs font-medium transition-colors"
                    >
                      Clear Lookup
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-app-bg p-8 text-center text-xs text-text-secondary">
                  <QrCode className="h-8 w-8 text-text-secondary mx-auto mb-2 opacity-50" />
                  <p className="font-medium text-text-primary">Desk Lookup Ready</p>
                  <p className="mt-1">
                    Search attendee by name or paste a ticket code to inspect credentials and record check-in.
                  </p>
                </div>
              )}

              {/* Planned QR Scanner Callout */}
              <div className="mt-4 p-3.5 rounded-lg border border-dashed border-border bg-app-bg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-text-secondary">
                  <QrCode className="h-4 w-4 text-text-secondary" />
                  <span>Hardware Barcode / Camera QR Scanner integration</span>
                </div>
                <span className="text-[11px] font-semibold text-text-secondary bg-surface px-2 py-0.5 rounded border border-border">
                  Available in future release
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Audit Feed (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-text-primary">Recent Desk Check-ins</h2>
                </div>
                <span className="text-[11px] text-status-success font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-success animate-pulse" />
                  Live Audit
                </span>
              </div>

              {/* Chronological List */}
              <div className="space-y-3">
                {recentCheckIns.length > 0 ? (
                  recentCheckIns.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-border bg-app-bg hover:bg-surface transition-colors flex items-start justify-between gap-2"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-status-success flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-emerald-200">
                          {getInitials(item.full_name)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-xs text-text-primary truncate">
                              {item.full_name}
                            </p>
                            <span className="text-[10px] font-mono text-text-secondary">
                              {item.ticket_code}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary truncate">{item.email}</p>
                          <span className="inline-block mt-0.5 text-[10px] font-medium text-text-secondary">
                            Checked in at {formatTime(item.checked_in_at)}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-status-success border border-emerald-200 shrink-0">
                        Verified
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-text-secondary">
                    No attendees checked in yet for this session.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
}
