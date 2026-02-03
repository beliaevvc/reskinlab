import { useState } from 'react';
import { useAuditLogs, useAuditStats, useAuditActionTypes, exportAuditLogsCSV } from '../../hooks/useAuditLogs';
import { formatDate } from '../../lib/utils';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-neutral-100 text-neutral-700',
  accept: 'bg-green-100 text-green-700',
  reject: 'bg-orange-100 text-orange-700',
};

export function AuditLogsPage() {
  const [filters, setFilters] = useState({ action: 'all', limit: 50, offset: 0 });
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useAuditLogs(filters);
  const { data: stats } = useAuditStats();
  const { data: actionTypes } = useAuditActionTypes();

  const logs = data?.data || [];
  const totalCount = data?.count || 0;
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(totalCount / filters.limit);

  const handleActionFilter = (action) => {
    setFilters(prev => ({ ...prev, action, offset: 0 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, offset: (newPage - 1) * prev.limit }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAuditLogsCSV(filters);
    } catch (err) {
      alert('Export failed: ' + err.message);
    }
    setIsExporting(false);
  };

  const getActionColor = (action) => {
    const key = Object.keys(ACTION_COLORS).find(k => action?.toLowerCase().includes(k));
    return ACTION_COLORS[key] || 'bg-neutral-100 text-neutral-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Audit Logs</h1>
          <p className="text-neutral-500 mt-1">Track all important actions in the system</p>
        </div>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-medium transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-400 border-t-transparent" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          Export CSV
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Last 24 Hours</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.last24h}</p>
          </div>
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Last 7 Days</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.last7d}</p>
          </div>
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Last 30 Days</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.last30d}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-md border border-neutral-200 p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleActionFilter('all')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filters.action === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All
          </button>
          {actionTypes?.map((action) => (
            <button
              key={action}
              onClick={() => handleActionFilter(action)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                filters.action === action
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No audit logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-neutral-600">
                        {formatDate(log.created_at, true)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-neutral-600">
                            {log.user?.full_name?.[0] || log.user?.email?.[0]?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-900">
                          {log.user?.full_name || log.user?.email || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-neutral-500">
                        {log.entity_type ? `${log.entity_type}` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-neutral-500 max-w-xs truncate block">
                        {log.details ? JSON.stringify(log.details).slice(0, 100) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, totalCount)} of {totalCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-neutral-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-neutral-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogsPage;
