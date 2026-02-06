import { useState, Fragment } from 'react';
import { formatDateTime } from '../../lib/utils';
import { AuditLogRowExpanded, AuditLogCardExpanded } from './AuditLogRowExpanded';
import { AuditLogEntityLink } from './AuditLogEntityLink';
import { AuditLogsPagination } from './AuditLogsPagination';
import { getHumanDescription, getActionIcon } from './auditLogHumanize';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-neutral-100 text-neutral-700',
  accept: 'bg-green-100 text-green-700',
  reject: 'bg-orange-100 text-orange-700',
  failed: 'bg-red-100 text-red-700',
  view: 'bg-sky-100 text-sky-700',
  upload: 'bg-indigo-100 text-indigo-700',
  download: 'bg-cyan-100 text-cyan-700',
  page_view: 'bg-slate-100 text-slate-600',
};

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  am: 'bg-blue-100 text-blue-700',
  client: 'bg-amber-100 text-amber-700',
  unknown: 'bg-neutral-100 text-neutral-600',
  anonymous: 'bg-red-100 text-red-600',
};

const SORTABLE_COLUMNS = [
  { key: 'created_at', label: 'Time' },
  { key: 'action', label: 'Action' },
  { key: 'user_role', label: 'Role' },
  { key: 'entity_type', label: 'Entity' },
];

function getActionColor(action) {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toLowerCase().includes(k));
  return ACTION_COLORS[key] || 'bg-neutral-100 text-neutral-700';
}

/**
 * AuditLogsTable — main table view with sortable columns and expandable rows
 */
export function AuditLogsTable({ logs, isLoading, totalCount, filters, onFiltersChange, humanMode = false }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1;
  const totalPages = Math.ceil((totalCount || 0) / (filters.limit || 100));

  const handleSort = (column) => {
    const isSameColumn = filters.sortBy === column;
    const newOrder = isSameColumn && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFiltersChange({ ...filters, sortBy: column, sortOrder: newOrder });
  };

  const handlePageChange = (page) => {
    onFiltersChange({ ...filters, offset: (page - 1) * (filters.limit || 100) });
  };

  const toggleRow = (logId) => {
    setExpandedRow(expandedRow === logId ? null : logId);
  };

  const SortIcon = ({ column }) => {
    if (filters.sortBy !== column) {
      return (
        <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return filters.sortOrder === 'asc' ? (
      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : (!logs || logs.length === 0) ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-neutral-500">No audit logs found</p>
          <p className="text-sm text-neutral-400">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="overflow-x-auto hidden sm:block">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  {/* Expand column */}
                  <th className="w-8 px-2 py-3" />

                  {SORTABLE_COLUMNS.map(col => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        <SortIcon column={col.key} />
                      </div>
                    </th>
                  ))}

                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      onClick={() => toggleRow(log.id)}
                      className={`cursor-pointer transition-colors ${
                        expandedRow === log.id ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      {/* Expand icon */}
                      <td className="px-2 py-3 text-center">
                        <svg
                          className={`w-4 h-4 text-neutral-400 transition-transform ${expandedRow === log.id ? 'rotate-90' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-neutral-600">
                          {formatDateTime(log.created_at)}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {humanMode ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{getActionIcon(log.action)}</span>
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                              {log.action}
                            </span>
                          </div>
                        ) : (
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const role = log.user_role || log.user?.role || 'unknown';
                          return (
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[role] || ROLE_COLORS.unknown}`}>
                              {role}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Entity */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <AuditLogEntityLink entityType={log.entity_type} entityId={log.entity_id} metadata={log.metadata} />
                      </td>

                      {/* User */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {log.user?.avatar_url ? (
                            <img src={log.user.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-medium text-neutral-600">
                                {log.user?.full_name?.[0] || log.user?.email?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <span className="text-sm text-neutral-900 truncate max-w-[150px]">
                            {log.user?.full_name || log.user?.email || 'Unknown'}
                          </span>
                        </div>
                      </td>

                      {/* Details preview */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-neutral-500 max-w-xs truncate block">
                          {humanMode
                            ? getHumanDescription(log)
                            : (log.metadata && Object.keys(log.metadata).length > 0
                              ? JSON.stringify(log.metadata).slice(0, 80)
                              : '—')
                          }
                        </span>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expandedRow === log.id && (
                      <AuditLogRowExpanded log={log} />
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card view */}
          <div className="sm:hidden divide-y divide-neutral-200">
            {logs.map((log) => (
              <div key={log.id}>
                <div
                  onClick={() => toggleRow(log.id)}
                  className={`p-4 cursor-pointer transition-colors ${expandedRow === log.id ? 'bg-neutral-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      {humanMode && <span className="text-sm">{getActionIcon(log.action)}</span>}
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </div>
                    <span className="text-xs text-neutral-400">{formatDateTime(log.created_at)}</span>
                  </div>
                  {humanMode && (
                    <p className="text-xs text-neutral-500 mb-2 truncate">{getHumanDescription(log)}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {log.user?.avatar_url ? (
                        <img src={log.user.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center">
                          <span className="text-[10px] font-medium text-neutral-600">
                            {log.user?.full_name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <span className="text-sm text-neutral-700 truncate max-w-[150px]">
                        {log.user?.full_name || log.user?.email || 'Unknown'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${ROLE_COLORS[log.user_role || log.user?.role] || ROLE_COLORS.unknown}`}>
                        {log.user_role || log.user?.role || 'unknown'}
                      </span>
                    </div>
                    <AuditLogEntityLink entityType={log.entity_type} entityId={log.entity_id} metadata={log.metadata} />
                  </div>
                </div>
                {expandedRow === log.id && (
                  <AuditLogCardExpanded log={log} />
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <AuditLogsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount || 0}
            offset={filters.offset || 0}
            limit={filters.limit || 100}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

export default AuditLogsTable;
