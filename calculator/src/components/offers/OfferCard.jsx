import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('offers');
  const basePath = useOfferBasePath();
  const spec = offer.specification;
  const project = spec?.project;
  const client = project?.client;
  const totals = spec?.totals_json || {};

  const statusInfo = getOfferStatusInfo(offer.status, offer.valid_until);
  
  // Get client name
  const clientName = client?.company_name || client?.profile?.full_name || null;

  const cardContent = (
    <div className="flex items-center gap-4">
      {/* Left: Status indicator */}
      <div className={`w-1 self-stretch rounded-full shrink-0 ${
        offer.status === 'accepted' ? 'bg-emerald-400' :
        offer.status === 'pending' ? 'bg-amber-400' : 'bg-neutral-300'
      }`} />

      {/* Middle: Info */}
      <div className="flex-1 min-w-0 py-1">
        {/* Row 1: Number + Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-neutral-900">{offer.number}</span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
            {t(`status.${offer.status}`)}
          </span>
          {spec && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
              {spec.number || spec.version}
            </span>
          )}
        </div>

        {/* Row 2: Project */}
        <div className="text-sm text-neutral-600 mt-1 truncate">
          {project?.name || t('common:unknown', { defaultValue: 'Unknown Project' })}
        </div>

        {/* Row 3: Client + Date */}
        <div className="flex items-center justify-between gap-2 mt-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {clientName && (
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-medium text-emerald-700">{clientName[0]?.toUpperCase()}</span>
                </span>
                <span className="truncate max-w-[120px]">{clientName}</span>
              </span>
            )}
            {spec?.totals_json?.lineItems && (
              <span className="text-xs text-neutral-400">
                {spec.totals_json.lineItems.length} {t('common:items', { defaultValue: 'items' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Amount + Date */}
      <div className="text-right shrink-0">
        <div className="text-lg font-bold text-neutral-900">
          {formatCurrency(totals.grandTotal || 0)}
        </div>
        <div className="text-xs text-neutral-400 mt-1">
          {offer.accepted_at ? (
            <span className="text-emerald-500">{formatDate(offer.accepted_at)}</span>
          ) : offer.status === 'pending' && offer.valid_until ? (
            <span>{t('common:until', { defaultValue: 'Until' })} {formatDate(offer.valid_until)}</span>
          ) : (
            formatDate(offer.created_at)
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
      <button onClick={() => onClick(offer)} className={`${className} text-left w-full`}>
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
