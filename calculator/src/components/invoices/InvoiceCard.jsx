import { Link } from 'react-router-dom';
import { formatDate } from '../../lib/utils';
import { getInvoiceStatusInfo, formatInvoiceAmount, isInvoiceOverdue } from '../../lib/invoiceUtils';

export function InvoiceCard({ invoice, onClick, showClient = false }) {
  const project = invoice.project;
  const offer = invoice.offer;
  const spec = offer?.specification;
  const client = project?.client;
  const clientName = client?.company_name || client?.profile?.full_name || client?.profile?.email;
  const isOverdue = isInvoiceOverdue(invoice);
  const statusInfo = getInvoiceStatusInfo(isOverdue ? 'overdue' : invoice.status);

  const cardContent = (
    <div className="flex flex-col h-full">
      {/* Header: Status */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
          {statusInfo.label}
        </span>
        {invoice.status === 'pending' && invoice.rejection_reason && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
            </svg>
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="text-xl font-bold text-neutral-900 mb-1">
        {formatInvoiceAmount(invoice.amount_usd, invoice.currency)}
      </div>

      {/* Invoice number */}
      <div className="text-sm font-medium text-neutral-600 mb-2">
        {invoice.number}
      </div>

      {/* Project & Milestone */}
      <div className="text-sm text-neutral-500 truncate">
        {project?.name || 'Unknown'}
      </div>
      <div className="text-xs text-neutral-400 truncate mt-0.5">
        {invoice.milestone_name}
      </div>

      {/* Offer & Spec */}
      {(offer || spec) && (
        <div className="flex items-center gap-2 mt-2 text-xs text-neutral-400">
          {offer && (
            <span className="bg-neutral-100 px-1.5 py-0.5 rounded truncate">
              {offer.number}
            </span>
          )}
          {spec && (
            <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
              {spec.version}
            </span>
          )}
        </div>
      )}

      {/* Client (if shown) */}
      {showClient && clientName && (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-medium text-emerald-700">
              {clientName[0]?.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-emerald-600 truncate">{clientName}</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Footer: Date */}
      <div className="pt-3 mt-3 border-t border-neutral-100 text-xs text-neutral-400">
        {invoice.paid_at ? (
          <span className="text-emerald-500">Paid {formatDate(invoice.paid_at)}</span>
        ) : invoice.due_date && invoice.status === 'pending' ? (
          <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
            Due {formatDate(invoice.due_date)}
          </span>
        ) : invoice.status === 'awaiting_confirmation' ? (
          <span className="text-amber-500">Awaiting confirmation</span>
        ) : (
          <span>{formatDate(invoice.created_at)}</span>
        )}
      </div>
    </div>
  );

  const className = "block h-full bg-white rounded-xl border border-neutral-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all";

  // Use button with onClick if provided, otherwise Link
  if (onClick) {
    return (
      <button onClick={() => onClick(invoice)} className={`${className} text-left`}>
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
