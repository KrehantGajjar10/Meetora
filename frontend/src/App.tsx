import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ExploreEvents from '@/pages/ExploreEvents';
import EventDetails from '@/pages/EventDetails';
import MyRegistrations from '@/pages/MyRegistrations';
import OrganizerOverview from '@/pages/OrganizerOverview';
import OrganizerEvents from '@/pages/OrganizerEvents';
import CreateEditEvent from '@/pages/CreateEditEvent';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Protected Route wrapper for Attendee Views
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg px-6">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-body-sm text-text-secondary shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your Meetora session...
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
        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-5 py-4 text-body-sm text-text-secondary shadow-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Loading your Meetora session...
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ExploreEvents />
              </ProtectedRoute>
            } 
          />
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

