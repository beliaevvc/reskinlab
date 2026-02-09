import { useState, useMemo, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAllSpecifications, useAMSpecifications } from '../../hooks/useSpecifications';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { SpecificationModal, OfferModal } from '../../components/project';
import { ClientFilter } from '../../components/offers';
// Status badge component
function StatusBadge({ status, hasOffer, offerStatus, t }) {
  if (status === 'draft') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
        {t('card.draft')}
      </span>
    );
  }
  
  if (status === 'finalized') {
    if (!hasOffer) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
          {t('status.awaitingOffer', { defaultValue: 'Awaiting Offer' })}
        </span>
      );
    }
    
    if (offerStatus === 'pending') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
          {t('status.offerPending', { defaultValue: 'Offer Pending' })}
        </span>
      );
    }
    
    if (offerStatus === 'accepted') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
          {t('common:status.accepted')}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-500">
        {offerStatus || t('card.finalized')}
      </span>
    );
  }
  
  return null;
}

// Specification card component
function SpecificationCard({ spec, onClick, t }) {
  const total = spec.totals_json?.total || spec.totals_json?.grandTotal || 0;
  const hasOffer = !!spec.offer;
  const offerStatus = spec.offer?.status;
  
  return (
    <div
      onClick={() => onClick(spec)}
      className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-neutral-900 truncate">
              {spec.project?.name || t('common:unknown')}
            </h3>
            <span className="text-xs text-neutral-400">{spec.number || spec.version}</span>
          </div>
          <p className="text-sm text-neutral-500 truncate mt-0.5">
            {spec.project?.client?.company_name || spec.project?.client?.profile?.full_name || t('noClient', { defaultValue: 'No client' })}
          </p>
        </div>
        <StatusBadge status={spec.status} hasOffer={hasOffer} offerStatus={offerStatus} t={t} />
      </div>
      
      <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <span className="text-lg font-bold text-neutral-900">
          {formatCurrency(total)}
        </span>
        <span className="text-xs text-neutral-400">
          {formatDate(spec.created_at)}
        </span>
      </div>
      
      {hasOffer && (
        <div className="mt-2 text-xs text-neutral-500">
          {t('offers:card.offer')} #{spec.offer.number}
        </div>
      )}
    </div>
  );
}

