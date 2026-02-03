import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Protected route wrapper
 * Redirects to login if not authenticated
 * Optionally restricts access to specific roles
 */
export function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, profile, loading, profileLoaded, isConfigured } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">Loading...</p>
        </div>
      </div>
    );
  }

  // If Supabase not configured, show warning
  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
        <div className="max-w-md w-full bg-white rounded-md shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 text-amber-600 mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-lg font-semibold">Configuration Required</h2>
          </div>
          <p className="text-neutral-600 text-sm mb-4">
            Supabase is not configured. Please update your <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-xs">.env.local</code> file with your Supabase credentials.
          </p>
          <div className="bg-neutral-50 rounded p-4 text-xs font-mono text-neutral-700">
            <p>VITE_SUPABASE_URL=https://your-project.supabase.co</p>
            <p>VITE_SUPABASE_ANON_KEY=your-anon-key</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role restriction specified, check role
  // BUT: Only redirect if profile is loaded. If profile is still loading (profileLoaded=false),
  // wait a bit more to avoid redirecting when profile is temporarily unavailable due to connection issues
  if (allowedRoles) {
    // If profile not loaded yet, show loading (don't redirect immediately)
    if (!profileLoaded && isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            <p className="text-sm text-neutral-500">Loading profile...</p>
          </div>
        </div>
      );
    }
    
    // Only check role if profile is loaded
    if (profileLoaded && profile && !allowedRoles.includes(profile.role)) {
      // Redirect to appropriate dashboard based on role
      const dashboardPath =
        profile.role === 'admin'
          ? '/admin/dashboard'
          : profile.role === 'am'
          ? '/am/dashboard'
          : '/dashboard';

      return <Navigate to={dashboardPath} replace />;
    }
  }

  return <Outlet />;
}

export default ProtectedRoute;
