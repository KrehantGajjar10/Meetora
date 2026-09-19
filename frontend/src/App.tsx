import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Code-split page components with dynamic imports (resolves > 500 kB chunk warning)
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ExploreEvents = lazy(() => import('@/pages/ExploreEvents'));
const EventDetails = lazy(() => import('@/pages/EventDetails'));
const MyRegistrations = lazy(() => import('@/pages/MyRegistrations'));
const OrganizerOverview = lazy(() => import('@/pages/OrganizerOverview'));
const OrganizerEvents = lazy(() => import('@/pages/OrganizerEvents'));
const CreateEditEvent = lazy(() => import('@/pages/CreateEditEvent'));
const EventManagement = lazy(() => import('@/pages/EventManagement'));
const CheckInDesk = lazy(() => import('@/pages/CheckInDesk'));

// Smooth page loading fallback conforming to S01 design specs
function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-app-bg px-6">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-xs font-medium text-text-secondary shadow-xs">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span>Loading Meetora...</span>
      </div>
    </div>
  );
}

// Protected Route wrapper for Attendee Views
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg px-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-xs font-medium text-text-secondary shadow-xs">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading your Meetora session...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

// Protected Route wrapper for Organizer Workspace Views
function OrganizerProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg px-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-xs font-medium text-text-secondary shadow-xs">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Loading your Meetora session...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Enforce organizer role authorization
  if (!user.is_organizer) {
    return <Navigate to="/events" replace />;
  }
  
  return <>{children}</>;
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Marketing Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Standalone Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Authenticated Attendee Routes */}
              <Route 
                path="/events" 
                element={
                  <ProtectedRoute>
                    <ExploreEvents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/events/:id" 
                element={
                  <ProtectedRoute>
                    <EventDetails />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/registrations"
                element={
                  <ProtectedRoute>
                    <MyRegistrations />
                  </ProtectedRoute>
                }
              />

              {/* Authenticated Organizer Workspace Routes */}
              <Route
                path="/organizer"
                element={
                  <OrganizerProtectedRoute>
                    <OrganizerOverview />
                  </OrganizerProtectedRoute>
                }
              />
              <Route
                path="/organizer/events"
                element={
                  <OrganizerProtectedRoute>
                    <OrganizerEvents />
                  </OrganizerProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/new"
                element={
                  <OrganizerProtectedRoute>
                    <CreateEditEvent />
                  </OrganizerProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:id/edit"
                element={
                  <OrganizerProtectedRoute>
                    <CreateEditEvent />
                  </OrganizerProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:id/attendees"
                element={
                  <OrganizerProtectedRoute>
                    <EventManagement />
                  </OrganizerProtectedRoute>
                }
              />
              <Route
                path="/organizer/events/:id/checkin"
                element={
                  <OrganizerProtectedRoute>
                    <CheckInDesk />
                  </OrganizerProtectedRoute>
                }
              />

              {/* Catch-all route redirects to / */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