// Specifications table component
function SpecificationsTable({ specifications, onSpecClick, showClient, t }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-neutral-200 text-left">
          <th className="py-3 pl-4 text-xs font-semibold text-neutral-500 uppercase">{t('common:labels.project')}</th>
          {showClient && (
            <th className="py-3 text-xs font-semibold text-neutral-500 uppercase">{t('common:labels.client')}</th>
          )}
          <th className="py-3 text-xs font-semibold text-neutral-500 uppercase">{t('table.version', { defaultValue: 'Version' })}</th>
          <th className="py-3 text-xs font-semibold text-neutral-500 uppercase">{t('common:labels.amount')}</th>
          <th className="py-3 text-xs font-semibold text-neutral-500 uppercase">{t('common:labels.status')}</th>
          <th className="py-3 text-xs font-semibold text-neutral-500 uppercase">{t('common:labels.date')}</th>
          <th className="py-3 pr-4 text-xs font-semibold text-neutral-500 uppercase">{t('offers:card.offer')}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-neutral-100">
        {specifications.map((spec) => {
          const total = spec.totals_json?.total || spec.totals_json?.grandTotal || 0;
          const hasOffer = !!spec.offer;
          
          return (
            <tr
              key={spec.id}
              onClick={() => onSpecClick(spec)}
              className="hover:bg-neutral-50 cursor-pointer transition-colors"
            >
              <td className="py-3 pl-4">
                <span className="font-medium text-neutral-900">{spec.project?.name || t('common:unknown')}</span>
              </td>
              {showClient && (
                <td className="py-3 text-sm text-neutral-600">
                  {spec.project?.client?.company_name || spec.project?.client?.profile?.full_name || '-'}
                </td>
              )}
              <td className="py-3 text-sm text-neutral-600">{spec.number || spec.version}</td>
              <td className="py-3 font-medium text-neutral-900">{formatCurrency(total)}</td>
              <td className="py-3">
                <StatusBadge status={spec.status} hasOffer={hasOffer} offerStatus={spec.offer?.status} t={t} />
              </td>
              <td className="py-3 text-sm text-neutral-500">{formatDate(spec.created_at)}</td>
              <td className="py-3 pr-4 text-sm text-neutral-500">
                {hasOffer ? `#${spec.offer.number}` : '-'}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Status filter options - will be translated in component
const STATUS_OPTIONS_KEYS = [
  { id: '', key: 'filter.allStatuses' },
  { id: 'draft', key: 'filter.draft' },
  { id: 'awaiting_offer', key: 'filter.awaitingOffer' },
  { id: 'offer_pending', key: 'filter.offerPending' },
  { id: 'accepted', key: 'filter.accepted' },
];

// Status filter component (custom dropdown)
function StatusFilter({ value, onChange, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const STATUS_OPTIONS = STATUS_OPTIONS_KEYS.map(o => ({ ...o, name: t(o.key) }));
  const selectedOption = STATUS_OPTIONS.find(o => o.id === value) || STATUS_OPTIONS[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionId) => {
    onChange(optionId);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <label className="block text-xs font-medium text-neutral-500 mb-1">
        {t('common:labels.status')}
      </label>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm rounded border border-neutral-300 bg-white hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
      >
        <span className={value ? 'text-neutral-900' : 'text-neutral-500'}>
          {selectedOption.name}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 hover:bg-neutral-100 rounded"
              title={t('common:actions.clear')}
            >
              <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg">
          <div className="max-h-60 overflow-auto py-1">
            {STATUS_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option.id)}
                className={`w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between ${
                  option.id === value
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{option.name}</span>
                {option.id === value && (
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SpecificationsPage() {
  const { t } = useTranslation('specs');
  const { user, isAdmin, isAM } = useAuth();
  const location = useLocation();
  const isStaff = isAdmin || isAM;

  const isAdminView = location.pathname.startsWith('/admin');
  const isAMView = location.pathname.startsWith('/am');
  const isAdminOrAMView = isAdminView || isAMView;

  // Use different hooks based on role
  const { data: allSpecs, isLoading: allLoading, error: allError } = useAllSpecifications();
  const { data: amSpecs, isLoading: amLoading, error: amError } = useAMSpecifications(user?.id);

  // Select data based on view
  const specifications = isAdminView ? allSpecs : isAMView ? amSpecs : [];
  const isLoading = isAdminView ? allLoading : isAMView ? amLoading : false;
  const error = isAdminView ? allError : isAMView ? amError : null;

  const [selectedSpecificationId, setSelectedSpecificationId] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [returnToSpecificationId, setReturnToSpecificationId] = useState(null);
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('specifications-view') || 'grid';
  });

  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('specifications-view', mode);
  };

  // Get unique clients for filter
  const clients = useMemo(() => {
    if (!specifications) return [];
    const uniqueClients = new Map();
    specifications.forEach(spec => {
      const client = spec.project?.client;
      if (client?.id && !uniqueClients.has(client.id)) {
        uniqueClients.set(client.id, {
          id: client.id,
          name: client.company_name || client.profile?.full_name || 'Unknown',
        });
      }
    });
    return Array.from(uniqueClients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [specifications]);

  // Filter specifications
  const filteredSpecs = useMemo(() => {
    if (!specifications) return [];
    
    return specifications.filter(spec => {
      // Client filter
      if (clientFilter && spec.project?.client?.id !== clientFilter) {
        return false;
      }
      
      // Status filter
      if (statusFilter) {
        const hasOffer = !!spec.offer;
        const offerStatus = spec.offer?.status;
        
        if (statusFilter === 'draft' && spec.status !== 'draft') return false;
        if (statusFilter === 'awaiting_offer' && !(spec.status === 'finalized' && !hasOffer)) return false;
        if (statusFilter === 'offer_pending' && !(spec.status === 'finalized' && hasOffer && offerStatus === 'pending')) return false;
        if (statusFilter === 'accepted' && !(spec.status === 'finalized' && hasOffer && offerStatus === 'accepted')) return false;
      }
      
      return true;
    });
  }, [specifications, clientFilter, statusFilter]);

  // Group specifications by status
  const awaitingOfferSpecs = filteredSpecs.filter(s => s.status === 'finalized' && !s.offer);
  const offerPendingSpecs = filteredSpecs.filter(s => s.status === 'finalized' && s.offer?.status === 'pending');
  const acceptedSpecs = filteredSpecs.filter(s => s.status === 'finalized' && s.offer?.status === 'accepted');
  const draftSpecs = filteredSpecs.filter(s => s.status === 'draft');
  const otherSpecs = filteredSpecs.filter(s => {
    if (s.status === 'draft') return false;
    if (s.status === 'finalized' && !s.offer) return false;
    if (s.status === 'finalized' && ['pending', 'accepted'].includes(s.offer?.status)) return false;
    return true;
  });

  const handleSpecClick = (spec) => {
    setSelectedSpecificationId(spec.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">{t('page.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <p className="text-red-800">{t('page.loadError', { error: error.message })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('page.title')}</h1>
          <p className="text-neutral-500 mt-1">
            {t('page.subtitle')}
          </p>
        </div>
        {/* View Toggle */}
        <div className="flex items-center bg-neutral-100 rounded-lg p-1">
          <button
            onClick={() => handleViewChange('grid')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'grid' 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            title={t('offers:page.gridView')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => handleViewChange('list')}
            className={`p-1.5 rounded transition-colors ${
              viewMode === 'list' 
                ? 'bg-white text-neutral-900 shadow-sm' 
                : 'text-neutral-500 hover:text-neutral-700'
            }`}
            title={t('offers:page.listView')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {isStaff && isAdminOrAMView && (
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <div className="flex items-start gap-4">
            <div className="w-64">
              <ClientFilter
                clients={clients}
                value={clientFilter}
                onChange={setClientFilter}
              />
            </div>
            <div className="w-48">
              <StatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                t={t}
              />
            </div>
            {(clientFilter || statusFilter) && (
              <div className="flex items-end pt-6">
                <span className="text-xs text-neutral-500">
                  {filteredSpecs.length} {t('common:found')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!filteredSpecs || filteredSpecs.length === 0) && (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900">
            {t('emptyState.title')}
          </h2>
          <p className="mt-2 text-neutral-500 max-w-md mx-auto">
            {t('emptyState.subtitle')}
          </p>
          <Link
            to={isAdminView ? '/admin/calculator' : isAMView ? '/am/calculator' : '/calculator'}
            className="inline-flex items-center gap-2 mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
          >
            {t('offers:emptyState.goToCalculator')}
          </Link>
        </div>
      )}

      {/* Awaiting Offer (Finalized without offer) */}
      {awaitingOfferSpecs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-purple-600 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            {t('status.awaitingOffer', { defaultValue: 'Awaiting Offer' })} ({awaitingOfferSpecs.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {awaitingOfferSpecs.map((spec) => (
                <SpecificationCard key={spec.id} spec={spec} onClick={handleSpecClick} t={t} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <SpecificationsTable specifications={awaitingOfferSpecs} onSpecClick={handleSpecClick} showClient={isStaff && isAdminOrAMView} t={t} />
            </div>
          )}
        </div>
      )}

      {/* Offer Pending */}
      {offerPendingSpecs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {t('status.offerPending', { defaultValue: 'Offer Pending' })} ({offerPendingSpecs.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {offerPendingSpecs.map((spec) => (
                <SpecificationCard key={spec.id} spec={spec} onClick={handleSpecClick} t={t} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <SpecificationsTable specifications={offerPendingSpecs} onSpecClick={handleSpecClick} showClient={isStaff && isAdminOrAMView} t={t} />
            </div>
          )}
        </div>
      )}

      {/* Accepted */}
      {acceptedSpecs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('common:status.accepted')} ({acceptedSpecs.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {acceptedSpecs.map((spec) => (
                <SpecificationCard key={spec.id} spec={spec} onClick={handleSpecClick} t={t} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <SpecificationsTable specifications={acceptedSpecs} onSpecClick={handleSpecClick} showClient={isStaff && isAdminOrAMView} t={t} />
            </div>
          )}
        </div>
      )}

      {/* Drafts */}
      {draftSpecs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            {t('card.draft')} ({draftSpecs.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-70">
              {draftSpecs.map((spec) => (
                <SpecificationCard key={spec.id} spec={spec} onClick={handleSpecClick} t={t} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 opacity-70">
              <SpecificationsTable specifications={draftSpecs} onSpecClick={handleSpecClick} showClient={isStaff && isAdminOrAMView} t={t} />
            </div>
          )}
        </div>
      )}

      {/* Other (expired, cancelled offers) */}
      {otherSpecs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
            {t('status.other', { defaultValue: 'Other' })} ({otherSpecs.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-60">
              {otherSpecs.map((spec) => (
                <SpecificationCard key={spec.id} spec={spec} onClick={handleSpecClick} t={t} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 opacity-60">
              <SpecificationsTable specifications={otherSpecs} onSpecClick={handleSpecClick} showClient={isStaff && isAdminOrAMView} t={t} />
            </div>
          )}
        </div>
      )}

      {/* Specification Modal */}
      <SpecificationModal
        isOpen={!!selectedSpecificationId}
        onClose={() => setSelectedSpecificationId(null)}
        specificationId={selectedSpecificationId}
        onViewOffer={(offer) => {
          // Save current spec ID to return after closing offer
          setReturnToSpecificationId(selectedSpecificationId);
          setSelectedSpecificationId(null);
          setSelectedOfferId(offer.id);
        }}
      />

      {/* Offer Modal */}
      <OfferModal
        isOpen={!!selectedOfferId}
        onClose={() => {
          setSelectedOfferId(null);
          // Return to specification modal if we came from there
          if (returnToSpecificationId) {
            setSelectedSpecificationId(returnToSpecificationId);
            setReturnToSpecificationId(null);
          }
        }}
        offerId={selectedOfferId}
      />
    </div>
  );
}

export default SpecificationsPage;
