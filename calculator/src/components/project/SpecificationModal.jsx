import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Get base path based on current location
function useBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin';
  if (location.pathname.startsWith('/am')) return '/am';
  return '';
}
import { useSpecification, useAdminDeleteSpecification } from '../../hooks/useSpecifications';
import { useOfferBySpecification } from '../../hooks/useOffers';
import { useAuth } from '../../contexts/AuthContext';
import { FinalizeConfirmModal } from '../specifications';
import { SpecificationView } from '../SpecificationView';
import { prepareSpecificationForView } from '../../lib/specificationHelpers';
import { printSpecification } from '../../lib/printUtils';

export function SpecificationModal({ isOpen, onClose, specificationId, onEdit, onViewOffer }) {
  const { t } = useTranslation('specs');
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { isAdmin } = useAuth();
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: specification, isLoading, error } = useSpecification(specificationId);
  const { data: existingOffer } = useOfferBySpecification(specificationId);
  const deleteSpec = useAdminDeleteSpecification();

  if (!isOpen) return null;

  const isDraft = specification?.status === 'draft';
  const isFinalized = specification?.status === 'finalized';
  const hasOffer = !!existingOffer;
  const specData = prepareSpecificationForView(specification);

  const handleEdit = () => {
    if (!specification || !isDraft) return;
    if (onEdit) {
      onEdit(specification.id);
      onClose();
    }
  };

  const handleViewOffer = () => {
    if (existingOffer) {
      if (onViewOffer) {
        onClose();
        onViewOffer(existingOffer);
      } else {
        navigate(`${basePath}/offers/${existingOffer.id}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!specification) return;
    try {
      await deleteSpec.mutateAsync({
        specId: specification.id,
        projectId: specification.project_id,
      });
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete specification:', err);
    }
  };

  return createPortal(
    <>
      <div 
        className="flex items-start justify-center overflow-y-auto py-8 bg-black/50"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 99999 }}>
        <div 
          className="bg-white rounded-lg w-full max-w-4xl mx-4 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between rounded-t-lg z-10">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-neutral-900">
                {t('view.header')} {specification?.number || specification?.version || ''}
              </h2>
              {specification && (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  isDraft
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {isDraft ? t('card.draft') : t('card.finalized')}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Action buttons for draft specs - available for everyone */}
              {specification && isDraft && (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {t('card.edit')}
                  </button>
                  <button
                    onClick={() => setShowFinalizeModal(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('detail.finalize', { defaultValue: 'Finalize' })}
                  </button>
                </>
              )}
              {specification && isFinalized && hasOffer && (
                <button
                  onClick={handleViewOffer}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium px-3 py-1.5 rounded transition-colors"
                >
                  {t('detail.viewOffer', { defaultValue: 'View Offer' })}
                </button>
              )}

              {/* Print button */}
              {specification && specData && (
                <button
                  onClick={printSpecification}
                  className="flex items-center gap-2 px-3 py-1.5 rounded border border-neutral-300 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-colors"
                  title={t('common:print')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  {t('common:print')}
                </button>
              )}

              {/* Admin delete button */}
              {specification && isAdmin && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 hover:bg-red-100 rounded text-neutral-400 hover:text-red-600 transition-colors"
                  title={t('common:actions.delete')}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-neutral-100 rounded text-neutral-500 hover:text-neutral-700 ml-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                  <p className="text-sm text-neutral-500">{t('detail.loading')}</p>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
                <p className="text-red-800">{t('common:error')}</p>
              </div>
            ) : !specification || !specData ? (
              <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
                <p className="text-neutral-600">{t('detail.notFound')}</p>
              </div>
            ) : (
              <div id="specification-view" className="bg-white">
                <SpecificationView
                  totals={specData.totals}
                  globalStyle={specData.globalStyle}
                  usageRights={specData.usageRights}
                  paymentModel={specData.paymentModel}
                  specNumber={specData.specNumber}
                  specDate={specData.specDate}
                  noWrapper={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Finalize Modal */}
      {specification && (
        <FinalizeConfirmModal
          isOpen={showFinalizeModal}
          onClose={() => setShowFinalizeModal(false)}
          specification={specification}
          onSuccess={() => {
            setShowFinalizeModal(false);
            onClose(); // Close the main specification modal too
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                {t('modal.deleteTitle', { defaultValue: 'Delete Specification?' })}
              </h3>
              <p className="text-neutral-600">
                {t('modal.deleteAbout', { defaultValue: 'You are about to delete' })} <span className="font-medium">{specification?.number || `v${specification?.version_number || specification?.version}`}</span>.
                {hasOffer && (
                  <span className="block mt-2 text-red-600 font-medium">
                    {t('modal.deleteOfferWarning', { defaultValue: 'This will also delete the associated offer!' })}
                  </span>
                )}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <p className="text-sm text-red-800">
                {t('modal.deleteWarning', { defaultValue: 'This action cannot be undone. The specification and all related data will be permanently deleted.' })}
              </p>
            </div>

            {deleteSpec.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-800">
                  {deleteSpec.error.message || t('common:error')}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteSpec.isPending}
                className="flex-1 px-4 py-2.5 rounded border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                {t('common:actions.cancel')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteSpec.isPending}
                className="flex-1 px-4 py-2.5 rounded bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deleteSpec.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    {t('common:deleting', { defaultValue: 'Deleting...' })}
                  </>
                ) : (
                  t('common:actions.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}

export default SpecificationModal;
