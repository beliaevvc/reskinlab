import { useState } from 'react';
import { useFinalizeSpecification } from '../../hooks/useSpecifications';
import { useCreateOffer } from '../../hooks/useOffers';

export function FinalizeConfirmModal({ isOpen, onClose, specification, onSuccess }) {
  const finalizeSpec = useFinalizeSpecification();
  const createOffer = useCreateOffer();
  const [step, setStep] = useState('confirm'); // 'confirm' | 'finalizing' | 'creating_offer'
  const [error, setError] = useState(null);

  const handleFinalize = async () => {
    try {
      setError(null);
      setStep('finalizing');
      
      // 1. Finalize the specification
      const result = await finalizeSpec.mutateAsync(specification.id);
      
      // 2. Automatically create the offer
      setStep('creating_offer');
      const offer = await createOffer.mutateAsync(specification.id);

      if (onSuccess) {
        onSuccess({ specification: result, offer });
      }

      setStep('confirm');
      onClose();
    } catch (err) {
      console.error('Failed to finalize specification or create offer:', err);
      setError(err.message || 'An error occurred');
      setStep('confirm');
    }
  };
  
  const isPending = step === 'finalizing' || step === 'creating_offer';

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-md shadow-xl max-w-xl w-full p-6">
        {/* Icon */}
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Finalize Specification?
          </h2>
          <p className="text-neutral-600">
            You are about to finalize{' '}
            <span className="font-medium">{specification?.version}</span>.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-6">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm text-amber-800 font-medium">
                This action cannot be undone
              </p>
              <p className="text-sm text-amber-700 mt-1">
                Once finalized, this specification cannot be edited. An offer
                will be automatically created for client approval.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {step === 'finalizing' ? 'Finalizing...' : 'Creating Offer...'}
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Finalize &amp; Create Offer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FinalizeConfirmModal;
