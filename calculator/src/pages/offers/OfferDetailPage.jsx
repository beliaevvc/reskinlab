import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOffer, useLogOfferView } from '../../hooks/useOffers';
import { formatDate, formatCurrency } from '../../lib/utils';
import { getOfferStatusInfo, isOfferExpired } from '../../lib/offerUtils';
import { getInvoiceStatusInfo, formatInvoiceAmount } from '../../lib/invoiceUtils';
import { AcceptOfferModal, LegalTextModal } from '../../components/offers';
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
  const { t } = useTranslation('offers');
  const { id: offerId } = useParams();
  const basePath = useOfferBasePath();
  const { data: offer, isLoading, error } = useOffer(offerId);
  const { mutate: logView } = useLogOfferView();
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showFullSpecification, setShowFullSpecification] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
          <p className="text-sm text-neutral-500">{t('detail.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <p className="text-red-800">{t('detail.loadError', { error: error.message })}</p>
        <Link to={basePath} className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
          {t('detail.backToOffers')}
        </Link>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
        <p className="text-neutral-600">{t('detail.notFound')}</p>
        <Link to={basePath} className="mt-4 inline-flex items-center text-emerald-600 hover:text-emerald-700">
          {t('detail.backToOffers')}
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
          {t('detail.breadcrumbOffers')}
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
                {t(`status.${offer.status}`)}
              </span>
            </div>
            <p className="text-neutral-500 mt-2">
              {t('detail.project', { ns: 'invoices' })}: {project?.name || t('common:unknown')}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
              <span>{t('detail.created', { ns: 'invoices', date: formatDate(offer.created_at) })}</span>
              {offer.valid_until && offer.status === 'pending' && (
                <span className={expired ? 'text-red-600' : ''}>
                  {expired ? t('status.expired') : t('modal.validUntil')} {formatDate(offer.valid_until)}
                </span>
              )}
              {offer.accepted_at && (
                <span className="text-emerald-600">
                  {t('modal.accepted')} {formatDate(offer.accepted_at)}
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
              {t('detail.acceptOffer')}
            </button>
          )}
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('modal.costSummary')}</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-neutral-600">{t('modal.production')}</span>
            <span className="font-medium">{formatCurrency(totals.productionSum || 0)}</span>
          </div>
          {totals.revisionCost > 0 && (
            <div className="flex justify-between">
              <span className="text-neutral-600">{t('modal.revisionRounds')} ({totals.revisionRounds})</span>
              <span className="font-medium">{formatCurrency(totals.revisionCost)}</span>
            </div>
          )}
          {totals.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>{t('modal.discount')}</span>
              <span className="font-medium">-{formatCurrency(totals.discountAmount)}</span>
            </div>
          )}
          <div className="pt-3 border-t border-neutral-200 flex justify-between">
            <span className="text-lg font-semibold text-neutral-900">{t('common:labels.total')}</span>
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
              {t('detail.viewSpec', { count: totals.lineItems.length })}
            </button>
          </div>
        )}
      </div>

      {/* Invoices */}
      {offer.invoices?.length > 0 && (
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">{t('modal.paymentSchedule')}</h2>
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
                      {t(`status.${invoice.status}`, { ns: 'invoices' })}
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
      {offer.legal_text && (
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{t('legal.title')}</h2>
                <p className="text-sm text-neutral-500">{t('detail.reviewTerms', { defaultValue: 'Review the legal terms of this offer' })}</p>
              </div>
            </div>
            <button
              onClick={() => setShowTermsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {t('detail.viewLegalText')}
            </button>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      <LegalTextModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        text={offer.legal_text}
      />

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
