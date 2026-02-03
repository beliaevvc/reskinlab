import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useClientActivity } from '../../hooks/useClientActivity';
import { formatDistanceToNow } from '../../lib/utils';

export function DashboardPage() {
  const { profile, client, isClient, isAM, isAdmin } = useAuth();
  const { data: activity, isLoading: activityLoading } = useClientActivity();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Welcome back, {profile?.full_name || 'User'}
        </h1>
        <p className="text-neutral-500 mt-1">
          {isClient
            ? 'Manage your projects and specifications'
            : isAM
            ? 'Manage your clients and projects'
            : 'System administration'}
        </p>
      </div>

      {/* Client Dashboard */}
      {isClient && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick action: Calculator */}
          <Link
            to="/calculator"
            className="bg-white rounded-md border border-neutral-200 p-6 hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
              <svg
                className="w-6 h-6 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              Price Calculator
            </h3>
            <p className="text-sm text-neutral-500">
              Calculate project costs and create specifications
            </p>
          </Link>

          {/* Quick action: Projects */}
          <Link
            to="/projects"
            className="bg-white rounded-md border border-neutral-200 p-6 hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              My Projects
            </h3>
            <p className="text-sm text-neutral-500">
              View and manage your active projects
            </p>
          </Link>

          {/* Quick action: Invoices */}
          <Link
            to="/invoices"
            className="bg-white rounded-md border border-neutral-200 p-6 hover:shadow-md hover:border-emerald-200 transition-all group"
          >
            <div className="w-12 h-12 bg-amber-100 rounded flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">
              Invoices
            </h3>
            <p className="text-sm text-neutral-500">
              View and pay your invoices
            </p>
          </Link>
        </div>
      )}

      {/* Profile completion prompt */}
      {isClient && client && !client.profile_completed && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-900 mb-1">
                Complete your profile
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                Please complete your profile information to get the best
                experience. This information is required for creating projects
                and invoices.
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded transition-colors text-sm"
              >
                Complete Profile
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* AM/Admin placeholder */}
      {(isAM || isAdmin) && (
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {isAdmin ? 'Admin Dashboard' : 'Account Manager Dashboard'}
          </h3>
          <p className="text-neutral-500">
            Dashboard content will be implemented in Phase 4-6.
          </p>
        </div>
      )}

      {/* Recent activity */}
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Recent Activity
        </h3>
        {activityLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Activity item component
function ActivityItem({ item }) {
  const getIcon = () => {
    switch (item.type) {
      case 'project':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        );
      case 'specification':
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'offer':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'invoice':
        return (
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-start gap-3 py-2">
      {getIcon()}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900">{item.title}</p>
        {item.description && (
          <p className="text-xs text-neutral-500 truncate">{item.description}</p>
        )}
      </div>
      <span className="text-xs text-neutral-400 whitespace-nowrap">
        {formatDistanceToNow(item.created_at)}
      </span>
    </div>
  );
}

export default DashboardPage;
