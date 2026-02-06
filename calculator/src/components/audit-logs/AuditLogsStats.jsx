import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { useAuditStats, useAuditDailyActivity, useAuditAnomalyCheck } from '../../hooks/useAuditLogs';

/**
 * Sparkline — tiny area chart without axes
 */
function Sparkline({ data, dataKey = 'count', color = '#10B981', height = 40 }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color.replace('#', '')})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Stat card with sparkline
 */
function StatCard({ label, value, sparklineData, sparklineColor, suffix = '' }) {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {value !== undefined ? value.toLocaleString() : '—'}
            {suffix && <span className="text-sm font-normal text-neutral-400 ml-1">{suffix}</span>}
          </p>
        </div>
      </div>
      {sparklineData && (
        <div className="mt-2 -mx-1">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}
    </div>
  );
}

/**
 * AuditLogsStats — stat cards with sparklines at the top of the page
 */
export function AuditLogsStats() {
  const { data: stats } = useAuditStats();
  const { data: dailyActivity } = useAuditDailyActivity();
  const { data: anomaly } = useAuditAnomalyCheck();

  // Split daily activity into periods for sparklines
  const last24hData = dailyActivity?.slice(-1) || [];
  const last7dData = dailyActivity?.slice(-7) || [];
  const last30dData = dailyActivity || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Last 24 Hours"
        value={stats?.last24h}
        sparklineData={last7dData}
        sparklineColor="#10B981"
      />
      <StatCard
        label="Last 7 Days"
        value={stats?.last7d}
        sparklineData={last7dData}
        sparklineColor="#3B82F6"
      />
      <StatCard
        label="Last 30 Days"
        value={stats?.last30d}
        sparklineData={last30dData}
        sparklineColor="#8B5CF6"
      />
      <div className={`bg-white rounded-lg border p-4 flex flex-col justify-between min-h-[100px] ${
        anomaly?.isAnomaly ? 'border-orange-300 bg-orange-50' : 'border-neutral-200'
      }`}>
        <div>
          <p className="text-sm text-neutral-500">Today vs Average</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-2xl font-bold ${anomaly?.isAnomaly ? 'text-orange-600' : 'text-neutral-900'}`}>
              {anomaly ? `${anomaly.ratio}x` : '—'}
            </p>
            {anomaly && (
              <span className="text-sm text-neutral-500">
                {anomaly.todayCount} today / {anomaly.dailyAvg} avg
              </span>
            )}
          </div>
        </div>
        {anomaly?.isAnomaly && (
          <p className="text-xs text-orange-600 mt-2 font-medium">
            Unusual activity detected
          </p>
        )}
        {!anomaly?.isAnomaly && dailyActivity && (
          <div className="mt-2 -mx-1">
            <Sparkline data={last7dData} color="#6B7280" />
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogsStats;
