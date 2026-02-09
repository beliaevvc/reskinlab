import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from '../../lib/utils';

// ─── Icon map by notification type ──────────────────────────────────
const ICONS = {
  comment: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  ),
  task_status_change: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15a2.25 2.25 0 0 1 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  ),
  offer_created: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  ),
  offer_accepted: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  offer_cancelled: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  invoice_created: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  payment_received: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  ),
  payment_confirmed: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  project_created: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  ),
  project_status_change: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
    </svg>
  ),
  stage_change: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
    </svg>
  ),
  spec_finalized: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
    </svg>
  ),
  new_client: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
    </svg>
  ),
  am_action: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  ),
  file_uploaded: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
    </svg>
  ),
};

// ─── Icon color by notification type ────────────────────────────────
const ICON_COLORS = {
  comment: 'text-blue-500 bg-blue-50',
  task_status_change: 'text-purple-500 bg-purple-50',
  offer_created: 'text-orange-500 bg-orange-50',
  offer_accepted: 'text-green-500 bg-green-50',
  offer_cancelled: 'text-red-500 bg-red-50',
  invoice_created: 'text-amber-600 bg-amber-50',
  payment_received: 'text-emerald-500 bg-emerald-50',
  payment_confirmed: 'text-green-600 bg-green-50',
  project_created: 'text-emerald-500 bg-emerald-50',
  project_status_change: 'text-emerald-600 bg-emerald-50',
  stage_change: 'text-indigo-500 bg-indigo-50',
  spec_finalized: 'text-teal-500 bg-teal-50',
  new_client: 'text-cyan-500 bg-cyan-50',
  am_action: 'text-slate-600 bg-slate-100',
  file_uploaded: 'text-violet-500 bg-violet-50',
};

const DEFAULT_ICON = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
);

// ─── Status badge colors ────────────────────────────────────────────
const STATUS_BADGE_COLORS = {
  backlog: 'bg-neutral-100 text-neutral-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
  active: 'bg-green-100 text-green-700',
  in_production: 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-neutral-100 text-neutral-600',
  accepted: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  paid: 'bg-green-100 text-green-700',
};

