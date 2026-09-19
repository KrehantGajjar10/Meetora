import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import OrganizerLayout from '@/components/layout/OrganizerLayout';
import {
  getEventAttendees,
  toggleAttendeeCheckin,
  type EventAttendeesOverview,
  type AttendeeItem,
  ApiError,
} from '@/lib/api';
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  Clock,
  QrCode,
  Edit,
  ArrowLeft,
  X,
  Copy,
  Check,
  RotateCcw,
  Mail,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Calendar,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import {
  StatCardSkeleton,
  TableSkeleton,
  EmptyState,
  ErrorAlert,
  Toast,
} from '@/components/SharedStates';

export default function EventManagement() {
  const { id: eventId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<EventAttendeesOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'waitlist' | 'checked_in' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Selected Attendee for Drawer
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeItem | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isTogglingCheckin, setIsTogglingCheckin] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; title: string; message?: string } | null>(null);

  const fetchOverview = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEventAttendees(eventId);
      setOverview(data);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError('You do not have permission to manage attendees for this event.');
        } else if (err.status === 404) {
          setError('Event not found.');
        } else {
          setError(err.message || 'Failed to load attendee roster.');
        }
      } else {
        setError('Failed to load attendee roster. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Copy ticket code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Toggle check-in from table or drawer
  const handleToggleCheckin = async (attendee: AttendeeItem) => {
    if (!eventId || isTogglingCheckin) return;
    try {
      setIsTogglingCheckin(true);
      const updated = await toggleAttendeeCheckin(eventId, attendee.id);

      // Update local state
      setOverview((prev) => {
        if (!prev) return null;
        const updatedAttendees = prev.attendees.map((a) =>
          a.id === updated.id ? updated : a
        );
        const newCheckedInCount = updatedAttendees.filter((a) => a.is_checked_in).length;
        return {
          ...prev,
          attendees: updatedAttendees,
          checked_in_count: newCheckedInCount,
        };
      });

      if (selectedAttendee?.id === updated.id) {
        setSelectedAttendee(updated);
      }

      setToast({
        type: 'success',
        title: updated.is_checked_in ? 'Attendee Checked In' : 'Check-in Reverted',
        message: `${updated.full_name} is now marked as ${updated.is_checked_in ? 'checked in' : 'not checked in'}.`,
      });
    } catch (err: unknown) {
      setToast({
        type: 'error',
        title: 'Check-in update failed',
        message: err instanceof Error ? err.message : 'Please try again',
      });
    } finally {
      setIsTogglingCheckin(false);
    }
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    if (!overview || overview.attendees.length === 0) return;

    const headers = ['Full Name', 'Email', 'Registration Status', 'Ticket Code', 'Checked In', 'Checked In At', 'Registered Date'];
    const rows = overview.attendees.map((a) => [
      `"${a.full_name.replace(/"/g, '""')}"`,
      `"${a.email.replace(/"/g, '""')}"`,
      a.status,
      a.ticket_code,
      a.is_checked_in ? 'YES' : 'NO',
      a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : 'N/A',
      new Date(a.created_at).toLocaleString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${overview.event_title.replace(/\s+/g, '_')}_Attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast({
      type: 'info',
      title: 'Roster Exported',
      message: `Downloaded CSV export for ${overview.attendees.length} attendees.`,
    });
  };

  // Filtered attendees for the table
  const filteredAttendees = useMemo(() => {
    if (!overview) return [];
    let list = overview.attendees;

    // Status tab filter
    if (activeTab === 'confirmed') {
      list = list.filter((a) => a.status === 'confirmed');
    } else if (activeTab === 'waitlist') {
      list = list.filter((a) => a.status === 'waitlist');
    } else if (activeTab === 'checked_in') {
      list = list.filter((a) => a.is_checked_in);
    } else if (activeTab === 'cancelled') {
      list = list.filter((a) => a.status === 'cancelled');
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.full_name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.ticket_code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [overview, activeTab, searchQuery]);

  // Paginated list
  const totalPages = Math.ceil(filteredAttendees.length / pageSize) || 1;
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAttendees.slice(start, start + pageSize);
  }, [filteredAttendees, currentPage]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AT';
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

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

        {/* Top Breadcrumb & Return Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <nav className="flex items-center gap-2 text-xs font-medium text-text-secondary overflow-x-auto whitespace-nowrap">
            <Link to="/organizer/events" className="hover:text-primary transition-colors">
              My Events
            </Link>
            <span className="text-border">/</span>
            <span className="max-w-65 truncate text-text-secondary">
              {overview?.event_title || 'Event Roster'}
            </span>
            <span className="text-border">/</span>
            <span className="font-semibold text-text-primary">Attendees</span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/organizer/events')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-app-bg hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to My Events</span>
            </button>
            {eventId && (
              <Link
                to={`/events/${eventId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-app-bg hover:text-text-primary transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Public Page</span>
              </Link>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <ErrorAlert
            title="Unable to load attendees"
            message={error}
            onRetry={fetchOverview}
          />
        )}

        {/* Header with Event Summary & Fast Navigation */}
        {isLoading && !overview ? (
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded bg-border" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-border" />
          </div>
        ) : overview ? (
          <div className="rounded-xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
                    {overview.event_title}
                  </h1>
                  <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-status-success">
                    {overview.event_status}
                  </span>
                  {overview.is_online ? (
                    <span className="rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-status-info">
                      Online Event
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary-soft border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      In-Person
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-text-secondary" />
                    {new Date(overview.start_time).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-text-secondary" />
                    {overview.location || 'Location TBA'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-text-secondary" />
                    Capacity: {overview.capacity} seats
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  to={`/organizer/events/${overview.event_id}/checkin`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover active:scale-[0.98]"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Open Check-in Desk</span>
                </Link>
                <Link
                  to={`/organizer/events/${overview.event_id}/edit`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-primary hover:bg-app-bg transition-colors"
                >
                  <Edit className="h-3.5 w-3.5 text-text-secondary" />
                  <span>Edit Event</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {/* 4 Metric Summary Cards */}
        {isLoading && !overview ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : overview ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Confirmed Seats */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Confirmed Seats</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                    {overview.confirmed_count}
                  </span>
                  <span className="text-xs text-text-secondary">/ {overview.capacity} capacity</span>
                </div>
                <div className="w-full bg-border rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((overview.confirmed_count / (overview.capacity || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mt-2">
                {Math.min(100, Math.round((overview.confirmed_count / (overview.capacity || 1)) * 100))}% seats booked
              </p>
            </div>

            {/* Metric 2: FIFO Waitlist Queue */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Waitlist Queue</span>
                <Clock className="h-4 w-4 text-status-warning" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                    {overview.waitlist_count}
                  </span>
                  <span className="text-xs font-semibold text-status-warning bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    FIFO Order
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-status-warning font-medium mt-2 flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Automatic chronological promotion
              </p>
            </div>

            {/* Metric 3: Checked In */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Checked In</span>
                <CheckCircle2 className="h-4 w-4 text-status-success" />
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                    {overview.checked_in_count}
                  </span>
                  <span className="text-xs font-semibold text-status-success bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {overview.confirmed_count > 0
                      ? `${Math.round((overview.checked_in_count / overview.confirmed_count) * 100)}% Rate`
                      : '0% Rate'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary mt-2">
                {overview.confirmed_count - overview.checked_in_count} attendees awaiting arrival
              </p>
            </div>

            {/* Metric 4: Cancellations */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-text-secondary mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Cancellations</span>
                <span className="text-xs font-mono font-bold text-text-secondary">AUTO</span>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-text-primary">
                    {overview.cancelled_count}
                  </span>
                  <span className="text-xs text-text-secondary">seats released</span>
                </div>
              </div>
              <p className="text-[11px] text-status-success font-medium mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-status-success" />
                Capacity dynamically preserved
              </p>
            </div>
          </div>
        ) : null}

        {/* Controls & Filtering Bar */}
        <div className="rounded-xl border border-border bg-surface p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                activeTab === 'all'
                  ? 'bg-primary-soft text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'
              }`}
            >
              All Registrations ({overview?.total_registered ?? 0})
            </button>
            <button
              onClick={() => { setActiveTab('confirmed'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                activeTab === 'confirmed'
                  ? 'bg-primary-soft text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'
              }`}
            >
              Confirmed ({overview?.confirmed_count ?? 0})
            </button>
            <button
              onClick={() => { setActiveTab('waitlist'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                activeTab === 'waitlist'
                  ? 'bg-primary-soft text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'
              }`}
            >
              Waitlisted ({overview?.waitlist_count ?? 0})
            </button>
            <button
              onClick={() => { setActiveTab('checked_in'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                activeTab === 'checked_in'
                  ? 'bg-primary-soft text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'
              }`}
            >
              Checked In ({overview?.checked_in_count ?? 0})
            </button>
            <button
              onClick={() => { setActiveTab('cancelled'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                activeTab === 'cancelled'
                  ? 'bg-primary-soft text-primary border border-primary/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-app-bg'
              }`}
            >
              Cancelled ({overview?.cancelled_count ?? 0})
            </button>
          </div>

          {/* Search & Export CSV */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Search name, email, ticket..."
                className="w-full rounded-lg border border-border bg-surface pl-9 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft transition-all"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-app-bg hover:border-text-secondary transition-colors shrink-0"
              title="Download CSV of current attendees"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Main Layout Grid: Table (Left/Center 8 cols) + FIFO Waitlist Queue Insight (Right 4 cols) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Primary Attendee Management Table (8 cols on XL) */}
          <div className="xl:col-span-8 bg-surface rounded-xl border border-border overflow-hidden flex flex-col justify-between shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-app-bg border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-3 px-4" scope="col">Attendee</th>
                    <th className="py-3 px-4" scope="col">Status</th>
                    <th className="py-3 px-4 hidden md:table-cell" scope="col">Registered</th>
                    <th className="py-3 px-4" scope="col">Check-in Status</th>
                    <th className="py-3 px-4 text-right" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {isLoading && !overview ? (
                    <tr>
                      <td colSpan={5} className="p-4">
                        <TableSkeleton rows={6} columns={5} />
                      </td>
                    </tr>
                  ) : paginatedAttendees.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 px-4 text-center">
                        <EmptyState
                          title="No attendees found"
                          description={
                            searchQuery
                              ? `No attendees matching "${searchQuery}" in this view.`
                              : `No registrations currently recorded under this filter.`
                          }
                          actionText={searchQuery ? 'Clear Search' : undefined}
                          onAction={() => setSearchQuery('')}
                        />
                      </td>
                    </tr>
                  ) : (
                    paginatedAttendees.map((att) => {
                      const isSelected = selectedAttendee?.id === att.id;
                      const isWaitlisted = att.status === 'waitlist';
                      const isCancelled = att.status === 'cancelled';

                      return (
                        <tr
                          key={att.id}
                          className={`transition-colors group ${
                            isSelected
                              ? 'bg-primary-soft/50 border-l-4 border-l-primary'
                              : isCancelled
                              ? 'bg-app-bg/50 opacity-75'
                              : 'hover:bg-app-bg'
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                                  isCancelled
                                    ? 'bg-red-100 text-status-danger'
                                    : isWaitlisted
                                    ? 'bg-amber-100 text-status-warning'
                                    : 'bg-primary-soft text-primary'
                                }`}
                              >
                                {getInitials(att.full_name)}
                              </div>
                              <div className="min-w-0">
                                <div
                                  className={`font-semibold text-text-primary truncate ${
                                    isCancelled ? 'line-through text-text-secondary' : ''
                                  }`}
                                >
                                  {att.full_name}
                                </div>
                                <div className="text-[11px] text-text-secondary truncate">
                                  {att.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isWaitlisted ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-status-warning border border-amber-200 w-fit">
                                  Waitlisted
                                </span>
                                {att.waitlist_position && (
                                  <span className="text-[10px] text-text-secondary font-medium mt-0.5">
                                    Priority #{att.waitlist_position}
                                  </span>
                                )}
                              </div>
                            ) : isCancelled ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-status-danger border border-red-200">
                                Cancelled
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-status-success border border-emerald-200">
                                Confirmed
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap text-text-secondary hidden md:table-cell">
                            {formatDate(att.created_at)}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isCancelled ? (
                              <span className="text-[11px] text-text-secondary italic">
                                Seat released
                              </span>
                            ) : att.is_checked_in ? (
                              <div className="flex items-center gap-1.5 text-status-success font-medium text-[11px]">
                                <CheckCircle2 className="h-4 w-4 text-status-success" />
                                <span>Checked In</span>
                              </div>
                            ) : isWaitlisted ? (
                              <span className="text-[11px] text-text-secondary italic">
                                Ineligible (Waitlist)
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 text-text-secondary text-[11px]">
                                <span className="h-2 w-2 rounded-full border border-text-secondary" />
                                <span>Not checked in</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                            {!isCancelled && !isWaitlisted && (
                              <button
                                onClick={() => handleToggleCheckin(att)}
                                disabled={isTogglingCheckin}
                                className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                                  att.is_checked_in
                                    ? 'text-text-secondary hover:text-status-danger hover:bg-red-50'
                                    : 'text-status-success hover:bg-emerald-50'
                                }`}
                              >
                                {att.is_checked_in ? 'Undo' : 'Check In'}
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedAttendee(att)}
                              className="text-primary hover:text-primary-hover font-semibold text-xs transition-colors"
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredAttendees.length > 0 && (
              <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface">
                <div className="text-xs text-text-secondary text-center sm:text-left">
                  Showing{' '}
                  <span className="font-semibold text-text-primary">
                    {(currentPage - 1) * pageSize + 1}–
                    {Math.min(currentPage * pageSize, filteredAttendees.length)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-text-primary">
                    {filteredAttendees.length}
                  </span>{' '}
                  attendees
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border text-text-secondary hover:bg-app-bg text-xs disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        currentPage === idx + 1
                          ? 'bg-primary text-white font-semibold'
                          : 'hover:bg-app-bg text-text-secondary'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border text-text-secondary hover:bg-app-bg text-xs disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated FIFO Waitlist Priority Queue (4 cols on XL) */}
          <div className="xl:col-span-4 space-y-4">
            <div className="bg-surface rounded-xl border border-border p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ListOrdered className="h-5 w-5 text-status-warning" />
                  <h3 className="text-sm font-bold text-text-primary">FIFO Waitlist Queue</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-status-warning border border-amber-200">
                  {overview?.waitlist_queue.length ?? 0} in Queue
                </span>
              </div>

              <p className="text-xs text-text-secondary py-3 leading-relaxed">
                When a confirmed attendee cancels, the first eligible waitlisted student is{' '}
                <strong className="text-text-primary">automatically promoted</strong> in strictly
                chronological FIFO priority.
              </p>

              {/* Priority Queue Cards */}
              <div className="space-y-2.5 pt-1">
                {overview && overview.waitlist_queue.length > 0 ? (
                  overview.waitlist_queue.map((wlAtt, idx) => (
                    <div
                      key={wlAtt.id}
                      className={`p-3 rounded-lg border flex items-start justify-between gap-2 transition-colors ${
                        idx === 0
                          ? 'border-amber-300 bg-amber-50/50'
                          : 'border-border bg-app-bg'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                            idx === 0
                              ? 'bg-status-warning text-white'
                              : 'bg-border text-text-secondary'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">
                            {wlAtt.full_name}
                          </p>
                          <p className="text-[11px] text-text-secondary truncate">
                            {wlAtt.email}
                          </p>
                          <p className="text-[10px] text-text-secondary mt-0.5">
                            Joined {formatDate(wlAtt.created_at)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                          idx === 0
                            ? 'bg-amber-100 text-status-warning'
                            : 'bg-surface border border-border text-text-secondary'
                        }`}
                      >
                        {idx === 0 ? 'Priority Next' : 'Waitlisted'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-text-secondary">
                    No attendees currently in waitlist queue.
                  </div>
                )}
              </div>

              {/* Promotion Mechanics Note */}
              <div className="mt-4 p-3 rounded-lg bg-primary-soft/60 border border-primary/20 flex items-center gap-2 text-xs text-primary">
                <RotateCcw className="h-4 w-4 shrink-0 text-primary" />
                <span>Seat drops automatically promote #1 in queue.</span>
              </div>
            </div>

            {/* Door Policy & Fast Desk Scanner Card */}
            <div className="bg-surface rounded-xl border border-border p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-bold text-text-primary">Door Policy &amp; Scanner</h3>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">
                Verify attendee registrations in real-time, record attendance, and search ticket codes instantly at the door.
              </p>
              {eventId && (
                <Link
                  to={`/organizer/events/${eventId}/checkin`}
                  className="w-full mt-4 inline-flex items-center justify-center gap-2 border border-border hover:bg-app-bg text-text-primary font-semibold text-xs py-2.5 rounded-lg transition-colors"
                >
                  <QrCode className="h-4 w-4 text-primary" />
                  <span>Open Desk Scanner (O05)</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Attendee Detail Slide-Over Drawer */}
        {selectedAttendee && (
          <>
            <div
              className="fixed inset-0 bg-[#202033]/40 z-40 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedAttendee(null)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface z-50 shadow-2xl border-l border-border flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div>
                <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold text-text-primary">Attendee Details</h2>
                  </div>
                  <button
                    onClick={() => setSelectedAttendee(null)}
                    className="p-1 rounded-lg text-text-secondary hover:bg-app-bg hover:text-text-primary transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="p-6 space-y-6">
                  {/* Profile Highlight */}
                  <div className="flex items-center gap-3.5 pb-5 border-b border-border">
                    <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center font-bold text-base">
                      {getInitials(selectedAttendee.full_name)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        {selectedAttendee.full_name}
                      </h3>
                      <p className="text-xs text-text-secondary">{selectedAttendee.email}</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold mt-1 ${
                          selectedAttendee.status === 'confirmed'
                            ? 'bg-emerald-50 text-status-success border border-emerald-200'
                            : selectedAttendee.status === 'waitlist'
                            ? 'bg-amber-50 text-status-warning border border-amber-200'
                            : 'bg-red-50 text-status-danger border border-red-200'
                        }`}
                      >
                        {selectedAttendee.status === 'confirmed'
                          ? 'Confirmed Attendee'
                          : selectedAttendee.status === 'waitlist'
                          ? `Waitlisted (Position #${selectedAttendee.waitlist_position || 1})`
                          : 'Cancelled'}
                      </span>
                    </div>
                  </div>

                  {/* Ticket Details Grid */}
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-text-secondary block mb-1">Ticket Reference</span>
                      <div className="flex items-center justify-between bg-app-bg rounded-lg border border-border p-2.5">
                        <span className="font-mono font-bold text-text-primary">
                          {selectedAttendee.ticket_code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(selectedAttendee.ticket_code)}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-hover font-medium"
                        >
                          {copiedCode ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-status-success" />
                              <span className="text-status-success">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-text-secondary block mb-1">Format &amp; Venue</span>
                      <div className="bg-app-bg rounded-lg border border-border p-2.5 text-text-primary font-medium">
                        {overview?.is_online ? 'Online Video Stream' : overview?.location || 'In-Person Venue'}
                      </div>
                    </div>

                    <div>
                      <span className="text-text-secondary block mb-1">Registration Date</span>
                      <div className="bg-app-bg rounded-lg border border-border p-2.5 text-text-primary font-medium">
                        {formatDate(selectedAttendee.created_at)}
                      </div>
                    </div>

                    <div>
                      <span className="text-text-secondary block mb-1">Check-in Status</span>
                      <div
                        className={`rounded-lg border p-3 flex items-center gap-2 font-medium ${
                          selectedAttendee.is_checked_in
                            ? 'border-emerald-200 bg-emerald-50 text-status-success'
                            : 'border-border bg-app-bg text-text-secondary'
                        }`}
                      >
                        {selectedAttendee.is_checked_in ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-status-success" />
                            <span>
                              Checked In{' '}
                              {selectedAttendee.checked_in_at
                                ? `(${formatDate(selectedAttendee.checked_in_at)})`
                                : ''}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="h-2 w-2 rounded-full border border-text-secondary" />
                            <span>Not checked in yet</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="p-6 border-t border-border bg-surface space-y-2">
                {selectedAttendee.status === 'confirmed' && (
                  <button
                    onClick={() => handleToggleCheckin(selectedAttendee)}
                    disabled={isTogglingCheckin}
                    className={`w-full py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 ${
                      selectedAttendee.is_checked_in
                        ? 'border border-border bg-surface text-text-secondary hover:bg-app-bg'
                        : 'bg-primary text-white hover:bg-primary-hover'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>
                      {selectedAttendee.is_checked_in
                        ? 'Undo Check-in Status'
                        : 'Mark as Checked In'}
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setToast({
                      type: 'info',
                      title: 'Confirmation Email Resent',
                      message: `Sent ticket instructions to ${selectedAttendee.email}.`,
                    });
                  }}
                  className="w-full py-2.5 rounded-lg border border-border bg-surface text-text-primary hover:bg-app-bg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Mail className="h-4 w-4 text-text-secondary" />
                  <span>Resend Confirmation Email</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </OrganizerLayout>
  );
}
