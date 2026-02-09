import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * AuditLogsHeader — page title, export buttons, auto-refresh toggle
 */
export function AuditLogsHeader({ onExportCSV, onExportJSON, onPrint, autoRefresh, onToggleAutoRefresh, humanMode, onToggleHumanMode }) {
  const { t } = useTranslation('admin');
  const [isExporting, setIsExporting] = useState(null); // 'csv' | 'json' | null

  const handleExport = async (type) => {
    setIsExporting(type);
    try {
      if (type === 'csv') await onExportCSV();
      if (type === 'json') await onExportJSON();
    } catch (err) {
      console.error(`Export ${type} failed:`, err);
    }
    setIsExporting(null);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('auditLog.title')}</h1>
        <p className="text-neutral-500 mt-1">{t('auditLog.subtitle')}</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Human mode toggle */}
        <button
          onClick={onToggleHumanMode}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
            humanMode
              ? 'bg-blue-100 text-blue-700'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
          title={humanMode ? t('auditLog.header.humanModeTitle') : t('auditLog.header.rawModeTitle')}
        >
          {humanMode ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          )}
          {humanMode ? t('auditLog.header.humanMode') : t('auditLog.header.rawMode')}
        </button>

        {/* Auto-refresh toggle */}
        <button
          onClick={onToggleAutoRefresh}
          className={`flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-colors ${
            autoRefresh
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          }`}
          title={autoRefresh ? t('auditLog.header.liveOn') : t('auditLog.header.liveOff')}
        >
          <svg className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('auditLog.header.live')}
        </button>

        {/* Export CSV */}
        <button
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isExporting === 'csv' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-400 border-t-transparent" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          CSV
        </button>

        {/* Export JSON */}
        <button
          onClick={() => handleExport('json')}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isExporting === 'json' ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-400 border-t-transparent" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          )}
          JSON
        </button>

        {/* Print */}
        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          {t('auditLog.header.print')}
        </button>
      </div>
    </div>
  );
}

export default AuditLogsHeader;