function StatusBadge({ status }) {
  if (!status) return null;
  const label = status.replace(/_/g, ' ');
  const colors = STATUS_BADGE_COLORS[status] || 'bg-neutral-100 text-neutral-600';
  return (
    <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded capitalize ${colors}`}>
      {label}
    </span>
  );
}

// ─── Structured content renderer ────────────────────────────────────
// Uses metadata to render rich styled notifications instead of flat text.
function RichContent({ notification }) {
  const { t } = useTranslation('notifications');
  const { type, metadata, body } = notification;
  const m = metadata || {};

  switch (type) {
    case 'comment':
      return (
        <>
          <p className="text-sm leading-snug text-neutral-700">
            <span className="font-semibold text-neutral-900">{m.author_name || t('types.comment.someone')}</span>
            {' '}{t('types.comment.commentedOn')}{' '}
            <span className="font-medium text-neutral-800">{m.task_title || t('types.comment.aTask')}</span>
          </p>
          {body && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate italic">
              &ldquo;{body}&rdquo;
            </p>
          )}
        </>
      );

    case 'task_status_change':
      return (
        <>
          <p className="text-sm leading-snug text-neutral-700">
            <span className="font-medium text-neutral-800">{m.task_title || t('common:task')}</span>
            {' '}{t('types.task_status_change.movedTo')}{' '}
            <StatusBadge status={m.new_status} />
          </p>
          {m.project_name && (
            <p className="text-xs text-neutral-400 mt-0.5">{m.project_name}</p>
          )}
        </>
      );

    case 'offer_created':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.offer_created.newOffer')}{' '}
          {m.offer_number && <span className="font-mono text-xs text-neutral-500">#{m.offer_number}</span>}
          {' '}{t('types.offer_created.for')}{' '}
          <span className="font-medium text-neutral-800">{m.project_name || t('types.offer_created.project')}</span>
        </p>
      );

    case 'offer_accepted':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.offer_accepted.offer')}{' '}
          {m.offer_number && <span className="font-mono text-xs text-neutral-500">#{m.offer_number}</span>}
          {' '}
          <StatusBadge status="accepted" />
          {m.project_name && (
            <span className="text-neutral-500"> — {m.project_name}</span>
          )}
        </p>
      );

    case 'offer_cancelled':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.offer_cancelled.offer')}{' '}
          {m.offer_number && <span className="font-mono text-xs text-neutral-500">#{m.offer_number}</span>}
          {' '}
          <StatusBadge status="cancelled" />
          {m.project_name && (
            <span className="text-neutral-500"> — {m.project_name}</span>
          )}
        </p>
      );

    case 'invoice_created':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.invoice_created.newInvoice')}{' '}
          {m.invoice_number && <span className="font-mono text-xs text-neutral-500">#{m.invoice_number}</span>}
          {m.amount && <span className="font-semibold text-neutral-900"> ${m.amount}</span>}
          {m.project_name && (
            <span className="text-neutral-500"> — {m.project_name}</span>
          )}
        </p>
      );

    case 'payment_received':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.payment_received.paymentSubmitted')}{' '}
          {m.invoice_number && <span className="font-mono text-xs text-neutral-500">#{m.invoice_number}</span>}
          {m.amount && <span className="font-semibold text-neutral-900"> ${m.amount}</span>}
          {m.project_name && (
            <span className="text-neutral-500"> — {m.project_name}</span>
          )}
        </p>
      );

    case 'payment_confirmed':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.payment_confirmed.payment')}{' '}
          <StatusBadge status="paid" />
          {' '}{t('types.payment_confirmed.for')}{' '}
          {m.invoice_number && <span className="font-mono text-xs text-neutral-500">#{m.invoice_number}</span>}
          {m.amount && <span className="font-semibold text-neutral-900"> ${m.amount}</span>}
        </p>
      );

    case 'project_created':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.project_created.newProject')}{' '}
          <span className="font-medium text-neutral-800">{m.project_name || notification.title}</span>
          {m.client_name && (
            <span className="text-neutral-500"> {t('types.project_created.by')} {m.client_name}</span>
          )}
        </p>
      );

    case 'project_status_change':
      return (
        <>
          <p className="text-sm leading-snug text-neutral-700">
            <span className="font-medium text-neutral-800">{m.project_name || t('common:labels.project')}</span>
            {' '}{t('types.project_status_change.status')} → <StatusBadge status={m.new_status} />
          </p>
        </>
      );

    case 'stage_change': {
      // Batch format (from 052): has action + stage_names array
      const isBatch = !!m.action;
      const isActivated = m.action === 'activated';
      const stageNames = m.stage_names || [];
      const stagesCount = m.stages_count || stageNames.length || 1;

      if (isBatch) {
        return (
          <>
            <p className="text-sm leading-snug text-neutral-700">
              {stagesCount > 1 ? (
                <>
                  {isActivated ? t('types.stage_change.activatedStagesUpTo') : t('types.stage_change.deactivatedStagesFrom')}{' '}
                  <span className="font-semibold text-neutral-900">{m.target_stage_name}</span>
                </>
              ) : (
                <>
                  {t('types.stage_change.stage')}{' '}
                  <span className="font-semibold text-neutral-900">{m.target_stage_name}</span>
                  {' '}
                  <span className={`inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                    isActivated ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {isActivated ? t('types.stage_change.activated') : t('types.stage_change.deactivated')}
                  </span>
                </>
              )}
            </p>
            {stagesCount > 1 && stageNames.length > 0 && (
              <p className="text-xs text-neutral-400 mt-0.5">
                {stageNames.join(' → ')}
              </p>
            )}
            {m.project_name && (
              <p className="text-xs text-neutral-400 mt-0.5">{m.project_name}</p>
            )}
          </>
        );
      }

      // Legacy format (from old trigger): stage_name + old/new_status
      return (
        <>
          <p className="text-sm leading-snug text-neutral-700">
            {t('types.stage_change.stage')}{' '}
            <span className="font-medium text-neutral-800">{m.stage_name || 'stage'}</span>
            {' → '}
            <StatusBadge status={m.new_status} />
          </p>
          {m.project_name && (
            <p className="text-xs text-neutral-400 mt-0.5">{m.project_name}</p>
          )}
        </>
      );
    }

    case 'spec_finalized':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.spec_finalized.specFinalized')}{' '}
          {m.spec_number && <span className="font-mono text-xs text-neutral-500">#{m.spec_number}</span>}
          {m.project_name && (
            <span className="text-neutral-500"> — {m.project_name}</span>
          )}
        </p>
      );

    case 'new_client':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          {t('types.new_client.newClient')}{' '}
          <span className="font-semibold text-neutral-900">{m.client_name || m.client_email || t('types.new_client.unknown')}</span>
          {m.client_email && m.client_name && (
            <span className="text-neutral-400 text-xs ml-1">{m.client_email}</span>
          )}
        </p>
      );

    case 'am_action':
      return (
        <p className="text-sm leading-snug text-neutral-700">
          <span className="font-semibold text-neutral-900">{m.actor_name || t('types.am_action.am')}</span>
          {' '}
          <span className="text-neutral-500">{notification.title?.replace(m.actor_name + ' ', '') || m.action?.replace(/_/g, ' ')}</span>
        </p>
      );

    case 'file_uploaded':
      return (
        <>
          <p className="text-sm leading-snug text-neutral-700">
            <span className="font-semibold text-neutral-900">{m.uploader_name || t('types.file_uploaded.someone')}</span>
            {' '}{t('types.file_uploaded.uploaded')}{' '}
            <span className="font-medium text-neutral-800">{m.file_name || t('types.file_uploaded.aFile')}</span>
          </p>
          {m.project_name && (
            <p className="text-xs text-neutral-400 mt-0.5">{m.project_name}</p>
          )}
        </>
      );

    default:
      // Fallback: render title + body as plain text
      return (
        <>
          <p className="text-sm leading-snug text-neutral-700">{notification.title}</p>
          {body && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate">{body}</p>
          )}
        </>
      );
  }
}

/**
 * Single notification item — card style
 */
function NotificationItemRaw({ notification, onClick }) {
  const isUnread = !notification.read_at;
  const icon = ICONS[notification.type] || DEFAULT_ICON;
  const iconColor = ICON_COLORS[notification.type] || 'text-neutral-500 bg-neutral-100';

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={`
        w-full p-2.5 rounded-lg text-left transition-all cursor-pointer
        border hover:shadow-sm
        ${isUnread
          ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70'
          : 'border-neutral-100 bg-white hover:border-neutral-200 hover:bg-neutral-50/50'
        }
      `}
    >
      {/* Top row: icon + time + unread dot */}
      <div className="flex items-center justify-between mb-1.5">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-400">
            {formatDistanceToNow(notification.created_at)}
          </span>
          {isUnread && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0">
        <RichContent notification={notification} />
      </div>
    </button>
  );
}

export const NotificationItem = memo(NotificationItemRaw);
export default NotificationItem;
