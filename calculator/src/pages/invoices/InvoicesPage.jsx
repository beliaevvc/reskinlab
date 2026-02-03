import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, usePendingAmount } from '../../hooks/useInvoices';
import { useAuth } from '../../contexts/AuthContext';
import { InvoiceCard } from '../../components/invoices';
import { InvoiceModal } from '../../components/project';
import { formatInvoiceAmount, isInvoiceOverdue } from '../../lib/invoiceUtils';

export function InvoicesPage() {
  const { isAdmin, isStaff } = useAuth();
  const { data: invoices, isLoading, error } = useInvoices();
  const { data: pendingAmount } = usePendingAmount();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  
  const showClient = isAdmin || isStaff;

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoiceId(invoice.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <p className="text-red-800">Failed to load invoices: {error.message}</p>
      </div>
    );
  }

  // Group invoices by status
  const pendingInvoices = invoices?.filter((i) => i.status === 'pending') || [];
  const overdueInvoices = pendingInvoices.filter(isInvoiceOverdue);
  const normalPending = pendingInvoices.filter((i) => !isInvoiceOverdue(i));
  const awaitingConfirmation = invoices?.filter((i) => i.status === 'awaiting_confirmation') || [];
  const paidInvoices = invoices?.filter((i) => i.status === 'paid') || [];
  const cancelledInvoices = invoices?.filter((i) => i.status === 'cancelled') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
          <p className="text-neutral-500 mt-1">
            Track and pay your project invoices
          </p>
        </div>
        {pendingAmount > 0 && (
          <div className="text-right">
            <div className="text-sm text-neutral-500">Total Pending</div>
            <div className="text-2xl font-bold text-neutral-900">
              {formatInvoiceAmount(pendingAmount)}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {(!invoices || invoices.length === 0) && (
        <div className="bg-white rounded-md border border-neutral-200 p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-neutral-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900">
            No invoices yet
          </h2>
          <p className="mt-2 text-neutral-500 max-w-md mx-auto">
            Invoices will appear here after you accept an offer.
          </p>
          <Link
            to="/offers"
            className="inline-flex items-center gap-2 mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
          >
            View Offers
          </Link>
        </div>
      )}

      {/* Overdue invoices */}
      {overdueInvoices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Overdue ({overdueInvoices.length})
          </h2>
          <div className="space-y-3">
            {overdueInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
            ))}
          </div>
        </div>
      )}

      {/* Awaiting Confirmation */}
      {awaitingConfirmation.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-blue-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Awaiting Confirmation ({awaitingConfirmation.length})
          </h2>
          <div className="space-y-3">
            {awaitingConfirmation.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
            ))}
          </div>
        </div>
      )}

      {/* Pending invoices */}
      {normalPending.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pending Payment ({normalPending.length})
          </h2>
          <div className="space-y-3">
            {normalPending.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
            ))}
          </div>
        </div>
      )}

      {/* Paid invoices */}
      {paidInvoices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Paid ({paidInvoices.length})
          </h2>
          <div className="space-y-3">
            {paidInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
            ))}
          </div>
        </div>
      )}

      {/* Cancelled */}
      {cancelledInvoices.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-500">
            Cancelled ({cancelledInvoices.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {cancelledInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
            ))}
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
}

export default InvoicesPage;
