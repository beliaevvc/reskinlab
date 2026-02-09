import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDeliveryStatusInfo } from '../../hooks/useDelivery';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  revision_requested: 'bg-red-100 text-red-800 border-red-200',
};

export function DeliveryCard({ 
  delivery, 
  onApprove, 
  onRequestRevision,
  onViewFiles,
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const { isClient, isStaff } = useAuth();

  const statusInfo = getDeliveryStatusInfo(delivery.status);

  const handleApprove = () => {
    onApprove?.(delivery.id, feedback || null);
    setShowFeedback(false);
    setFeedback('');
  };

  const handleRequestRevision = () => {
    if (!feedback.trim()) {
      alert(t('delivery.feedbackRequired'));
      return;
    }
    onRequestRevision?.(delivery.id, feedback);
    setShowFeedback(false);
    setFeedback('');
  };

  return (
    <div className={`bg-white rounded-md border overflow-hidden ${
      delivery.status === 'pending' ? 'border-amber-200' :
      delivery.status === 'approved' ? 'border-emerald-200' :
      'border-red-200'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{statusInfo.icon}</span>
            <h3 className="font-semibold text-neutral-900">{delivery.title}</h3>
          </div>
          {delivery.stage && (
            <p className="text-sm text-neutral-500 mt-1">
              Stage: {delivery.stage.name}
            </p>
          )}
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
          STATUS_STYLES[delivery.status]
        }`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Description */}
      {delivery.description && (
        <div className="p-4 border-b border-neutral-100">
          <p className="text-neutral-700 whitespace-pre-wrap">{delivery.description}</p>
        </div>
      )}

      {/* Files preview */}
      {delivery.files?.length > 0 && (
        <div className="p-4 border-b border-neutral-100 bg-neutral-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">
              {t('delivery.attachedFiles', { count: delivery.files.length })}
            </span>
            <button
              onClick={() => onViewFiles?.(delivery.files)}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              {t('delivery.viewAll')}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {delivery.files.slice(0, 4).map((file) => (
              <div
                key={file.id}
                className="bg-white border border-neutral-200 rounded px-2 py-1 text-xs text-neutral-600 truncate max-w-[150px]"
                title={file.filename}
              >
                📎 {file.filename}
              </div>
            ))}
            {delivery.files.length > 4 && (
              <span className="text-xs text-neutral-500 self-center">
                {t('delivery.more', { count: delivery.files.length - 4 })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Revision history */}
      {delivery.revision_count > 0 && (
        <div className="p-4 border-b border-neutral-100 bg-amber-50">
          <p className="text-sm text-amber-700">
            🔄 {t('delivery.revisionsRequested', { count: delivery.revision_count })}
          </p>
        </div>
      )}

      {/* Client feedback (if exists) */}
      {delivery.client_feedback && (
        <div className="p-4 border-b border-neutral-100">
          <p className="text-sm font-medium text-neutral-700 mb-1">{t('delivery.clientFeedback')}</p>
          <p className="text-neutral-600 text-sm whitespace-pre-wrap bg-neutral-50 p-3 rounded">
            {delivery.client_feedback}
          </p>
        </div>
      )}

      {/* Meta info */}
      <div className="p-4 bg-neutral-50 text-sm text-neutral-500 flex items-center justify-between">
        <div>
          <span>{t('delivery.submittedBy')} </span>
          <span className="font-medium text-neutral-700">
            {delivery.submitter?.full_name || delivery.submitter?.email}
          </span>
          <span> {formatDate(delivery.submitted_at)}</span>
        </div>
        {delivery.reviewed_at && (
          <span>
            {t('delivery.reviewed')} {formatDate(delivery.reviewed_at)}
          </span>
        )}
      </div>

      {/* Actions for client */}
      {isClient && delivery.status === 'pending' && (
        <div className="p-4 border-t border-neutral-200 bg-white">
          {!showFeedback ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFeedback(true)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded transition-colors"
              >
                ✓ {t('delivery.approveDelivery')}
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 font-medium py-2.5 rounded transition-colors"
              >
                {t('delivery.requestRevision')}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('delivery.feedbackPlaceholder')}
                className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded text-sm"
                >
                  {t('delivery.approve')}
                </button>
                <button
                  onClick={handleRequestRevision}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded text-sm"
                >
                  {t('delivery.requestRevision')}
                </button>
                <button
                  onClick={() => { setShowFeedback(false); setFeedback(''); }}
                  className="px-4 py-2 text-neutral-600 hover:text-neutral-800 text-sm"
                >
                  {t('actions.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions for staff when revision requested */}
      {isStaff && delivery.status === 'revision_requested' && (
        <div className="p-4 border-t border-neutral-200 bg-white">
          <p className="text-sm text-neutral-600 mb-3">
            {t('delivery.addressFeedback')}
          </p>
        </div>
      )}
    </div>
  );
}

export default DeliveryCard;
