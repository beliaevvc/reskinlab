import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useOffer, useLogOfferView } from '../../hooks/useOffers';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate, formatCurrency } from '../../lib/utils';
import { getOfferStatusInfo, isOfferExpired } from '../../lib/offerUtils';
import { getInvoiceStatusInfo, formatInvoiceAmount } from '../../lib/invoiceUtils';
import { AcceptOfferModal, LegalTextViewer } from '../../components/offers';
import { SpecificationView } from '../../components';
import { prepareSpecificationForView } from '../../lib/specificationHelpers';
import { printSpecification } from '../../lib/printUtils';
import { InvoiceModal } from './InvoiceModal';

export function OfferModal({ isOpen, onClose, offerId }) {
  const { isAdmin } = useAuth();
  const { data: offer, isLoading, error } = useOffer(isOpen ? offerId : null);
  const { mutate: logView } = useLogOfferView();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [view, setView] = useState('summary'); // 'summary' | 'specification'

  // Log view on mount
  useEffect(() => {
    if (isOpen && offerId) {
      logView(offerId);
    }
  }, [isOpen, offerId, logView]);

  // Reset view when modal opens
  useEffect(() => {
    if (isOpen) {
      setView('summary');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Loading state
  if (isLoading) {
    return createPortal(
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            <p className="text-sm text-neutral-500">Loading offer...</p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Error state
  if (error || !offer) {
    return createPortal(
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="text-red-600 mb-4">
            {error ? `Failed to load offer: ${error.message}` : 'Offer not found'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    );
  }

  const spec = offer.specification;
  const project = spec?.project;
  const totals = spec?.totals_json || {};
  const statusInfo = getOfferStatusInfo(offer.status, offer.valid_until);
  const expired = isOfferExpired(offer);
  const canAccept = offer.status === 'pending' && !expired && !isAdmin;
  const specData = prepareSpecificationForView(spec);

  // Specification view
  if (view === 'specification' && specData) {
    return createPortal(
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setView('summary')}
                className="p-1 hover:bg-neutral-100 rounded"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-neutral-900">
                Specification Details
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={printSpecification}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm font-medium transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Specification content */}
          <div className="flex-1 overflow-auto p-6">
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
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-neutral-900">
              Offer {offer.number}
            </h2>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
              {statusInfo.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Project & Dates Info */}
          <div className="flex items-center justify-between text-sm text-neutral-500">
            <span>Project: {project?.name || 'Unknown'}</span>
            <div className="flex items-center gap-4">
              <span>Created {formatDate(offer.created_at)}</span>
              {offer.valid_until && offer.status === 'pending' && (
                <span className={expired ? 'text-red-600' : ''}>
                  {expired ? 'Expired' : 'Valid until'} {formatDate(offer.valid_until)}
                </span>
              )}
              {offer.accepted_at && (
                <span className="text-emerald-600">
                  Accepted {formatDate(offer.accepted_at)}
                </span>
              )}
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Cost Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Production</span>
                <span className="font-medium">{formatCurrency(totals.productionSum || 0)}</span>
              </div>
              {totals.revisionCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Revision Rounds ({totals.revisionRounds})</span>
                  <span className="font-medium">{formatCurrency(totals.revisionCost)}</span>
                </div>
              )}
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatCurrency(totals.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-neutral-200 flex justify-between">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="font-bold text-neutral-900">{formatCurrency(totals.grandTotal || 0)}</span>
              </div>
            </div>

            {/* View Specification Button */}
            {specData && Array.isArray(totals.lineItems) && totals.lineItems.length > 0 && (
              <button
                onClick={() => setView('specification')}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Full Specification ({totals.lineItems.length} items)
              </button>
            )}
          </div>

          {/* Invoices / Payment Schedule */}
          {offer.invoices?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Payment Schedule</h3>
              <div className="space-y-2">
                {offer.invoices.map((invoice) => {
                  const invStatus = getInvoiceStatusInfo(invoice.status);
                  return (
                    <button
                      key={invoice.id}
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className="w-full flex items-center justify-between p-3 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center font-semibold text-sm text-neutral-600">
                          {invoice.milestone_order}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-neutral-900">{invoice.milestone_name}</div>
                          <div className="text-xs text-neutral-500">{invoice.number}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${invStatus.bgClass} ${invStatus.textClass}`}>
                          {invStatus.label}
                        </span>
                        <span className="font-semibold text-sm text-neutral-900">
                          {formatInvoiceAmount(invoice.amount_usd)}
                        </span>
                        <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Terms & Conditions (collapsed by default) */}
          {offer.legal_text && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-700 flex items-center gap-2">
                <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Terms & Conditions
              </summary>
              <div className="mt-3 pl-6">
                <LegalTextViewer text={offer.legal_text} />
              </div>
            </details>
          )}
        </div>

        {/* Footer */}
        {canAccept && (
          <div className="px-6 py-4 border-t border-neutral-200 flex justify-end">
            <button
              onClick={() => setShowAcceptModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept Offer
            </button>
          </div>
        )}
      </div>

      {/* Accept Modal */}
      <AcceptOfferModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        offer={offer}
      />

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />
    </div>,
    document.body
  );
}

export default OfferModal;
