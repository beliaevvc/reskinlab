import { Link } from 'react-router-dom';
import { useDashboardStats, useRecentActivity, useRevenueChart, useProjectsChart } from '../../hooks/useDashboard';
import { formatCurrency, formatDate } from '../../lib/utils';
import { getHumanDescription, getActionIcon } from '../../components/audit-logs/auditLogHumanize';

// Simple bar chart component
function BarChart({ data, dataKey, label, color = 'emerald' }) {
  const maxValue = Math.max(...data.map(d => d[dataKey]), 1);
  
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-xs text-neutral-500 w-8">{item.month}</span>
          <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={`h-full bg-${color}-500 rounded-full transition-all duration-500`}
              style={{ width: `${(item[dataKey] / maxValue) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium text-neutral-700 w-20 text-right">
            {dataKey === 'revenue' ? formatCurrency(item[dataKey]) : item[dataKey]}
          </span>
        </div>
      ))}
    </div>
  );
}

// Stat card component
function StatCard({ title, value, subtitle, change, changeLabel, icon, color = 'emerald', link }) {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };

  const Card = link ? Link : 'div';
  
  return (
    <Card 
      to={link}
      className={`bg-white rounded-md border border-neutral-200 p-5 ${link ? 'hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p>
          )}
          {change !== undefined && (
            <p className={`text-sm mt-1 ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% {changeLabel}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-md ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// Activity item component
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
};

function getActivityBadgeColor(action) {
  const key = Object.keys(ACTIVITY_BADGE_COLORS).find(k => action?.toLowerCase().includes(k));
  return ACTIVITY_BADGE_COLORS[key] || 'bg-neutral-100 text-neutral-700';
}

function ActivityItem({ log }) {
  const desc = getHumanDescription(log);
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0 text-sm">
        {getActionIcon(log.action)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-neutral-900 truncate">
            {log.user?.full_name || log.user?.email || 'Unknown'}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getActivityBadgeColor(log.action)}`}>
            {log.action}
          </span>
        </div>
        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
          {desc}
        </p>
      </div>
      <span className="text-xs text-neutral-400 flex-shrink-0 whitespace-nowrap">
        {formatDate(log.created_at, true)}
      </span>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity(8);
  const { data: revenueData } = useRevenueChart();
  const { data: projectsData } = useProjectsChart();

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-500 mt-1">Overview of your platform activity</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats?.revenue?.total || 0)}
          change={stats?.revenue?.change}
          changeLabel="vs last month"
          color="emerald"
          link="/admin/invoices"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Active Projects"
          value={stats?.projects?.in_progress || 0}
          color="blue"
          link="/admin/projects"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
        />
        
        <StatCard
          title="Total Users"
          value={stats?.users?.total || 0}
          color="purple"
          link="/admin/users"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Awaiting Offer"
          value={stats?.finalizedSpecs?.count || 0}
          subtitle={stats?.finalizedSpecs?.amount > 0 ? formatCurrency(stats.finalizedSpecs.amount) : null}
          color={stats?.finalizedSpecs?.count > 0 ? 'purple' : 'emerald'}
          link="/admin/specifications"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">This Month</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(stats?.revenue?.thisMonth || 0)}
          </p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Pending Revenue</p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {formatCurrency(stats?.revenue?.pending || 0)}
          </p>
        </div>
        <Link to="/admin/offers" className="bg-white rounded-md border border-neutral-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all">
          <p className="text-sm text-neutral-500">Pending Offers</p>
          <p className={`text-xl font-bold mt-1 ${stats?.pendingOffers?.count > 0 ? 'text-amber-600' : 'text-neutral-400'}`}>
            {stats?.pendingOffers?.count || 0}
          </p>
          {stats?.pendingOffers?.amount > 0 && (
            <p className="text-xs text-neutral-400 mt-0.5">{formatCurrency(stats.pendingOffers.amount)}</p>
          )}
        </Link>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Completed Projects</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {stats?.projects?.completed || 0}
          </p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Active Clients</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {stats?.users?.clients || 0}
          </p>
        </div>
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">Draft Projects</p>
          <p className="text-xl font-bold text-neutral-500 mt-1">
            {stats?.projects?.draft || 0}
          </p>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Revenue (6 months)</h3>
            <Link to="/admin/invoices" className="text-sm text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          </div>
          {revenueData ? (
            <BarChart data={revenueData} dataKey="revenue" color="emerald" />
          ) : (
            <div className="h-48 flex items-center justify-center text-neutral-400">
              Loading...
            </div>
          )}
        </div>

        {/* Projects Chart */}
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Projects (6 months)</h3>
            <Link to="/admin/projects" className="text-sm text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          </div>
          {projectsData ? (
            <BarChart data={projectsData} dataKey="total" color="blue" />
          ) : (
            <div className="h-48 flex items-center justify-center text-neutral-400">
              Loading...
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-neutral-900">Recent Activity</h3>
            <Link to="/admin/audit-logs" className="text-sm text-emerald-600 hover:text-emerald-700">
              View all
            </Link>
          </div>
          {activityLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
            </div>
          ) : activity?.length > 0 ? (
            <div className="divide-y divide-neutral-100 -my-3">
              {activity.map(log => (
                <ActivityItem key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-neutral-400">
              No recent activity
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <div className="p-2 bg-purple-100 text-purple-600 rounded">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <span className="font-medium text-neutral-700">Manage Users</span>
          </Link>
          
          <Link
            to="/admin/projects"
            className="flex items-center gap-3 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <div className="p-2 bg-blue-100 text-blue-600 rounded">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-medium text-neutral-700">View Projects</span>
          </Link>
          
          <Link
            to="/admin/pricing"
            className="flex items-center gap-3 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-medium text-neutral-700">Calculator</span>
          </Link>
          
          <Link
            to="/admin/promo-codes"
            className="flex items-center gap-3 p-4 bg-neutral-50 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <div className="p-2 bg-amber-100 text-amber-600 rounded">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <span className="font-medium text-neutral-700">Promo Codes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
