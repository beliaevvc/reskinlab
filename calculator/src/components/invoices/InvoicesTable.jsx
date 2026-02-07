import { formatDate } from '../../lib/utils';
import { getInvoiceStatusInfo, formatInvoiceAmount, isInvoiceOverdue } from '../../lib/invoiceUtils';

export function InvoicesTable({ invoices, onInvoiceClick, showClient = false }) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No invoices
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Invoice
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Project / Milestone
            </th>
            {showClient && (
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Client
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Offer / Spec
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {invoices.map((invoice) => {
            const project = invoice.project;
            const offer = invoice.offer;
            const spec = offer?.specification;
            const client = project?.client;
            const clientName = client?.company_name || client?.profile?.full_name || client?.profile?.email;
            const isOverdue = isInvoiceOverdue(invoice);
            const statusInfo = getInvoiceStatusInfo(isOverdue ? 'overdue' : invoice.status);

            return (
              <tr
                key={invoice.id}
                onClick={() => onInvoiceClick?.(invoice)}
                className="hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                {/* Invoice Number */}
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-900">{invoice.number}</span>
                </td>

                {/* Project / Milestone */}
                <td className="px-4 py-3">
                  <div className="text-sm text-neutral-900">{project?.name || 'Unknown'}</div>
                  <div className="text-xs text-neutral-500">{invoice.milestone_name}</div>
                </td>

                {/* Client */}
                {showClient && (
                  <td className="px-4 py-3">
                    {clientName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="text-xs font-medium text-emerald-700">
                            {clientName[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-700 truncate max-w-[150px]">{clientName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-neutral-400">—</span>
                    )}
                  </td>
                )}

                {/* Offer / Spec */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {offer && (
                      <span className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                        {offer.number}
                      </span>
                    )}
                    {spec && (
                      <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                        {spec.number || spec.version}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                    {invoice.status === 'pending' && invoice.rejection_reason && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                    )}
                    {statusInfo.label}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-sm">
                  {invoice.paid_at ? (
                    <span className="text-emerald-600">{formatDate(invoice.paid_at)}</span>
                  ) : invoice.due_date && invoice.status === 'pending' ? (
                    <span className={isOverdue ? 'text-red-600 font-medium' : 'text-neutral-600'}>
                      {formatDate(invoice.due_date)}
                    </span>
                  ) : (
                    <span className="text-neutral-500">{formatDate(invoice.created_at)}</span>
                  )}
                </td>

                {/* Amount */}
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-neutral-900">
                    {formatInvoiceAmount(invoice.amount_usd, invoice.currency)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default InvoicesTable;
