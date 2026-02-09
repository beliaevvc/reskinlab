import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuditLogs, exportAuditLogsCSV, exportAuditLogsJSON } from '../../hooks/useAuditLogs';
import {
  AuditLogsHeader,
  AuditLogsStats,
  AuditLogsCharts,
  AuditLogsFilters,
  AuditLogsTable,
  AuditLogsTimeline,
  getDefaultFilters,
} from '../../components/audit-logs';

// URL param keys mapping
const URL_KEYS = {
  action: 'action',
  userId: 'user',
  userRole: 'role',
  entityType: 'entity',
  entityId: 'entityId',
  dateFrom: 'from',
  dateTo: 'to',
  sortBy: 'sort',
  sortOrder: 'order',
  offset: 'offset',
};

/**
 * Read filters from URL search params
 */
function filtersFromParams(searchParams) {
  const defaults = getDefaultFilters();
  return {
    action: searchParams.get(URL_KEYS.action) || defaults.action,
    userId: searchParams.get(URL_KEYS.userId) || defaults.userId,
    userRole: searchParams.get(URL_KEYS.userRole) || defaults.userRole,
    entityType: searchParams.get(URL_KEYS.entityType) || defaults.entityType,
    entityId: searchParams.get(URL_KEYS.entityId) || defaults.entityId,
    dateFrom: searchParams.get(URL_KEYS.dateFrom) || defaults.dateFrom,
    dateTo: searchParams.get(URL_KEYS.dateTo) || defaults.dateTo,
    sortBy: searchParams.get(URL_KEYS.sortBy) || defaults.sortBy,
    sortOrder: searchParams.get(URL_KEYS.sortOrder) || defaults.sortOrder,
    limit: defaults.limit,
    offset: parseInt(searchParams.get(URL_KEYS.offset) || '0', 10),
  };
}

/**
 * Write filters to URL search params
 */
function filtersToParams(filters) {
  const defaults = getDefaultFilters();
  const params = new URLSearchParams();

  for (const [filterKey, paramKey] of Object.entries(URL_KEYS)) {
    const value = filters[filterKey];
    const defaultValue = defaults[filterKey];

    // Only include non-default values in URL
    if (value !== undefined && value !== defaultValue && value !== '' && value !== 0) {
      params.set(paramKey, String(value));
    }
  }

  return params;
}

/**
 * AuditLogsPage — main admin page for viewing audit logs
 *
 * Features:
 * - Table and Timeline views with toggle
 * - URL-synced filters (role, user, action, entity, date, entity ID)
 * - Filter presets (Today, 7d, Logins, Errors, etc.)
 * - Stats cards with sparklines
 * - Charts (activity, top users, action distribution)
 * - Sortable columns
 * - Accordion row expansion with diff
 * - Auto-refresh (30s interval)
 * - Export (CSV, JSON, Print)
 * - Full mobile adaptation
 */
export function AuditLogsPage() {
  const { t } = useTranslation('admin');
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => filtersFromParams(searchParams));
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('audit-view') || 'table');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [humanMode, setHumanMode] = useState(() => localStorage.getItem('audit-human') !== 'false');

  // Fetch logs
  const { data, isLoading } = useAuditLogs(filters, { autoRefresh });
  const logs = data?.data || [];
  const totalCount = data?.count || 0;

  // Sync filters → URL
  useEffect(() => {
    const newParams = filtersToParams(filters);
    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  // Reset filters
  const handleReset = useCallback(() => {
    setFilters(getDefaultFilters());
  }, []);

  // View mode toggle
  const handleViewChange = useCallback((mode) => {
    setViewMode(mode);
    localStorage.setItem('audit-view', mode);
  }, []);

  // Auto-refresh toggle
  const handleToggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Human mode toggle
  const handleToggleHumanMode = useCallback(() => {
    setHumanMode(prev => {
      const next = !prev;
      localStorage.setItem('audit-human', String(next));
      return next;
    });
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(async () => {
    await exportAuditLogsCSV(filters);
  }, [filters]);

  const handleExportJSON = useCallback(async () => {
    await exportAuditLogsJSON(filters);
  }, [filters]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div className="space-y-5 print:space-y-3">
      {/* Header */}
      <AuditLogsHeader
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        onPrint={handlePrint}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={handleToggleAutoRefresh}
        humanMode={humanMode}
        onToggleHumanMode={handleToggleHumanMode}
      />

      {/* Stats */}
      <AuditLogsStats />

      {/* Charts */}
      <div className="print:hidden">
        <AuditLogsCharts />
      </div>

      {/* Filters */}
      <div className="print:hidden">
        <AuditLogsFilters
          filters={filters}
          onChange={handleFiltersChange}
          onReset={handleReset}
        />
      </div>

      {/* View mode toggle */}
      <div className="flex items-center justify-between print:hidden">
        <div className="text-sm text-neutral-500">
          {totalCount > 0 && (
            <span>{t('auditLog.totalLogs', { count: totalCount })}</span>
          )}
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
          <button
            onClick={() => handleViewChange('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('auditLog.viewMode.table')}
          </button>
          <button
            onClick={() => handleViewChange('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('auditLog.viewMode.timeline')}
          </button>
        </div>
      </div>

      {/* Content — Table or Timeline */}
      {viewMode === 'table' ? (
        <AuditLogsTable
          logs={logs}
          isLoading={isLoading}
          totalCount={totalCount}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          humanMode={humanMode}
        />
      ) : (
        <AuditLogsTimeline
          logs={logs}
          isLoading={isLoading}
          totalCount={totalCount}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          humanMode={humanMode}
        />
      )}
    </div>
  );
}

export default AuditLogsPage;
