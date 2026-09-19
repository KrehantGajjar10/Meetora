import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents, type Event } from '@/lib/api';
import EventImage from '@/components/EventImage';

const categories = ['All', 'Technology', 'Design & UX', 'Workshops', 'Hackathons & Competitions', 'Career & Talks'];

export default function ExploreEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const navigate = useNavigate();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvents(search, selectedCategory === 'All' ? undefined : selectedCategory);
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchEvents]);


  const handleClearSearch = () => {
    setSearch('');
  };

  return (
    <div className="bg-app-bg text-text-primary min-h-screen flex flex-col font-body-sm antialiased selection:bg-primary-soft selection:text-primary">
      <main className="page-shell flex-1 py-10 md:py-12">
        
        <div className="page-header">
          <h1 className="text-display-title-mobile md:text-display-title font-display-title text-text-primary">
            Discover events that bring people together.
          </h1>
          <p className="text-body-md font-body-md text-text-secondary max-w-2xl">
            Explore workshops, talks, competitions, and community events across campus.
          </p>
        </div>

        <section aria-label="Event filters" className="surface-card mb-10 space-y-5 p-4 sm:p-6">
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-secondary">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-control h-11 pl-10 pr-10 text-body-sm placeholder:text-text-secondary/70" 
              placeholder="Search events by title or description..." 
            />
            {search && (
              <button 
                type="button" 
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-secondary hover:text-text-primary" 
                title="Clear search"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
            {categories.map((cat) => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                type="button"
                className={`category-pill whitespace-nowrap px-4 py-2 rounded-lg text-label-md font-medium transition-all ${
                  selectedCategory === cat 
                    ? 'bg-primary text-on-primary shadow-sm font-semibold' 
                    : 'bg-surface text-text-secondary border border-border hover:bg-app-bg hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:min-w-50 sm:flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">calendar_today</span>
                <select className="w-full h-10 pl-9 pr-8 bg-surface border border-border rounded-lg text-label-md font-medium text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition appearance-none cursor-pointer hover:border-outline">
                  <option>Date: All upcoming</option>
                  <option>This week</option>
                  <option>This weekend</option>
                  <option>Next 30 days</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">expand_more</span>
              </div>
              <div className="relative w-full sm:min-w-52.5 sm:flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">tune</span>
                <select className="w-full h-10 pl-9 pr-8 bg-surface border border-border rounded-lg text-label-md font-medium text-text-primary focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition appearance-none cursor-pointer hover:border-outline">
                  <option>Availability: All events</option>
                  <option>Registration open</option>
                  <option>Full / Waitlist</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary text-[18px]">expand_more</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-metadata-sm font-metadata-sm bg-app-bg text-text-secondary border border-border">
                <span className="w-2 h-2 rounded-full bg-status-success"></span>
                Showing {events.length} published event{events.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl overflow-hidden p-0 space-y-4 animate-pulse">
                <div className="aspect-video bg-border/60 relative overflow-hidden"></div>
                <div className="p-5 pt-0 space-y-3">
                  <div className="h-5 bg-border/70 rounded-md w-3/4"></div>
                  <div className="h-4 bg-border/40 rounded-md w-1/2"></div>
                  <div className="h-4 bg-border/40 rounded-md w-2/3"></div>
                </div>
                <div className="px-5 pb-5 pt-3 border-t border-border flex justify-between items-center">
                  <div className="h-6 w-24 bg-border/50 rounded-full"></div>
                  <div className="h-8 w-20 bg-border/50 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-surface border border-border rounded-xl p-10 md:p-16 text-center max-w-2xl mx-auto my-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-danger-soft text-status-danger">
              <span className="material-symbols-outlined text-[32px]">cloud_off</span>
            </div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-status-danger-soft px-3 py-1 text-metadata-sm font-metadata-sm font-semibold text-status-danger">
              <span>Connection Error</span>
            </div>
            <h2 className="text-section-title font-section-title text-text-primary mb-2">Unable to load events</h2>
            <p className="text-body-md font-body-md text-text-secondary mb-6 max-w-md mx-auto">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button 
                onClick={fetchEvents}
                type="button"
                className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary-hover text-on-primary font-body-sm font-medium transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Retry connection
              </button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-10 md:p-16 text-center max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px]">search_off</span>
            </div>
            <h2 className="text-section-title font-section-title text-text-primary mb-2">No events match your search</h2>
            <p className="text-body-md font-body-md text-text-secondary mb-6 max-w-md mx-auto">
              We couldn’t find any events with the current keyword and filter criteria. Try adjusting dates, categories, or clearing your search term.
            </p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory('All'); }}
              type="button"
              className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary-hover text-on-primary font-body-sm font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => {
              const startDate = new Date(event.start_time);
              const isFull = event.registered_count >= event.capacity;
              
              return (
                <article key={event.id} className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all hover:-translate-y-0.5 hover:border-outline-variant hover:shadow-md" onClick={() => navigate(`/events/${event.id}`)}>
                  <div>
                    <EventImage
                      src={event.image_url}
                      alt={event.title}
                      category={event.category}
                      aspectRatio="aspect-video"
                    />
                    <div className="space-y-3.5 p-5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-metadata-sm font-metadata-sm bg-app-bg text-text-secondary border border-border">{event.category}</span>
                        
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-metadata-sm font-metadata-sm font-semibold border ${
                          isFull 
                            ? 'bg-status-warning-soft text-status-warning border-status-warning/20' 
                            : 'bg-status-success-soft text-status-success border-status-success/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-status-warning' : 'bg-status-success'}`}></span>
                          {event.status}
                        </span>
                      </div>
                      <h2 className="line-clamp-2 text-card-title font-card-title font-semibold leading-snug text-text-primary group-hover:text-primary">{event.title}</h2>
                      <div className="space-y-1.5 text-body-sm font-body-sm text-text-secondary">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-text-secondary">calendar_today</span>
                          <span>{startDate.toLocaleDateString()} • {startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-text-secondary">location_on</span>
                          <span className="truncate">{event.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-3 border-t border-border flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-primary-soft text-primary font-bold text-[11px] flex items-center justify-center shrink-0">
                        {event.host_logo_text || event.host_name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-metadata-sm font-metadata-sm text-text-secondary truncate">{event.host_name}</span>
                    </div>
                    <button type="button" aria-label={`View details for ${event.title}`} className="button-secondary min-h-9 shrink-0 px-3.5 text-label-md">
                      View details
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
