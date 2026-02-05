import { formatDate, formatCurrency } from '../../lib/utils';
import { getOfferStatusInfo } from '../../lib/offerUtils';

export function OffersTable({ offers, onOfferClick, showClient = true }) {
  if (!offers || offers.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        No offers
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Offer
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Project
            </th>
            {showClient && (
              <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                Client
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Spec
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {offers.map((offer) => {
            const spec = offer.specification;
            const project = spec?.project;
            const client = project?.client;
            const clientName = client?.company_name || client?.profile?.full_name || null;
            const totals = spec?.totals_json || {};
            const statusInfo = getOfferStatusInfo(offer.status, offer.valid_until);

            return (
              <tr
                key={offer.id}
                onClick={() => onOfferClick?.(offer)}
                className="hover:bg-neutral-50 cursor-pointer transition-colors"
              >
                {/* Offer Number */}
                <td className="px-4 py-3">
                  <span className="font-medium text-neutral-900">{offer.number}</span>
                </td>

                {/* Project */}
                <td className="px-4 py-3">
                  <span className="text-sm text-neutral-700">{project?.name || 'Unknown'}</span>
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

                {/* Spec Version */}
                <td className="px-4 py-3">
                  {spec && (
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                      {spec.version}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                    {statusInfo.label}
                  </span>
                </td>

                {/* Date */}
                <td className="px-4 py-3 text-sm">
                  {offer.accepted_at ? (
                    <span className="text-emerald-600">{formatDate(offer.accepted_at)}</span>
                  ) : offer.status === 'pending' && offer.valid_until ? (
                    <span className="text-neutral-600">Until {formatDate(offer.valid_until)}</span>
                  ) : (
                    <span className="text-neutral-500">{formatDate(offer.created_at)}</span>
                  )}
                </td>

                {/* Total */}
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-neutral-900">
                    {formatCurrency(totals.grandTotal || 0)}
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

export default OffersTable;
