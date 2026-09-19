import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Authenticated-only navigation links (hidden when unauthenticated)
  const links: { to: string; label: string; badge?: string }[] = [];
  if (user) {
    links.push(
      { to: '/events', label: 'Explore Events' },
      { to: '/registrations', label: 'My Registrations' }
    );
    if (user.is_organizer) {
      links.push({ to: '/organizer', label: 'Organizer Hub', badge: 'Admin' });
    }
  }

  const brandDestination = user ? '/events' : '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="page-shell flex min-h-16 items-center justify-between py-2">
        {/* Brand Cluster */}
        <div className="flex items-center gap-4">
          <Link
            to={brandDestination}
            className="flex items-center gap-2.5 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <img
              src="/assets/meetora-logo.png"
              alt="Meetora"
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm"
            />
            <span className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              Meetora
            </span>
          </Link>

          {/* Navigation Links (Desktop) - ONLY for authenticated users */}
          {user && links.length > 0 && (
            <nav aria-label="Main Navigation" className="ml-4 hidden items-center gap-1 md:flex">
              {links.map((link) => {
                const active =
                  location.pathname === link.to ||
                  (link.to !== '/' && location.pathname.startsWith(`${link.to}/`));
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-primary-soft text-primary font-semibold'
                        : 'text-text-secondary hover:bg-app-bg hover:text-text-primary'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Right Trailing Actions */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-text-primary leading-tight">
                  {user.full_name}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {user.is_organizer ? 'Campus Organizer' : 'Attendee'}
                </span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="button-secondary min-h-9 px-3 text-xs font-semibold"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="button-secondary min-h-9 border-transparent bg-transparent px-3 text-xs font-semibold text-text-secondary hover:text-text-primary"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="button-primary min-h-9 px-3.5 text-xs font-semibold"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger toggle (only if authenticated with links) */}
          {user && links.length > 0 && (
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-app-bg md:hidden"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span className="material-symbols-outlined text-[20px]">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {user && menuOpen && links.length > 0 && (
        <nav
          className="border-t border-border bg-surface py-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="page-shell flex flex-col gap-1">
            {links.map((link) => {
              const active =
                location.pathname === link.to ||
                (link.to !== '/' && location.pathname.startsWith(`${link.to}/`));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active
                      ? 'bg-primary-soft text-primary font-semibold'
                      : 'text-text-secondary hover:bg-app-bg'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
