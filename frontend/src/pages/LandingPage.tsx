import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  Calendar,
  Ticket,
  QrCode,
  Users,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-text-primary antialiased">
      {/* Top Navigation */}
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-border bg-linear-to-b from-primary-soft/30 via-surface to-app-bg px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="page-shell relative z-10 flex flex-col items-center text-center">
            {/* Pill Tag */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/60 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart University Event Experience</span>
            </div>

            {/* Headline */}
            <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Discover, organize, and experience <br className="hidden sm:inline" />
              <span className="bg-linear-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                campus events seamlessly.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-2xl text-base text-text-secondary sm:text-lg">
              Meetora unifies campus life with live capacity tracking, fair waitlists,
              instant digital ticketing, and lightning-fast QR check-in desks for organizers.
            </p>

            {/* CTA Group */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/events"
                className="button-primary min-h-12 px-6 text-sm font-semibold shadow-md transition-all hover:scale-[1.02]"
              >
                <span>Explore Events</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className="button-secondary min-h-12 border-border bg-surface px-6 text-sm font-semibold shadow-xs hover:bg-app-bg"
              >
                Create Account
              </Link>
            </div>

            {/* Hero Visual Card / Teaser Preview */}
            <div className="mt-14 w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
              <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-3.5 text-xs text-text-secondary">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 font-mono text-[11px] text-text-muted">meetora.campus.edu/events</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-status-success font-semibold">Live System Active</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-3">
                {/* Event Teaser 1 */}
                <div className="flex flex-col justify-between rounded-xl border border-border bg-app-bg/50 p-5 text-left transition-all hover:border-primary/40 hover:bg-surface hover:shadow-md">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-md bg-primary-soft px-2 py-0.5 font-semibold text-primary">
                        Technology
                      </span>
                      <span className="font-medium text-status-success">Open</span>
                    </div>
                    <h2 className="mt-3 text-sm font-bold text-text-primary">
                      AI & Robotics Campus Showcase
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                      Hands-on demos of autonomous robotics and generative models.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-primary" /> 142 / 150 Seats
                    </span>
                    <span className="font-semibold text-primary">Instant Pass</span>
                  </div>
                </div>

                {/* Event Teaser 2 */}
                <div className="flex flex-col justify-between rounded-xl border border-border bg-app-bg/50 p-5 text-left transition-all hover:border-primary/40 hover:bg-surface hover:shadow-md">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-semibold text-status-warning">
                        Design & UX
                      </span>
                      <span className="rounded-full bg-status-warning-soft px-2 py-0.5 text-[10px] font-bold text-status-warning">
                        Waitlist
                      </span>
                    </div>
                    <h2 className="mt-3 text-sm font-bold text-text-primary">
                      Design Systems & Figma Masterclass
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                      Building production design tokens and atomic interfaces.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500" /> Queue #3
                    </span>
                    <span className="font-semibold text-status-warning">Auto-Promote</span>
                  </div>
                </div>

                {/* Event Teaser 3 */}
                <div className="flex flex-col justify-between rounded-xl border border-border bg-app-bg/50 p-5 text-left transition-all hover:border-primary/40 hover:bg-surface hover:shadow-md">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 font-semibold text-status-success">
                        Hackathons
                      </span>
                      <span className="font-medium text-status-success">Open</span>
                    </div>
                    <h2 className="mt-3 text-sm font-bold text-text-primary">
                      Annual 48-Hour Campus Hackathon
                    </h2>
                    <p className="mt-1 text-xs text-text-secondary line-clamp-2">
                      Build innovative projects with student teams, mentors, and sponsor prizes.
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/80 pt-3 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-1">
                      <QrCode className="h-3 w-3 text-primary" /> Fast Check-In
                    </span>
                    <span className="font-semibold text-primary">Free Entry</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3-STEP WORKFLOW SECTION */}
        <section className="border-b border-border bg-surface py-16 sm:py-20">
          <div className="page-shell">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                How It Works
              </h2>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                A modern event workflow built for university life
              </h3>
              <p className="mt-3 text-sm text-text-secondary sm:text-base">
                From finding events to walking in through the door, every step is transparent and real-time.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col items-center rounded-2xl border border-border bg-app-bg/60 p-6 text-center shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <Compass className="h-6 w-6" />
                </div>
                <span className="mt-4 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                  Step 1
                </span>
                <h4 className="mt-3 text-base font-bold text-text-primary">
                  Discover Campus Events
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Browse by category, search keywords, check real-time availability, and view venue or live stream details.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center rounded-2xl border border-border bg-app-bg/60 p-6 text-center shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <Ticket className="h-6 w-6" />
                </div>
                <span className="mt-4 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                  Step 2
                </span>
                <h4 className="mt-3 text-base font-bold text-text-primary">
                  One-Click Registration & Ticket
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Secure your seat instantly. If capacity is full, join the automated waitlist queue with guaranteed fair ordering.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center rounded-2xl border border-border bg-app-bg/60 p-6 text-center shadow-xs">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
                  <QrCode className="h-6 w-6" />
                </div>
                <span className="mt-4 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">
                  Step 3
                </span>
                <h4 className="mt-3 text-base font-bold text-text-primary">
                  Frictionless Check-in
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  Arrive at the venue and present your unique ticket code. Organizers verify and check you in within seconds.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CORE PLATFORM FEATURES */}
        <section className="border-b border-border bg-app-bg py-16 sm:py-20">
          <div className="page-shell">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                Built For Campus Scale
              </h2>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Engineered for organizers and attendees alike
              </h3>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-sm font-bold text-text-primary">
                  Live Capacity Control
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  Rigorous server-side capacity checks prevent overbooking and protect venue fire codes.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-sm font-bold text-text-primary">
                  Automated Waitlist
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  When a confirmed attendee cancels, the next waitlisted student is automatically promoted.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-sm font-bold text-text-primary">
                  Zero Double-Bookings
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  Strict database constraints guarantee that duplicate registrations can never occur.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Calendar className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-sm font-bold text-text-primary">
                  Organizer Desk & Scan
                </h4>
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  Dedicated workspace with live search, QR simulation, and instantaneous ticket verification.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ORGANIZER SPOTLIGHT CTA */}
        <section className="bg-surface py-16 sm:py-20">
          <div className="page-shell">
            <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-linear-to-r from-primary to-indigo-600 p-8 text-white shadow-xl sm:p-12">
              <div className="relative z-10 max-w-2xl">
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  University Student Clubs & Faculty
                </span>
                <h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-4xl">
                  Host your next conference, workshop, or competition on Meetora.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                  Manage attendees, download check-in lists, publish event updates, and track live occupancy in real time.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-primary shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Organizer Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xs transition-colors hover:bg-white/20"
                  >
                    <span>Register as Student / Staff</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Shared Footer */}
      <Footer />
    </div>
  );
}
