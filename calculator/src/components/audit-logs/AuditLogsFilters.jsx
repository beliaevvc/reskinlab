import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuditActionTypes, useAuditEntityTypes, useAuditUsers } from '../../hooks/useAuditLogs';
import { Select } from '../Select';

/**
 * AuditLogsFilters — filter panel with presets, role/user/action/entity/date/ID filters
 */
export function AuditLogsFilters({ filters, onChange, onReset }) {
  const { t } = useTranslation('admin');
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: actionTypes } = useAuditActionTypes();
  const { data: entityTypes } = useAuditEntityTypes();
  const { data: users } = useAuditUsers();

  const ROLE_OPTIONS = [
    { value: 'all', label: t('auditLog.roles.all') },
    { value: 'admin', label: t('auditLog.roles.admin') },
    { value: 'am', label: t('auditLog.roles.am') },
    { value: 'client', label: t('auditLog.roles.client') },
  ];

  const PRESETS = [
    { id: 'today', labelKey: 'auditLog.presets.today', getFilters: () => ({ dateFrom: new Date(new Date().setHours(0, 0, 0, 0)).toISOString() }) },
    { id: '7d', labelKey: 'auditLog.presets.7days', getFilters: () => ({ dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }) },
    { id: '30d', labelKey: 'auditLog.presets.30days', getFilters: () => ({ dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }) },
    { id: 'logins', labelKey: 'auditLog.presets.logins', getFilters: () => ({ action: 'login' }) },
    { id: 'errors', labelKey: 'auditLog.presets.errors', getFilters: () => ({ action: 'failed_login' }) },
    { id: 'creates', labelKey: 'auditLog.presets.creates', getFilters: () => ({ action: 'create' }) },
    { id: 'deletes', labelKey: 'auditLog.presets.deletes', getFilters: () => ({ action: 'delete' }) },
    { id: 'finance', labelKey: 'auditLog.presets.finance', getFilters: () => ({ entityType: 'invoice' }) },
  ];

  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value, offset: 0 });
  };

  const handlePreset = (preset) => {
    const presetFilters = preset.getFilters();
    onChange({ ...getDefaultFilters(), ...presetFilters });
  };

  const activePreset = PRESETS.find(p => {
    const pf = p.getFilters();
    return Object.keys(pf).every(k => filters[k] === pf[k]);
  });

  return (
    <div className="bg-white rounded-lg border border-neutral-200">
      {/* Presets row */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{t('auditLog.quickFilters.title')}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              {t('auditLog.quickFilters.resetAll')}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors sm:hidden"
            >
              {isExpanded ? t('auditLog.quickFilters.collapse') : t('auditLog.quickFilters.expand')}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => (
            <button
              key={preset.id}
              onClick={() => handlePreset(preset)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                activePreset?.id === preset.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {t(preset.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed filters — collapsible on mobile */}
      {isExpanded && (
        <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Role filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('auditLog.filters.role')}</label>
            <Select
              value={filters.userRole || 'all'}
              onChange={(val) => handleChange('userRole', val)}
              options={ROLE_OPTIONS}
            />
          </div>

          {/* User filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('auditLog.filters.user')}</label>
            <Select
              value={filters.userId || ''}
              onChange={(val) => handleChange('userId', val || undefined)}
              options={[
                { value: '', label: t('auditLog.options.allUsers') },
                ...(users || []).map(u => ({
                  value: u.id,
                  label: `${u.full_name || u.email} (${u.role})`,
                })),
              ]}
            />
          </div>

          {/* Action type filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('auditLog.filters.action')}</label>
            <Select
              value={filters.action || 'all'}
              onChange={(val) => handleChange('action', val)}
              options={[
                { value: 'all', label: t('auditLog.options.allActions') },
                ...(actionTypes || []).map(a => ({ value: a, label: a })),
              ]}
            />
          </div>

          {/* Entity type filter */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('auditLog.filters.entityType')}</label>
            <Select
              value={filters.entityType || 'all'}
              onChange={(val) => handleChange('entityType', val)}
              options={[
                { value: 'all', label: t('auditLog.options.allEntities') },
                ...(entityTypes || []).map(e => ({ value: e, label: e })),
              ]}
            />
          </div>

          {/* Date from */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('auditLog.filters.from')}</label>
            <input
              type="date"
              value={filters.dateFrom ? filters.dateFrom.split('T')[0] : ''}
              onChange={(e) => handleChange('dateFrom', e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined)}
              className="w-full border border-neutral-200 rounded-lg bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">{t('auditLog.filters.to')}</label>
            <input
              type="date"
              value={filters.dateTo ? filters.dateTo.split('T')[0] : ''}
              onChange={(e) => handleChange('dateTo', e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined)}
              className="w-full border border-neutral-200 rounded-lg bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-neutral-300 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function getDefaultFilters() {
  return {
    action: 'all',
    userId: undefined,
    userRole: 'all',
    entityType: 'all',
    entityId: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 100,
    offset: 0,
  };
}

export default AuditLogsFilters;
