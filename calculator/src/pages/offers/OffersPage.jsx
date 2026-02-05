import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOffers, useAllOffers } from '../../hooks/useOffers';
import { useAuth } from '../../contexts/AuthContext';
import { OfferCard, OffersTable } from '../../components/offers';
import { ClientFilter } from '../../components/offers/ClientFilter';
import { OfferModal } from '../../components/project';

export function OffersPage() {
  const { isAdmin, isAM } = useAuth();
  const location = useLocation();
  const isStaff = isAdmin || isAM;
  const isAdminOrAMView = location.pathname.startsWith('/admin') || location.pathname.startsWith('/am');

  // Use different hooks for staff vs client
  const { data: clientOffers, isLoading: clientLoading, error: clientError } = useOffers();
  const { data: allOffers, isLoading: allLoading, error: allError } = useAllOffers();

  const offers = isStaff && isAdminOrAMView ? allOffers : clientOffers;
  const isLoading = isStaff && isAdminOrAMView ? allLoading : clientLoading;
  const error = isStaff && isAdminOrAMView ? allError : clientError;

  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [clientFilter, setClientFilter] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('offers-view') || 'grid';
  });

  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('offers-view', mode);
  };

  // Get unique clients for filter (only for admin/AM)
  const clients = useMemo(() => {
    if (!isStaff || !isAdminOrAMView || !allOffers) return [];
    const uniqueClients = new Map();
    allOffers.forEach(offer => {
      const client = offer.specification?.project?.client;
      if (client?.id && !uniqueClients.has(client.id)) {
        uniqueClients.set(client.id, {
          id: client.id,
          name: client.company_name || client.profile?.full_name || 'Unknown',
        });
      }
    });
    return Array.from(uniqueClients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [isStaff, isAdminOrAMView, allOffers]);

  // Filter offers by client
  const filteredOffers = useMemo(() => {
    if (!offers) return [];
    if (!clientFilter) return offers;
    return offers.filter(offer => {
      const clientId = offer.specification?.project?.client?.id;
      return clientId === clientFilter;
    });
  }, [offers, clientFilter]);

  const handleOfferClick = (offer) => {
    setSelectedOfferId(offer.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <p className="text-red-800">Failed to load offers: {error.message}</p>
      </div>
    );
  }

  const pendingOffers = filteredOffers?.filter((o) => o.status === 'pending') || [];
  const acceptedOffers = filteredOffers?.filter((o) => o.status === 'accepted') || [];
  const otherOffers = filteredOffers?.filter((o) => !['pending', 'accepted'].includes(o.status)) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Offers</h1>
          <p className="text-neutral-500 mt-1">
            {isStaff && isAdminOrAMView
              ? 'View and manage all offers'
              : 'Review and accept offers for your projects'}
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
            title="Grid view"
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
            title="List view"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter by client (Admin/AM only) */}
      {isStaff && isAdminOrAMView && clients.length > 0 && (
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <div className="flex items-start gap-4">
            <div className="w-64">
              <ClientFilter
                clients={clients}
                value={clientFilter}
                onChange={setClientFilter}
              />
            </div>
            {clientFilter && (
              <div className="flex items-end">
                <span className="text-xs text-neutral-500">
                  {filteredOffers.length} {filteredOffers.length === 1 ? 'offer' : 'offers'} found
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!filteredOffers || filteredOffers.length === 0) && (
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
            No offers yet
          </h2>
          <p className="mt-2 text-neutral-500 max-w-md mx-auto">
            Offers will appear here after you finalize a specification in the calculator.
          </p>
          <Link
            to="/calculator"
            className="inline-flex items-center gap-2 mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
          >
            Go to Calculator
          </Link>
        </div>
      )}

      {/* Pending offers */}
      {pendingOffers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pending Acceptance ({pendingOffers.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {pendingOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onClick={handleOfferClick} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <OffersTable offers={pendingOffers} onOfferClick={handleOfferClick} showClient={isStaff && isAdminOrAMView} />
            </div>
          )}
        </div>
      )}

      {/* Accepted offers */}
      {acceptedOffers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Accepted ({acceptedOffers.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {acceptedOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onClick={handleOfferClick} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <OffersTable offers={acceptedOffers} onOfferClick={handleOfferClick} showClient={isStaff && isAdminOrAMView} />
            </div>
          )}
        </div>
      )}

      {/* Other (expired, cancelled) */}
      {otherOffers.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
            Expired / Cancelled ({otherOffers.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-60">
              {otherOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onClick={handleOfferClick} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 opacity-60">
              <OffersTable offers={otherOffers} onOfferClick={handleOfferClick} showClient={isStaff && isAdminOrAMView} />
            </div>
          )}
        </div>
      )}

      {/* Offer Modal */}
      <OfferModal
        isOpen={!!selectedOfferId}
        onClose={() => setSelectedOfferId(null)}
        offerId={selectedOfferId}
      />
    </div>
  );
}

export default OffersPage;
