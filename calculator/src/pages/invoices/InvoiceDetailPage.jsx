import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInvoice } from '../../hooks/useInvoices';
import { formatDate } from '../../lib/utils';
import { getInvoiceStatusInfo, formatInvoiceAmount, isInvoiceOverdue } from '../../lib/invoiceUtils';
import { PaymentInfo, UploadProofModal } from '../../components/invoices';

export function InvoiceDetailPage() {
  const { t } = useTranslation('invoices');
  const { id: invoiceId } = useParams();
  const { data: invoice, isLoading, error } = useInvoice(invoiceId);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
        <Link to="/invoices" className="mt-4 inline-flex items-center text-red-700 hover:text-red-800">
          {t('detail.backToInvoices')}
        </Link>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
        <p className="text-neutral-600">{t('detail.notFound')}</p>
        <Link to="/invoices" className="mt-4 inline-flex items-center text-emerald-600 hover:text-emerald-700">
          {t('detail.backToInvoices')}
        </Link>
      </div>
    );
  }

  const project = invoice.project;
  const offer = invoice.offer;
  const isOverdue = isInvoiceOverdue(invoice);
  const statusInfo = getInvoiceStatusInfo(isOverdue ? 'overdue' : invoice.status);
  const isPending = invoice.status === 'pending';
  const hasProof = !!invoice.payment_proof_url;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/invoices" className="text-neutral-500 hover:text-neutral-700 transition-colors">
          {t('detail.breadcrumbInvoices')}
        </Link>
        <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-neutral-900 font-medium">{invoice.number}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-md border border-neutral-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">{invoice.number}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                {t(`status.${isOverdue ? 'overdue' : invoice.status}`)}
              </span>
            </div>
            <p className="text-neutral-600 mt-2">
              {invoice.milestone_name}
            </p>
            <p className="text-neutral-500 mt-1">
              {t('detail.projectName', { name: project?.name || t('card.unknown') })}
            </p>
            <div className="flex items-center gap-4 mt-4 text-sm text-neutral-500">
              <span>{t('detail.created', { date: formatDate(invoice.created_at) })}</span>
              {invoice.due_date && isPending && (
                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                  {isOverdue ? t('detail.overdueSince', { date: formatDate(invoice.due_date) }) : t('detail.due', { date: formatDate(invoice.due_date) })}
                </span>
              )}
              {invoice.paid_at && (
                <span className="text-emerald-600">
                  {t('detail.paid', { date: formatDate(invoice.paid_at) })}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-3xl font-bold text-neutral-900">
              {formatInvoiceAmount(invoice.amount_usd, invoice.currency)}
            </div>
            {offer && (
              <Link
                to={`/offers/${offer.id}`}
                className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 inline-block"
              >
                {t('detail.viewOffer', { number: offer.number })}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Payment info (only for pending) */}
      {isPending && (
        <PaymentInfo invoice={invoice} />
      )}

      {/* Upload proof section */}
      {isPending && (
        <div className="bg-white rounded-md border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            {t('detail.paymentProof')}
          </h3>

          {hasProof ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-emerald-800">{t('detail.proofUploaded')}</p>
                    <p className="text-sm text-emerald-700 mt-1">
                      {t('detail.proofUploadedDesc')}
                    </p>
                  </div>
                </div>
              </div>

              {invoice.payment_proof_url && (
                <div>
                  <p className="text-sm text-neutral-500 mb-2">{t('detail.uploadedFile')}</p>
                  <a
                    href={invoice.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {t('detail.viewUploadedProof')}
                  </a>
                </div>
              )}

              {invoice.tx_hash && (
                <div>
                  <p className="text-sm text-neutral-500 mb-1">{t('detail.transactionHash')}</p>
                  <code className="text-sm bg-neutral-100 px-2 py-1 rounded">
                    {invoice.tx_hash}
                  </code>
                </div>
              )}

              <button
                onClick={() => setShowUploadModal(true)}
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                {t('detail.uploadDifferentProof')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-neutral-600">
                {t('detail.afterPayment')}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('detail.uploadPaymentProof')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paid confirmation */}
      {invoice.status === 'paid' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800">{t('detail.paymentConfirmed')}</h3>
              <p className="text-emerald-700 text-sm">
                {t('detail.paymentConfirmedDesc', { date: formatDate(invoice.paid_at) })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadProofModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        invoice={invoice}
      />
    </div>
  );
}

export default InvoiceDetailPage;
