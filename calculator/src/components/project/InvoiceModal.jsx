import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useInvoice, useSubmitPayment, useConfirmPayment, useRejectPayment } from '../../hooks/useInvoices';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';
import { getInvoiceStatusInfo, formatInvoiceAmount, isInvoiceOverdue } from '../../lib/invoiceUtils';
import { PaymentInfo } from '../../components/invoices';

export function InvoiceModal({ isOpen, onClose, invoiceId }) {
  const { isAdmin, isStaff } = useAuth();
  const { data: invoice, isLoading, error, refetch } = useInvoice(isOpen ? invoiceId : null);
  const { mutate: submitPayment, isPending: isSubmitting, error: submitError } = useSubmitPayment();
  const { mutate: confirmPayment, isPending: isConfirming } = useConfirmPayment();
  const { mutate: rejectPayment, isPending: isRejecting } = useRejectPayment();
  const [txHash, setTxHash] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const canManagePayments = isAdmin || isStaff;

  if (!isOpen) return null;

  // Loading state
  if (isLoading) {
    return createPortal(
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            <p className="text-sm text-neutral-500">Loading invoice...</p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Error state
  if (error || !invoice) {
    return createPortal(
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="text-red-600 mb-4">
            {error ? `Failed to load invoice: ${error.message}` : 'Invoice not found'}
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

  const project = invoice.project;
  const offer = invoice.offer;
  const client = project?.client;
  const clientName = client?.company_name || client?.profile?.full_name || client?.profile?.email;
  const isOverdue = isInvoiceOverdue(invoice);
  const statusInfo = getInvoiceStatusInfo(isOverdue ? 'overdue' : invoice.status);
  const isPending = invoice.status === 'pending';
  const isOfferAccepted = offer?.status === 'accepted';

  return createPortal(
    <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-neutral-900">
              Invoice {invoice.number}
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
          {/* Invoice Info */}
          <div className="flex justify-between items-start">
            <div>
              <p className="text-neutral-600 font-medium">{invoice.milestone_name}</p>
              <p className="text-sm text-neutral-500 mt-1">
                Project: {project?.name || 'Unknown'}
              </p>
              {canManagePayments && clientName && (
                <p className="text-sm text-emerald-600 mt-0.5">
                  Client: {clientName}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
                <span>Created {formatDate(invoice.created_at)}</span>
                {invoice.due_date && isPending && (
                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                    {isOverdue ? 'Overdue since' : 'Due'} {formatDate(invoice.due_date)}
                  </span>
                )}
                {invoice.paid_at && (
                  <span className="text-emerald-600">
                    Paid {formatDate(invoice.paid_at)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-neutral-900">
                {formatInvoiceAmount(invoice.amount_usd, invoice.currency)}
              </div>
            </div>
          </div>

          {/* Offer not accepted message - only for clients */}
          {isPending && !isOfferAccepted && !canManagePayments && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800">Offer Not Accepted</h3>
                  <p className="text-amber-700 text-sm">
                    Payment will be available after you accept the offer
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection reason - show to client if invoice was rejected and returned to pending */}
          {isPending && invoice.rejection_reason && !canManagePayments && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800">Payment Needs Correction</h3>
                  <p className="text-amber-700 text-sm mt-1">
                    {invoice.rejection_reason}
                  </p>
                  <p className="text-amber-600 text-xs mt-2">
                    Please review the comment above and submit payment again with the correct transaction hash.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection reason - show to admin/AM if invoice was rejected and returned to pending */}
          {isPending && invoice.rejection_reason && canManagePayments && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-800">Previous Rejection Comment</h3>
                  <p className="text-neutral-700 text-sm mt-1">
                    {invoice.rejection_reason}
                  </p>
                  <p className="text-neutral-500 text-xs mt-2">
                    This invoice was previously rejected and returned to pending. Client can see this comment and retry payment.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Info (only for clients with pending & accepted offer) */}
          {isPending && isOfferAccepted && !canManagePayments && (
            <PaymentInfo invoice={invoice} />
          )}

          {/* Transaction Hash Input - only for clients with pending invoices */}
          {isPending && isOfferAccepted && !canManagePayments && (
            <div className="bg-neutral-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">
                Confirm Payment
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-neutral-600 mb-1.5">
                    Transaction Hash
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="0x... or TRX hash"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Enter the transaction hash after completing the payment
                  </p>
                </div>
                
                {txHash.trim().length > 0 && (
                  <button
                    onClick={() => {
                      submitPayment(
                        { invoiceId: invoice.id, txHash },
                        {
                          onSuccess: () => {
                            setTxHash('');
                            refetch();
                          },
                        }
                      );
                    }}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Payment Completed
                      </>
                    )}
                  </button>
                )}

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                    Error: {submitError.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Awaiting confirmation - Client view */}
          {invoice.status === 'awaiting_confirmation' && !canManagePayments && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Awaiting Confirmation</h3>
                  <p className="text-blue-700 text-sm">
                    Your payment is being verified
                  </p>
                  {invoice.tx_hash && (
                    <p className="text-blue-600 text-xs mt-1 font-mono">
                      TX: {invoice.tx_hash.slice(0, 24)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Awaiting confirmation - Admin/AM view with actions */}
          {invoice.status === 'awaiting_confirmation' && canManagePayments && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800">Payment Needs Confirmation</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    Client submitted payment proof. Please verify and confirm.
                  </p>
                  {invoice.tx_hash && (
                    <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                      <p className="text-xs text-neutral-500 mb-1">Transaction Hash:</p>
                      <p className="text-sm font-mono text-neutral-900 break-all">{invoice.tx_hash}</p>
                    </div>
                  )}
                </div>
              </div>

              {!showRejectForm ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      confirmPayment(
                        { invoiceId: invoice.id },
                        { onSuccess: () => refetch() }
                      );
                    }}
                    disabled={isConfirming || isRejecting}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    {isConfirming ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Confirm Payment
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={isConfirming || isRejecting}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-white rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-neutral-700">Return to Pending with comment:</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection (required). This comment will be visible to the client."
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (rejectReason.trim()) {
                          rejectPayment(
                            { invoiceId: invoice.id, reason: rejectReason },
                            { 
                              onSuccess: () => {
                                setShowRejectForm(false);
                                setRejectReason('');
                                refetch();
                              },
                              onError: (error) => {
                                alert(`Error: ${error.message}`);
                              }
                            }
                          );
                        }
                      }}
                      disabled={isRejecting || !rejectReason.trim()}
                      className="flex-1 px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 disabled:text-neutral-500 text-white text-sm font-medium rounded transition-colors"
                    >
                      {isRejecting ? 'Returning...' : 'Return to Pending'}
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      disabled={isRejecting}
                      className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-medium rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* Paid confirmation */}
          {invoice.status === 'paid' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-800">Payment Confirmed</h3>
                  <p className="text-emerald-700 text-sm">
                    Paid on {formatDate(invoice.paid_at)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default InvoiceModal;
