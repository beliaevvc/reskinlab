import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useOffer, useLogOfferView } from '../../hooks/useOffers';
import { formatDate, formatCurrency } from '../../lib/utils';
import { getOfferStatusInfo, isOfferExpired } from '../../lib/offerUtils';
import { getInvoiceStatusInfo, formatInvoiceAmount } from '../../lib/invoiceUtils';
import { AcceptOfferModal, LegalTextViewer } from '../../components/offers';
import { SpecificationView } from '../../components';
import { prepareSpecificationForView } from '../../lib/specificationHelpers';

// Get base path based on current location
function useOfferBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin/offers';
  if (location.pathname.startsWith('/am')) return '/am/offers';
  return '/offers';
}

export function OfferDetailPage() {
  const { id: offerId } = useParams();
  const basePath = useOfferBasePath();
  const { data: offer, isLoading, error } = useOffer(offerId);
  const { mutate: logView } = useLogOfferView();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showFullSpecification, setShowFullSpecification] = useState(false);

  // Log view on mount
  useEffect(() => {
    if (offerId) {
      logView(offerId);
    }
  }, [offerId, logView]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">Loading offer...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <p className="text-red-800">Failed to load offer: {error.message}</p>
        <Link to={basePath} className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
          Back to offers
        </Link>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
        <p className="text-neutral-600">Offer not found</p>
        <Link to={basePath} className="mt-4 inline-flex items-center text-emerald-600 hover:text-emerald-700">
          Back to offers
        </Link>
      </div>
    );
  }

  const spec = offer.specification;
  const project = spec?.project;
  const totals = spec?.totals_json || {};
  const statusInfo = getOfferStatusInfo(offer.status, offer.valid_until);
  const expired = isOfferExpired(offer);
  const canAccept = offer.status === 'pending' && !expired;
  
  // Подготавливаем данные для SpecificationView
  const specData = prepareSpecificationForView(spec);

  // Если показываем полную спецификацию
  if (showFullSpecification && specData) {
    return (
      <SpecificationView
        totals={specData.totals}
        globalStyle={specData.globalStyle}
        usageRights={specData.usageRights}
        paymentModel={specData.paymentModel}
        specNumber={specData.specNumber}
        specDate={specData.specDate}
        onBack={() => setShowFullSpecification(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to={basePath} className="text-neutral-500 hover:text-neutral-700 transition-colors">
          Offers
        </Link>
        <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-neutral-900 font-medium">{offer.number}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">{offer.number}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-neutral-500 mt-2">
              Project: {project?.name || 'Unknown'}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
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

          {canAccept && (
            <button
              onClick={() => setShowAcceptModal(true)}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Accept Offer
            </button>
          )}
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Cost Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-600">Production</span>
            <span className="font-medium">{formatCurrency(totals.productionSum || 0)}</span>
          </div>
          {totals.revisionCost > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">Revision Rounds ({totals.revisionRounds})</span>
              <span className="font-medium">{formatCurrency(totals.revisionCost)}</span>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount</span>
              <span className="font-medium">-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-neutral-200 flex justify-between">
            <span className="text-lg font-semibold text-neutral-900">Total</span>
            <span className="text-lg font-bold text-neutral-900">{formatCurrency(totals.grandTotal || 0)}</span>
          </div>
        </div>

        {/* View Full Specification Button */}
        {specData && Array.isArray(totals.lineItems) && totals.lineItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <button
              onClick={() => setShowFullSpecification(true)}
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              <svg 
                className="w-4 h-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Full Specification ({totals.lineItems.length} items)
            </button>
          </div>
        )}
      </div>

      {/* Invoices */}
      {offer.invoices?.length > 0 && (
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Payment Schedule</h2>
          <div className="space-y-3">
            {offer.invoices.map((invoice) => {
              const invStatus = getInvoiceStatusInfo(invoice.status);
              return (
                <Link
                  key={invoice.id}
                  to={`/invoices/${invoice.id}`}
                  className="flex items-center justify-between p-4 border border-neutral-200 rounded hover:border-emerald-300 hover:bg-neutral-50 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center font-semibold text-neutral-600">
                      {invoice.milestone_order}
                    </div>
                    <div>
                      <div className="font-medium text-neutral-900">{invoice.milestone_name}</div>
                      <div className="text-sm text-neutral-500">{invoice.number}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${invStatus.bgClass} ${invStatus.textClass}`}>
                      {invStatus.label}
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {formatInvoiceAmount(invoice.amount_usd)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Terms & Conditions</h2>
        <LegalTextViewer text={offer.legal_text} />
      </div>

      {/* Accept Modal */}
      <AcceptOfferModal
        isOpen={showAcceptModal}
        onClose={() => setShowAcceptModal(false)}
        offer={offer}
      />
    </div>
  );
}

export default OfferDetailPage;
