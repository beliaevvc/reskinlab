import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useClientActivity } from '../../hooks/useClientActivity';
import { formatDistanceToNow } from '../../lib/utils';
import { getHumanDescription, getActionIcon } from '../../components/audit-logs/auditLogHumanize';
import { PendingCodeBanner } from '../../components/calculator/PendingCodeBanner';

export function DashboardPage() {
  const { t } = useTranslation(['navigation', 'common', 'projects', 'invoices', 'calculator']);
  const { profile, client, isClient, isAM, isAdmin } = useAuth();
  const { data: activity, isLoading: activityLoading } = useClientActivity();
  const [activityOpen, setActivityOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Pending shared code banner (auto-import from public calculator) */}
      <PendingCodeBanner />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          {t('navigation:dashboard')}, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-neutral-500 mt-1">
          {isClient
            ? t('projects:subtitle')
            : isAM
            ? t('navigation:clients') + ' & ' + t('navigation:projects')
            : t('admin:dashboard.subtitle', { ns: 'admin' })}
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
              {t('calculator:title')}
            </h3>
            <p className="text-sm text-neutral-500">
              {t('calculator:subtitle')}
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
              {t('navigation:projects')}
            </h3>
            <p className="text-sm text-neutral-500">
              {t('projects:subtitle')}
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
              {t('navigation:invoices')}
            </h3>
            <p className="text-sm text-neutral-500">
              {t('invoices:subtitle')}
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
                {t('navigation:profile')}
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                {t('common:empty.noData')}
              </p>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded transition-colors text-sm"
              >
                {t('navigation:profile')}
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

      {/* Recent activity — collapsible */}
      <div className="bg-white rounded-md border border-neutral-200">
        <button
          type="button"
          onClick={() => setActivityOpen(prev => !prev)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-50 transition-colors rounded-md"
        >
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-neutral-900">
              {t('common:empty.noActivity').replace('No ', '')}
            </h3>
            {!activityLoading && activity?.length > 0 && (
              <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                {activity.length}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-neutral-400 transition-transform duration-200 ${activityOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {activityOpen && (
          <div className="px-6 pb-6">
            {activityLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {activity.map((log) => (
                  <ActivityItem key={log.id} log={log} />
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
                <p>{t('common:empty.noActivity')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Activity badge colors (same as admin dashboard) ---
const ACTIVITY_BADGE_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-neutral-100 text-neutral-600',
  failed: 'bg-red-100 text-red-700',
  accept: 'bg-green-100 text-green-700',
  reject: 'bg-orange-100 text-orange-700',
  finalize: 'bg-indigo-100 text-indigo-700',
  send: 'bg-cyan-100 text-cyan-700',
  pay: 'bg-amber-100 text-amber-700',
  confirm: 'bg-amber-100 text-amber-700',
  upload: 'bg-sky-100 text-sky-700',
  download: 'bg-sky-100 text-sky-700',
  add: 'bg-emerald-100 text-emerald-700',
  complete: 'bg-green-100 text-green-700',
};

function getActivityBadgeColor(action) {
  const key = Object.keys(ACTIVITY_BADGE_COLORS).find(k => action?.toLowerCase().includes(k));
  return ACTIVITY_BADGE_COLORS[key] || 'bg-neutral-100 text-neutral-700';
}

/**
 * Build a link to the entity page (if applicable)
 */
function getEntityLink(log) {
  const { entity_type, entity_id } = log;
  if (!entity_id) return null;

  switch (entity_type) {
    case 'project':
      return `/projects/${entity_id}`;
    case 'specification':
      return `/specifications/${entity_id}`;
    case 'offer':
      return `/offers/${entity_id}`;
    case 'invoice':
      return `/invoices/${entity_id}`;
    default:
      return null;
  }
}

/**
 * Activity item — renders a single audit log entry (admin-style)
 */
function ActivityItem({ log }) {
  const desc = getHumanDescription(log);
  const link = getEntityLink(log);

  const content = (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 text-sm">
        {getActionIcon(log.action)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActivityBadgeColor(log.action)}`}>
            {log.action}
          </span>
        </div>
        <p className="text-sm text-neutral-700 mt-0.5 line-clamp-2">
          {desc}
        </p>
      </div>
      <span className="text-xs text-neutral-400 flex-shrink-0 whitespace-nowrap">
        {formatDistanceToNow(log.created_at)}
      </span>
    </div>
  );

  if (link) {
    return (
      <Link to={link} className="block hover:bg-neutral-50 rounded -mx-2 px-2 transition-colors">
        {content}
      </Link>
    );
  }

  return content;
}

export default DashboardPage;
