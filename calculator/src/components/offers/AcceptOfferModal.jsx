import { useState, useRef, useEffect } from 'react';
import { useAcceptOffer } from '../../hooks/useOffers';
import { LegalDocument } from './LegalTextModal';
import { printLegalText } from '../../lib/printUtils';

export function AcceptOfferModal({ isOpen, onClose, offer }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const { mutate: acceptOffer, isPending } = useAcceptOffer();
  const scrollRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setHasAgreed(false);
    }
  }, [isOpen]);

  // Check if content is short enough that no scroll is needed
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      const { scrollHeight, clientHeight } = scrollRef.current;
      if (scrollHeight <= clientHeight + 10) {
        setHasScrolledToBottom(true);
      }
    }
  }, [isOpen, offer?.legal_text]);

  if (!isOpen || !offer) return null;

  const canAccept = hasScrolledToBottom && hasAgreed;

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container || hasScrolledToBottom) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = () => {
    acceptOffer(
      {
        offerId: offer.id,
        userAgent: navigator.userAgent,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          alert('Failed to accept offer: ' + error.message);
        },
      }
    );
  };

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-5 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-neutral-900">
                  Accept Offer {offer.number}
                </h2>
                <p className="text-xs text-neutral-400">
                  Please read the terms carefully before accepting
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={printLegalText}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                hasScrolledToBottom
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }`}>
                {hasScrolledToBottom ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <span className={`text-xs font-medium ${hasScrolledToBottom ? 'text-emerald-600' : 'text-neutral-500'}`}>
                Read terms
              </span>
            </div>

            <div className="w-8 h-px bg-neutral-200" />

            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                hasAgreed
                  ? 'bg-emerald-500 text-white'
                  : 'bg-neutral-200 text-neutral-500'
              }`}>
                {hasAgreed ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '2'}
              </div>
              <span className={`text-xs font-medium ${hasAgreed ? 'text-emerald-600' : 'text-neutral-500'}`}>
                Confirm agreement
              </span>
            </div>

            <div className="w-8 h-px bg-neutral-200" />

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-neutral-200 text-neutral-500">
                3
              </div>
              <span className="text-xs font-medium text-neutral-500">
                Accept
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable document content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-8 bg-neutral-50/50"
        >
          <div id="legal-text-view" className="bg-white rounded-lg border border-neutral-200 p-8 shadow-sm">
            <LegalDocument text={offer.legal_text} />
          </div>
        </div>

        {/* Scroll indicator — overlays bottom of scroll area */}
        {!hasScrolledToBottom && (
          <div className="pointer-events-none" style={{ marginTop: '-3.5rem' }}>
            <div className="h-14 bg-gradient-to-t from-neutral-100 to-transparent flex items-end justify-center pb-3">
              <div className="flex items-center gap-2 text-xs text-neutral-500 animate-bounce">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Scroll to read all terms
              </div>
            </div>
          </div>
        )}

        {/* Agreement checkbox */}
        <div className="px-8 py-4 border-t border-neutral-200 bg-white flex-shrink-0">
          <label className={`flex items-start gap-3 cursor-pointer ${!hasScrolledToBottom ? 'opacity-50 pointer-events-none' : ''}`}>
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-0.5 h-5 w-5 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500 disabled:opacity-50"
            />
            <span className="text-sm text-neutral-700 leading-relaxed">
              I have read and understood the terms of this offer. I agree to all conditions
              and confirm my intention to proceed with the order as specified.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-neutral-700 font-medium hover:bg-neutral-200 rounded-lg transition-colors text-sm"
          >
            Cancel
          </button>

          <button
            onClick={handleAccept}
            disabled={!canAccept || isPending}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              canAccept
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accept Offer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AcceptOfferModal;
