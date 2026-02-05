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
    <div className="flex items-center gap-4">
      {/* Left: Status indicator */}
      <div className={`w-1 self-stretch rounded-full shrink-0 ${
        invoice.status === 'paid' ? 'bg-emerald-400' :
        invoice.status === 'awaiting_confirmation' ? 'bg-amber-400' :
        isOverdue ? 'bg-red-400' : 'bg-neutral-300'
      }`} />

      {/* Middle: Info */}
      <div className="flex-1 min-w-0 py-1">
        {/* Row 1: Number + Status + Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-neutral-900">{invoice.number}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
            {statusInfo.label}
          </span>
          {invoice.status === 'pending' && invoice.rejection_reason && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
              </svg>
              Retry
            </span>
          )}
        </div>

        {/* Row 2: Project + Milestone */}
        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className="text-neutral-600 truncate">{project?.name || 'Unknown'}</span>
          <span className="text-neutral-300">·</span>
          <span className="text-neutral-400 truncate">{invoice.milestone_name}</span>
        </div>

        {/* Row 3: Offer + Spec + Client */}
        <div className="flex items-center gap-2 mt-1.5">
          {offer && (
            <span className="text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded truncate max-w-[140px]">
              {offer.number}
            </span>
          )}
          {spec && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded shrink-0">
              {spec.version}
            </span>
          )}
          {showClient && clientName && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-medium text-emerald-700">{clientName[0]?.toUpperCase()}</span>
              </span>
              <span className="truncate max-w-[100px]">{clientName}</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: Amount + Date */}
      <div className="text-right shrink-0">
        <div className="text-lg font-bold text-neutral-900">
          {formatInvoiceAmount(invoice.amount_usd, invoice.currency)}
        </div>
        <div className="text-xs text-neutral-400 mt-1">
          {invoice.paid_at ? (
            <span className="text-emerald-500">Paid {formatDate(invoice.paid_at)}</span>
          ) : invoice.due_date && invoice.status === 'pending' ? (
            <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
              Due {formatDate(invoice.due_date)}
            </span>
          ) : invoice.status === 'awaiting_confirmation' ? (
            <span className="text-amber-500">Awaiting</span>
          ) : (
            formatDate(invoice.created_at)
          )}
        </div>
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );

  const className = "block bg-white rounded-lg border border-neutral-200 px-4 py-3 hover:border-emerald-300 hover:shadow-sm transition-all";

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
