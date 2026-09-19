import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { apiFetch } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const registerSchema = z
  .object({
    full_name: z
      .string()
      .min(2, { message: 'Full name is required (at least 2 characters)' }),
    email: z
      .string()
      .min(1, { message: 'Email is required' })
      .email({ message: 'Please enter a valid email address' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' }),
    confirm_password: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    try {
      // Register attendee via public registration endpoint
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          full_name: data.full_name,
          password: data.password,
        }),
      });

      // Flow: / -> /register -> /login -> /events
      navigate('/login', {
        state: {
          registered: true,
          email: data.email,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
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
          <img
            src="/assets/meetora-logo.png"
            alt="Meetora"
            className="h-7 w-7 rounded-lg object-cover shadow-xs"
          />
          <span className="text-sm font-bold tracking-tight text-text-primary">Meetora</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Registration Card */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-10">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Create your Meetora account
              </h1>
              <p className="mt-2 text-xs text-text-secondary sm:text-sm">
                Join campus events, track registrations, and receive digital tickets.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="mb-5 flex items-start gap-3 rounded-xl border border-status-danger/30 bg-status-danger-soft p-3.5 text-xs text-status-danger"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Registration failed</p>
                  <p className="mt-0.5 text-text-secondary">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* Full Name */}
              <div>
                <label
                  htmlFor="full_name"
                  className="mb-1.5 block text-xs font-semibold text-text-primary"
                >
                  Full Name <span className="text-status-danger">*</span>
                </label>
                <input
                  id="full_name"
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  aria-invalid={errors.full_name ? 'true' : 'false'}
                  className={`field-control h-11 text-xs ${
                    errors.full_name ? 'border-status-danger' : ''
                  }`}
                  {...register('full_name')}
                />
                {errors.full_name && (
                  <p className="mt-1 text-[11px] font-medium text-status-danger">
                    {errors.full_name.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-xs font-semibold text-text-primary"
                >
                  Campus Email <span className="text-status-danger">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="alex@university.edu"
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
                  Password (min 8 characters) <span className="text-status-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
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

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm_password"
                  className="mb-1.5 block text-xs font-semibold text-text-primary"
                >
                  Confirm Password <span className="text-status-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    aria-invalid={errors.confirm_password ? 'true' : 'false'}
                    className={`field-control h-11 pr-10 text-xs ${
                      errors.confirm_password ? 'border-status-danger' : ''
                    }`}
                    {...register('confirm_password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="mt-1 text-[11px] font-medium text-status-danger">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-primary h-11 w-full text-xs font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center text-xs text-text-secondary">
            <span>Already have an account? </span>
            <Link
              to="/login"
              className="font-semibold text-primary hover:text-primary-hover hover:underline"
            >
              Sign in
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
