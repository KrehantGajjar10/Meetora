import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Success message if routed from registration page
  const registeredSuccess = (location.state as { registered?: boolean; message?: string } | null)
    ?.registered;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);

    try {
      // OAuth2 requires URL-encoded form data
      const formData = new URLSearchParams();
      formData.append('username', data.email);
      formData.append('password', data.password);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail ||
            'Invalid email or password. Please verify your credentials and try again.'
        );
      }

      const { access_token } = await response.json();
      login(access_token);

      // Inspect whether user is an organizer by querying /me
      try {
        const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.is_organizer) {
            navigate('/organizer');
            return;
          }
        }
      } catch {
        // Default to /events on failure
      }

      navigate('/events');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-app-bg text-text-primary antialiased">
      {/* Focused Auth Header */}
      <header className="flex h-16 items-center justify-between px-6 sm:px-10">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg p-1 text-text-secondary transition-colors hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <ArrowLeft className="h-4 w-4" />
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white shadow-xs">
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              calendar_month
            </span>
          </div>
          <span className="text-sm font-bold tracking-tight text-text-primary">Meetora</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Form Center */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-10">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Sign in to Meetora
              </h1>
              <p className="mt-2 text-xs text-text-secondary sm:text-sm">
                Access your registrations, tickets, or organizer dashboard.
              </p>
            </div>

            {/* Registration Success Banner */}
            {registeredSuccess && (
              <div
                className="mb-5 flex items-start gap-3 rounded-xl border border-status-success/30 bg-status-success-soft p-3.5 text-xs text-status-success"
                role="status"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Account created successfully!</p>
                  <p className="mt-0.5 text-text-secondary">
                    Please sign in with your email and password.
                  </p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div
                className="mb-5 flex items-start gap-3 rounded-xl border border-status-danger/30 bg-status-danger-soft p-3.5 text-xs text-status-danger"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Sign in failed</p>
                  <p className="mt-0.5 text-text-secondary">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-text-primary"
                >
                  Campus or Personal Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@university.edu"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  className={`field-control h-11 text-xs ${
                    errors.email ? 'border-status-danger' : ''
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] font-medium text-status-danger">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-xs font-semibold text-text-primary"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    className={`field-control h-11 pr-10 text-xs ${
                      errors.password ? 'border-status-danger' : ''
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] font-medium text-status-danger">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-primary h-11 w-full text-xs font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Test Credentials Helper Hint */}
            <div className="mt-6 rounded-lg border border-border bg-app-bg p-3 text-[11px] text-text-secondary">
              <p className="font-semibold text-text-primary">Organizer Demo Account:</p>
              <p className="mt-0.5 font-mono">organizer@meetora.com / Organizer123!</p>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-text-secondary">
            <span>Don't have an account? </span>
            <Link
              to="/register"
              className="font-semibold text-primary hover:text-primary-hover hover:underline"
            >
              Create account
            </Link>
          </div>
        </div>
      </main>

      {/* Minimal Bottom Bar */}
      <footer className="py-4 text-center text-[11px] text-text-muted">
        © 2026 Meetora Platform. All rights reserved.
      </footer>
    </div>
  );
}