import { useTranslation } from 'react-i18next';
import { formatDate } from '../../lib/utils';
import { getApprovalStatusInfo, getApprovalTypeLabel } from '../../hooks/useApprovals';

export function ApprovalCard({ approval, onClick }) {
  const { t } = useTranslation('common');
  const statusInfo = getApprovalStatusInfo(approval.status);
  const isPending = approval.status === 'pending';
  const isOverMaxRounds = approval.revision_round > approval.max_free_rounds;

  return (
    <div
      onClick={() => onClick?.(approval)}
      className={`
        bg-white rounded-md border p-4 transition-all cursor-pointer
        ${isPending
          ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300'
          : 'border-neutral-200 hover:border-neutral-300'}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Type & Stage */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-900">
              {getApprovalTypeLabel(approval.approval_type)}
            </span>
            {approval.stage && (
              <>
                <span className="text-neutral-300">•</span>
                <span className="text-sm text-neutral-600">
                  {approval.stage.name}
                </span>
              </>
            )}
          </div>

          {/* Revision round */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-neutral-500">
              Round {approval.revision_round || 1} / {approval.max_free_rounds}
            </span>
            {isOverMaxRounds && (
              <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                Extra charges may apply
              </span>
            )}
          </div>

          {/* Requested by */}
          {approval.requested_by_profile && (
            <p className="text-xs text-neutral-500 mt-2">
              Requested by {approval.requested_by_profile.full_name}
            </p>
          )}

          {/* Date */}
          <p className="text-xs text-neutral-400 mt-1">
            {formatDate(approval.created_at)}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
            {statusInfo.label}
          </span>

          {isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(approval);
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              {t('approvals.respond')}
            </button>
          )}
        </div>
      </div>

      {/* Client comment (if responded) */}
      {approval.client_comment && (
        <div className="mt-3 pt-3 border-t border-neutral-100">
          <p className="text-sm text-neutral-600 italic">
            "{approval.client_comment}"
          </p>
        </div>
      )}
    </div>
  );
}

export default ApprovalCard;
