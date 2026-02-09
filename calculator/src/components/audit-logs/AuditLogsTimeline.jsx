import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../lib/utils';
import { AuditLogEntityLink } from './AuditLogEntityLink';
import { AuditLogDiff } from './AuditLogDiff';
import { AuditLogsPagination } from './AuditLogsPagination';

const ACTION_ICONS = {
  create: { color: 'bg-emerald-500', icon: '+' },
  update: { color: 'bg-blue-500', icon: '~' },
  delete: { color: 'bg-red-500', icon: '×' },
  login: { color: 'bg-purple-500', icon: '→' },
  logout: { color: 'bg-neutral-400', icon: '←' },
  accept: { color: 'bg-green-500', icon: '✓' },
  reject: { color: 'bg-orange-500', icon: '!' },
  failed: { color: 'bg-red-600', icon: '✗' },
  view: { color: 'bg-sky-500', icon: '◎' },
  upload: { color: 'bg-indigo-500', icon: '↑' },
  download: { color: 'bg-cyan-500', icon: '↓' },
  page_view: { color: 'bg-slate-400', icon: '◉' },
};

function getActionIcon(action) {
  const key = Object.keys(ACTION_ICONS).find(k => action?.toLowerCase().includes(k));
  return ACTION_ICONS[key] || { color: 'bg-neutral-400', icon: '•' };
}

/**
 * Group logs by date label: Today, Yesterday, or formatted date
 */
function groupLogsByDate(logs, t, locale) {
  const groups = [];
  let currentLabel = null;
  let currentGroup = null;

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const log of logs) {
    const logDate = new Date(log.created_at).toDateString();
    let label;

    if (logDate === today) label = t('auditLog.timeline.today');
    else if (logDate === yesterday) label = t('auditLog.timeline.yesterday');
    else label = new Date(log.created_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { label, logs: [] };
      groups.push(currentGroup);
    }
    currentGroup.logs.push(log);
  }

  return groups;
}

/**
 * AuditLogsTimeline — vertical event timeline grouped by date
 */
export function AuditLogsTimeline({ logs, isLoading, totalCount, filters, onFiltersChange }) {
  const { t, i18n } = useTranslation('admin');
  const [expandedId, setExpandedId] = useState(null);

  const currentLang = i18n.language?.startsWith('ru') ? 'ru' : 'en';
  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 100)) + 1;
  const totalPages = Math.ceil((totalCount || 0) / (filters.limit || 100));

  const handlePageChange = (page) => {
    onFiltersChange({ ...filters, offset: (page - 1) * (filters.limit || 100) });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-neutral-200 text-center py-16">
        <svg className="mx-auto h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-2 text-neutral-500">{t('auditLog.timeline.noEvents')}</p>
      </div>
    );
  }

  const groups = groupLogsByDate(logs, t, currentLang);

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      <div className="p-4 space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-neutral-700">{group.label}</h3>
              <div className="flex-1 h-px bg-neutral-200" />
              <span className="text-xs text-neutral-400">{group.logs.length} {t('auditLog.timeline.events')}</span>
            </div>

            {/* Timeline entries */}
            <div className="relative ml-4">
              {/* Vertical line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-neutral-200" />

              {group.logs.map((log, i) => {
                const { color, icon } = getActionIcon(log.action);
                const isExpanded = expandedId === log.id;

                return (
                  <div key={log.id} className="relative pl-10 pb-4 last:pb-0">
                    {/* Dot */}
                    <div className={`absolute left-0.5 top-1 w-5 h-5 rounded-full ${color} flex items-center justify-center ring-2 ring-white`}>
                      <span className="text-white text-[10px] font-bold leading-none">{icon}</span>
                    </div>

                    {/* Content */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-neutral-900">{log.action}</span>
                            <AuditLogEntityLink entityType={log.entity_type} entityId={log.entity_id} metadata={log.metadata} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-neutral-500">
                              {log.user?.full_name || log.user?.email || t('auditLog.unknown')}
                            </span>
                            <span className="text-xs text-neutral-300">·</span>
                            <span className="text-xs text-neutral-400">
                              {log.user_role}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-400 whitespace-nowrap flex-shrink-0">
                          {new Date(log.created_at).toLocaleTimeString(currentLang === 'ru' ? 'ru-RU' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100" onClick={e => e.stopPropagation()}>
                          <AuditLogDiff oldData={log.old_data} newData={log.new_data} />
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-neutral-400">{t('auditLog.timeline.metadata')}</span>
                              <pre className="text-xs font-mono text-neutral-600 mt-1 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                          {(log.ip_address || log.user_agent) && (
                            <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                              {log.user_agent && <span className="truncate max-w-[200px]">UA: {log.user_agent}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
    </div>
  );
}

export default AuditLogsTimeline;
