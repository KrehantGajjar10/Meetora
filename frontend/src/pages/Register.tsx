import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useAuth } from '@/context/AuthContext';
import { apiFetch, API_BASE_URL } from '@/lib/api';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const registerSchema = z
  .object({
    full_name: z.string().min(2, { message: "Name is required (at least 2 characters)" }),
    email: z.string().min(1, { message: "Email is required" }).email({ message: "Please enter a valid email address" }),
    password: z.string().min(8, { message: "Password must be at least 8 characters" }),
    confirm_password: z.string().min(1, { message: "Please confirm your password" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      // 1. Register User via API
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: data.email,
          full_name: data.full_name,
          password: data.password,
        }),
      });

      // 2. Automatically log in user with token
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

      if (response.ok) {
        const { access_token } = await response.json();
        login(access_token);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app-bg text-text-primary antialiased">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Canvas Container */}
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10 md:py-16">
        {/* Subtle Return-to-Registration Context Banner */}
        <div className="mb-7 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-text-secondary shadow-sm transition-colors group hover:text-text-primary">
          <span
            className="material-symbols-outlined text-[18px] text-primary transition-transform group-hover:-translate-x-0.5"
          >
            arrow_back
          </span>
          <span className="text-[13px] font-medium">
            Creating an account to complete your event registration
          </span>
        </div>

        {/* Centered Form Card */}
        <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-10">
          {/* Card Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-text-primary sm:text-display-title">
              Create your Meetora account
            </h1>
            <p className="mt-3 text-body-md text-text-secondary">
              Join events, manage your registrations, and get started with Meetora.
            </p>
          </div>

          {/* Feedback / Error Banner */}
          {error && (
            <div
              className="mb-6 p-4 rounded-lg border text-[14px] flex items-start gap-3 bg-red-50 border-status-danger/30 text-status-danger"
              role="alert"
            >
              <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            {/* Name Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-text-primary" htmlFor="full_name">
                Name <span className="text-status-danger">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Your full name"
                className={`field-control h-12 text-base ${
                  errors.full_name
                    ? 'border-status-danger focus:border-status-danger focus:ring-red-100'
                    : 'border-border focus:border-primary-container focus:ring-primary-soft'
                }`}
                {...register("full_name")}
              />
              {errors.full_name && (
                <p className="text-[13px] text-status-danger mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{errors.full_name.message}</span>
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-text-primary" htmlFor="email">
                Email <span className="text-status-danger">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`field-control h-12 text-base ${
                  errors.email
                    ? 'border-status-danger focus:border-status-danger focus:ring-red-100'
                    : 'border-border focus:border-primary-container focus:ring-primary-soft'
                }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-[13px] text-status-danger mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-text-primary" htmlFor="password">
                Password <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  className={`field-control h-12 pl-4 pr-12 text-base ${
                    errors.password
                      ? 'border-status-danger focus:border-status-danger focus:ring-red-100'
                      : 'border-border focus:border-primary-container focus:ring-primary-soft'
                  }`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary hover:text-text-primary focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px] block">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[13px] text-text-secondary mt-1">
                Use a password that meets the account security requirements.
              </p>
              {errors.password && (
                <p className="text-[13px] text-status-danger mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-text-primary" htmlFor="confirm_password">
                Confirm password <span className="text-status-danger">*</span>
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  className={`field-control h-12 pl-4 pr-12 text-base ${
                    errors.confirm_password
                      ? 'border-status-danger focus:border-status-danger focus:ring-red-100'
                      : 'border-border focus:border-primary-container focus:ring-primary-soft'
                  }`}
                  {...register("confirm_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute inset-y-0 right-0 flex items-center px-4 text-text-secondary hover:text-text-primary focus:outline-none"
                >
                  <span className="material-symbols-outlined text-[20px] block">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-[13px] text-status-danger mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{errors.confirm_password.message}</span>
                </p>
              )}
            </div>

            {/* Submit Button CTA */}
            <div className="mt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="button-primary h-12 w-full text-base"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>

          {/* Secondary Link Below Form */}
          <div className="mt-6 pt-5 border-t border-border text-center">
            <p className="text-[14px] text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold ml-1 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
