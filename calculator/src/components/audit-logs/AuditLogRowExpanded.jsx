import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuditLogDiff } from './AuditLogDiff';

/**
 * Parse raw user-agent string into human-readable format
 */
function parseUserAgent(ua) {
  if (!ua) return 'Unknown';

  let browser = 'Unknown browser';
  let os = 'Unknown OS';

  // Detect browser (order matters — check specific first)
  if (ua.includes('Edg/')) {
    const m = ua.match(/Edg\/([\d.]+)/);
    browser = `Edge ${m ? m[1] : ''}`;
  } else if (ua.includes('OPR/') || ua.includes('Opera')) {
    const m = ua.match(/OPR\/([\d.]+)/);
    browser = `Opera ${m ? m[1] : ''}`;
  } else if (ua.includes('Chrome/') && !ua.includes('Chromium')) {
    const m = ua.match(/Chrome\/([\d.]+)/);
    browser = `Chrome ${m ? m[1] : ''}`;
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const m = ua.match(/Version\/([\d.]+)/);
    browser = `Safari ${m ? m[1] : ''}`;
  } else if (ua.includes('Firefox/')) {
    const m = ua.match(/Firefox\/([\d.]+)/);
    browser = `Firefox ${m ? m[1] : ''}`;
  }

  // Detect OS
  if (ua.includes('Mac OS X')) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    os = `macOS ${m ? m[1].replace(/_/g, '.') : ''}`;
  } else if (ua.includes('Windows NT')) {
    const v = ua.match(/Windows NT ([\d.]+)/);
    const versions = { '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' };
    os = `Windows ${v ? (versions[v[1]] || v[1]) : ''}`;
  } else if (ua.includes('Linux')) {
    os = ua.includes('Android') ? 'Android' : 'Linux';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    os = ua.includes('iPad') ? 'iPadOS' : 'iOS';
  }

  return `${browser} · ${os}`;
}

/**
 * Check if there are actual changes between old and new data
 */
function hasChanges(oldData, newData) {
  if (!oldData && !newData) return false;
  if (!oldData || !newData) return true;
  return JSON.stringify(oldData) !== JSON.stringify(newData);
}

/**
 * Check if metadata has enough content to display separately
 */
function isMetadataRich(metadata) {
  if (!metadata) return false;
  // Filter out internal fields
  const keys = Object.keys(metadata).filter(k => !k.startsWith('_'));
  if (keys.length === 0) return false;
  if (keys.length >= 3) return true;
  return keys.some(k => typeof metadata[k] === 'object' && metadata[k] !== null);
}

/**
 * Inner content of the expanded row — shared between table and mobile views
 */
function ExpandedContent({ log }) {
  const { t } = useTranslation('admin');
  const [copied, setCopied] = useState(false);

  const handleCopyJSON = () => {
    const jsonData = {
      id: log.id,
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_id,
      user_role: log.user_role,
      user: log.user?.full_name || log.user?.email,
      old_data: log.old_data,
      new_data: log.new_data,
      metadata: log.metadata,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      created_at: log.created_at,
    };
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showDiff = hasChanges(log.old_data, log.new_data);
  const showMetadata = isMetadataRich(log.metadata);
  const hasConnectionInfo = log.ip_address || log.user_agent;
  const hasAnyContent = showDiff || showMetadata || hasConnectionInfo || log.entity_id;

  if (!hasAnyContent) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs text-neutral-400">{t('auditLog.details.noAdditional')}</span>
        <CopyButton copied={copied} onClick={handleCopyJSON} t={t} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Diff — only if there are actual changes */}
      {showDiff && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2">{t('auditLog.details.changes')}</h4>
          <AuditLogDiff oldData={log.old_data} newData={log.new_data} />
        </div>
      )}

      {/* Metadata — only if rich enough */}
      {showMetadata && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase mb-1">{t('auditLog.details.metadata')}</h4>
          <pre className="bg-white border border-neutral-200 rounded p-2 text-xs font-mono text-neutral-700 overflow-x-auto max-h-[200px]">
            {JSON.stringify(
              Object.fromEntries(Object.entries(log.metadata).filter(([k]) => !k.startsWith('_'))),
              null, 2
            )}
          </pre>
        </div>
      )}

      {/* Connection info */}
      {hasConnectionInfo && (
        <div className="space-y-1 text-xs text-neutral-500">
          {log.ip_address && (
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                <span className="font-medium text-neutral-400">{t('auditLog.details.ip')}</span>{' '}
                <span className="font-mono">{log.ip_address}</span>
              </span>
              {log.metadata?._geo && (
                <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                  📍 {[log.metadata._geo.city, log.metadata._geo.country].filter(Boolean).join(', ')}
                  {log.metadata._geo.isp && (
                    <span className="text-neutral-400"> · {log.metadata._geo.isp}</span>
                  )}
                </span>
              )}
            </div>
          )}
          {log.user_agent && (
            <div>
              <span className="font-medium text-neutral-400">{t('auditLog.details.browser')}</span>{' '}
              <span>{parseUserAgent(log.user_agent)}</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between pt-1">
        {log.entity_id ? (
          <span className="text-xs text-neutral-400 font-mono">{log.entity_id}</span>
        ) : (
          <span />
        )}
        <CopyButton copied={copied} onClick={handleCopyJSON} t={t} />
      </div>
    </div>
  );
}

function CopyButton({ copied, onClick, t }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded text-xs font-medium transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      {copied ? t('auditLog.details.copied') : t('auditLog.details.copyJson')}
    </button>
  );
}

/**
 * AuditLogRowExpanded — for table view (wraps in <tr>)
 */
export function AuditLogRowExpanded({ log }) {
  return (
    <tr>
      <td colSpan={7} className="px-4 py-3 bg-neutral-50 border-b border-neutral-200">
        <ExpandedContent log={log} />
      </td>
    </tr>
  );
}

/**
 * AuditLogCardExpanded — for mobile card view (plain div)
 */
export function AuditLogCardExpanded({ log }) {
  return (
    <div className="px-4 pb-4 bg-neutral-50">
      <ExpandedContent log={log} />
    </div>
  );
}

export default AuditLogRowExpanded;
