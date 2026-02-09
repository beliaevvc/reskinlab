import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useAuditDailyActivity, useAuditTopUsers, useAuditActionDistribution } from '../../hooks/useAuditLogs';

const PIE_COLORS = [
  '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316',
];

/**
 * AuditLogsCharts — analytics section with activity, top users, action distribution
 */
export function AuditLogsCharts() {
  const { t, i18n } = useTranslation('admin');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: dailyActivity } = useAuditDailyActivity();
  const { data: topUsers } = useAuditTopUsers();
  const { data: actionDistribution } = useAuditActionDistribution();

  const currentLang = i18n.language?.startsWith('ru') ? 'ru' : 'en';

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="w-full bg-white rounded-lg border border-neutral-200 px-4 py-3 text-sm text-neutral-500 hover:bg-neutral-50 transition-colors text-left flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {t('auditLog.charts.showCharts')}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-700">{t('auditLog.charts.analyticsTitle')}</h3>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          {t('auditLog.charts.hide')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:divide-x divide-y lg:divide-y-0 divide-neutral-100">
        {/* Activity chart (30 days) */}
        <div className="p-4">
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-3">{t('auditLog.charts.activity30d')}</h4>
          {dailyActivity && dailyActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={dailyActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9CA3AF' }}
                  tickFormatter={(d) => new Date(d).getDate().toString()}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  labelFormatter={(d) => new Date(d).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric' })}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#activityGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-neutral-400 text-sm">
              {t('auditLog.charts.noData')}
            </div>
          )}
        </div>

        {/* Top users — custom bars */}
        <div className="p-4">
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-3">{t('auditLog.charts.topUsers')}</h4>
          {topUsers && topUsers.length > 0 ? (
            <div className="flex flex-col justify-center gap-3 h-[180px]">
              {topUsers.slice(0, 5).map((user, i) => {
                const max = topUsers[0]?.count || 1;
                const pct = Math.round((user.count / max) * 100);
                const colors = [
                  'bg-emerald-500', 'bg-blue-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'
                ];
                return (
                  <div key={user.name} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-600 w-[120px] truncate flex-shrink-0" title={user.name}>
                      {user.name}
                    </span>
                    <div className="flex-1 h-5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-neutral-500 w-8 text-right flex-shrink-0">
                      {user.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-neutral-400 text-sm">
              {t('auditLog.charts.noData')}
            </div>
          )}
        </div>

        {/* Action distribution pie chart */}
        <div className="p-4">
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-3">{t('auditLog.charts.actionDistribution')}</h4>
          {actionDistribution && actionDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={actionDistribution.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  dataKey="value"
                  paddingAngle={2}
                >
                  {actionDistribution.slice(0, 8).map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                  formatter={(value, name) => [value, name]}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(value) => value.length > 14 ? value.slice(0, 14) + '...' : value}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-neutral-400 text-sm">
              {t('auditLog.charts.noData')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuditLogsCharts;
