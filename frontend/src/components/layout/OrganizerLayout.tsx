import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  Eye,
  LogOut,
  Menu,
  X,
  HelpCircle,
} from 'lucide-react';

import ThemeToggle from '@/components/ThemeToggle';

interface OrganizerLayoutProps {
  children: ReactNode;
}

export default function OrganizerLayout({ children }: OrganizerLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'OR';

  const navItems = [
    {
      to: '/organizer',
      exact: true,
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      to: '/organizer/events',
      exact: false,
      label: 'My Events',
      icon: Calendar,
    },
    {
      to: '/organizer/events/new',
      exact: true,
      label: 'Create Event',
      icon: PlusCircle,
    },
  ];

  const isNavActive = (itemTo: string, exact: boolean) => {
    if (exact) {
      return location.pathname === itemTo;
    }
    return location.pathname === itemTo || location.pathname.startsWith(`${itemTo}/`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-text-primary antialiased">
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-text-primary">Meetora</span>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
            Organizer
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-text-secondary hover:bg-app-bg hover:text-text-primary"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-text-primary/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Persistent Left Sidebar - Sticky on desktop within viewport */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between overflow-y-auto border-r border-border bg-surface transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:self-start lg:translate-x-0 lg:shrink-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6">
            {/* Brand Header */}
            <div className="mb-6 flex items-center gap-3 border-b border-border pb-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-text-primary">Meetora</span>
                  <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Organizer
                  </span>
                </div>
                <p className="text-xs text-text-secondary">Campus Tech Hub</p>
              </div>
            </div>

            {/* Section Label */}
            <div className="mb-2 px-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Workspace
              </p>
            </div>

            {/* Core Organizer Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isNavActive(item.to, item.exact);
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-l-4 border-primary bg-primary-soft pl-2.5 font-semibold text-primary'
                        : 'text-text-secondary hover:bg-app-bg hover:text-text-primary'
                    }`}
                  >
                    <IconComponent className={`h-4 w-4 ${active ? 'text-primary' : 'text-text-secondary'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Publishing Guidelines Card */}
            <div className="mt-8 rounded-lg border border-border bg-app-bg p-3.5">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-text-primary">Publishing Guidelines</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">
                    Events require a valid venue or stream link and clear seat capacity.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Authenticated Organizer Card */}
          <div className="border-t border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary border border-primary/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text-primary">{user?.full_name || 'Organizer'}</p>
                <p className="truncate text-[11px] text-text-secondary">{user?.email}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-xs">
              <Link
                to="/events"
                className="flex items-center gap-1.5 font-medium text-primary hover:text-primary-hover"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Attendee View</span>
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-text-secondary transition-colors hover:text-status-danger"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Canvas Area */}
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 min-w-0">{children}</main>

          {/* Workspace Footer */}
          <footer className="mt-auto border-t border-border bg-surface px-6 py-4">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-xs text-text-secondary sm:flex-row">
              <p>© 2026 Meetora Platform. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <span className="hover:text-primary cursor-pointer transition-colors">Campus Support</span>
                <span className="hover:text-primary cursor-pointer transition-colors">Organizer Docs</span>
                <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
                <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
