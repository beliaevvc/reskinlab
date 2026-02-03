import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/utils';
import { getInvoiceStatusInfo, formatInvoiceAmount, isInvoiceOverdue } from '../../lib/invoiceUtils';

export function InvoiceCard({ invoice, onClick, showClient = false }) {
  const project = invoice.project;
  const client = project?.client;
  const clientName = client?.company_name || client?.profile?.full_name || client?.profile?.email;
  const isOverdue = isInvoiceOverdue(invoice);
  const statusInfo = getInvoiceStatusInfo(isOverdue ? 'overdue' : invoice.status);

  const cardContent = (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-neutral-900">
            {invoice.number}
          </h3>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}
          >
            {statusInfo.label}
          </span>
        </div>

        <p className="text-neutral-600 mt-1">
          {project?.name || 'Unknown Project'}
        </p>

        {(showClient && clientName) && (
          <p className="text-sm text-emerald-600 mt-0.5">
            {clientName}
          </p>
        )}

        <p className="text-sm text-neutral-500 mt-1">
          {invoice.milestone_name}
        </p>

        {/* Show rejection reason indicator if present */}
        {invoice.status === 'pending' && invoice.rejection_reason && (
          <div className="mt-2 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 w-fit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium">Needs correction</span>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
          <span>Created {formatDate(invoice.created_at)}</span>
          {invoice.due_date && invoice.status === 'pending' && (
            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
              Due {formatDate(invoice.due_date)}
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
        {invoice.payment_proof_url && invoice.status === 'pending' && (
          <div className="text-xs text-amber-600 mt-2">
            Proof uploaded, awaiting confirmation
          </div>
        )}
      </div>
    </div>
  );

  const className = "block w-full text-left bg-white rounded-md border border-neutral-200 p-6 hover:border-emerald-300 hover:shadow-md transition-all";

  // Use button with onClick if provided, otherwise Link
  if (onClick) {
    return (
      <button onClick={() => onClick(invoice)} className={className}>
        {cardContent}
      </button>
    );
  }

  return (
    <Link to={`/invoices/${invoice.id}`} className={className}>
      {cardContent}
    </Link>
  );
}

export default InvoiceCard;
