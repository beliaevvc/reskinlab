import { useState } from 'react';
import { useAcceptOffer } from '../../hooks/useOffers';
import { LegalTextViewer } from './LegalTextViewer';

export function AcceptOfferModal({ isOpen, onClose, offer }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const { mutate: acceptOffer, isPending } = useAcceptOffer();

  if (!isOpen || !offer) return null;

  const canAccept = hasScrolledToBottom && hasAgreed;

  const handleAccept = () => {
    acceptOffer(
      {
        offerId: offer.id,
        userAgent: navigator.userAgent,
      },
      {
        onSuccess: () => {
          // Just close - the OfferModal will refresh and show invoices
          onClose();
        },
        onError: (error) => {
          alert('Failed to accept offer: ' + error.message);
        },
      }
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">
            Accept Offer {offer.number}
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Please read the terms carefully before accepting
          </p>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <LegalTextViewer
            text={offer.legal_text}
            onScrolledToBottom={() => setHasScrolledToBottom(true)}
          />

          {/* Checkbox */}
          <label className="flex items-start gap-3 mt-6 cursor-pointer">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-1 h-5 w-5 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
            />
            <span className={`text-sm ${hasScrolledToBottom ? 'text-neutral-900' : 'text-neutral-400'}`}>
              I have read and understood the terms of this offer. I agree to all conditions
              and confirm my intention to proceed with the order as specified.
            </span>
          </label>

          {!hasScrolledToBottom && (
            <p className="text-sm text-amber-600 mt-3">
              Please scroll down to read all terms before you can accept.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">
              {canAccept ? 'Ready to accept' : 'Complete all steps to accept'}
            </span>
            <button
              onClick={handleAccept}
              disabled={!canAccept || isPending}
              className={`flex items-center gap-2 px-6 py-2.5 rounded font-medium transition-colors ${
                canAccept
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              }`}
            >
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processing...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
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
                  Accept Offer
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AcceptOfferModal;
