import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

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
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-text-primary antialiased flex flex-col justify-between">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <section className="overflow-hidden rounded-2xl border border-border bg-surface px-6 py-8 sm:px-10 sm:py-10 shadow-[0_8px_30px_rgba(32,32,51,0.06)]">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Sign in to continue to your Meetora account.
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="mb-6 flex items-start gap-3 rounded-xl border border-status-danger/20 bg-status-danger/5 px-4 py-3.5"
                role="alert"
              >
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[19px] text-status-danger">
                  error
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-status-danger">
                    Sign in failed
                  </p>
                  <p className="mt-1 text-[13px] leading-5 text-text-secondary">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
              noValidate
            >
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  className={`h-12 w-full rounded-[10px] border bg-surface px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 ${
                    errors.email
                      ? 'border-status-danger focus:border-status-danger focus:ring-4 focus:ring-status-danger/10'
                      : 'border-border hover:border-text-secondary/40 focus:border-primary focus:ring-4 focus:ring-primary-soft'
                  }`}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-status-danger">
                    <span className="material-symbols-outlined text-[15px]">
                      error
                    </span>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-text-primary"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={errors.password ? 'true' : 'false'}
                    className={`h-12 w-full rounded-[10px] border bg-surface pl-4 pr-12 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/60 ${
                      errors.password
                        ? 'border-status-danger focus:border-status-danger focus:ring-4 focus:ring-status-danger/10'
                        : 'border-border hover:border-text-secondary/40 focus:border-primary focus:ring-4 focus:ring-primary-soft'
                    }`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-primary-soft hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
                  >
                    <span className="material-symbols-outlined flex items-center justify-center text-[19px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-status-danger">
                    <span className="material-symbols-outlined text-[15px]">
                      error
                    </span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-hover hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary-soft disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary disabled:hover:shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          </section>

          {/* Footer Link (Moved outside the card) */}
          <div className="mt-6 text-center">
            <p className="flex items-center justify-center gap-1.5 text-sm text-text-secondary">
              <span>Don't have an account?</span>
              <Link
                to="/register"
                className="font-medium text-primary transition-colors hover:text-primary-hover hover:underline"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}