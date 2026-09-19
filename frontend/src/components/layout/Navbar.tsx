import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { to: '/events', label: 'Explore Events' },
    { to: '/registrations', label: 'My Registrations' },
    { to: '/organizer', label: 'Organizer Hub' },
  ];

  return (
    <header className="w-full bg-surface border-b border-border sticky top-0 z-50">
      <div className="page-shell flex min-h-16 items-center justify-between py-2">
        {/* Brand Cluster */}
        <div className="flex items-center gap-4">
          <Link
            to="/events"
            className="flex items-center gap-2.5 rounded-lg p-1 focus:outline-none focus:ring-2 focus:ring-primary-container"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-sm shrink-0">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                calendar_month
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight text-text-primary sm:text-xl">
              Meetora
            </span>
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav aria-label="Main Navigation" className="ml-4 hidden items-center gap-1 md:flex">
            {links.map((link) => {
              const active = location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-app-bg hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Trailing Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary hover:bg-app-bg md:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
          </button>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-body-sm font-medium text-text-primary sm:inline">
                {user.full_name}
              </span>
              <button
                onClick={logout}
                className="button-secondary min-h-10 px-3 text-label-md"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="button-secondary min-h-10 border-transparent bg-transparent px-3 text-label-md"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="button-primary min-h-10 px-4 text-label-md"
              >
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
      {menuOpen && (
        <nav className="border-t border-border bg-surface py-3 md:hidden" aria-label="Mobile navigation">
          <div className="page-shell">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium ${
                  location.pathname === link.to ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-app-bg'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          </div>
        </nav>
      )}
    </header>
  );
}
