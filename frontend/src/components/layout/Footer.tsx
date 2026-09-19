import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="w-full bg-surface border-t border-border mt-auto">
      <div className="page-shell flex flex-col items-center justify-between gap-5 py-8 sm:py-10 md:flex-row">
        {/* Brand & Copyright */}
        <div className="flex items-center gap-3">
          <span className="text-base font-bold tracking-tight text-text-primary">Meetora</span>
          <span className="text-border hidden sm:inline">|</span>
          <span className="text-label-md text-text-secondary">
            © 2026 Meetora Platform. All rights reserved.
          </span>
        </div>

        {/* Links Cluster */}
        <nav aria-label="Footer Links" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-label-md">
          <Link
            to="/"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Explore Events
          </Link>
          <a
            href="/"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Organizer Hub
          </a>
          <a
            href="#"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-text-secondary hover:text-text-primary transition-colors duration-150"
          >
            Campus Support
          </a>
        </nav>
      </div>
    </footer>
  );
}
