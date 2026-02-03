import { Link, useLocation } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../lib/utils';
import { getOfferStatusInfo } from '../../lib/offerUtils';

// Get base path based on current location
function useOfferBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin/offers';
  if (location.pathname.startsWith('/am')) return '/am/offers';
  return '/offers';
}

export function OfferCard({ offer, onClick }) {
  const basePath = useOfferBasePath();
  const spec = offer.specification;
  const project = spec?.project;
  const client = project?.client;
  const totals = spec?.totals_json || {};

  const statusInfo = getOfferStatusInfo(offer.status, offer.valid_until);
  
  // Get client name
  const clientName = client?.company_name || client?.profile?.full_name || null;

  const cardContent = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-neutral-900">
              {offer.number}
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

          {/* Client info for admin/AM */}
          {clientName && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-xs font-medium text-emerald-700">
                  {clientName[0].toUpperCase()}
                </span>
              </div>
              <span className="text-sm text-neutral-500">{clientName}</span>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3 text-sm text-neutral-500">
            <span>Created {formatDate(offer.created_at)}</span>
            {offer.status === 'pending' && offer.valid_until && (
              <span>
                Valid until {formatDate(offer.valid_until)}
              </span>
            )}
            {offer.accepted_at && (
              <span>
                Accepted {formatDate(offer.accepted_at)}
              </span>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-900">
            {formatCurrency(totals.grandTotal || 0)}
          </div>
          <div className="text-sm text-neutral-500 mt-1">
            Total
          </div>
        </div>
      </div>

      {/* Quick stats */}
      {spec?.totals_json?.lineItems && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="text-sm text-neutral-500">
            {spec.totals_json.lineItems.length} items in specification
          </div>
        </div>
      )}
    </>
  );

  const className = "block w-full text-left bg-white rounded-md border border-neutral-200 p-6 hover:border-emerald-300 hover:shadow-md transition-all";

  // Use button with onClick if provided, otherwise Link
  if (onClick) {
    return (
      <button onClick={() => onClick(offer)} className={className}>
        {cardContent}
      </button>
    );
  }

  return (
    <Link to={`${basePath}/${offer.id}`} className={className}>
      {cardContent}
    </Link>
  );
}

export default OfferCard;
