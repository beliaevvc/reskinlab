import { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOffers, useAllOffers } from '../../hooks/useOffers';
import { useAuth } from '../../contexts/AuthContext';
import { OfferCard } from '../../components/offers';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Offers</h1>
          <p className="text-neutral-500 mt-1">
            {isStaff && isAdminOrAMView
              ? 'View and manage all offers'
              : 'Review and accept offers for your projects'}
          </p>
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
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pending Acceptance ({pendingOffers.length})
          </h2>
          <div className="space-y-3">
            {pendingOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onClick={handleOfferClick} />
            ))}
          </div>
        </div>
      )}

      {/* Accepted offers */}
      {acceptedOffers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Accepted ({acceptedOffers.length})
          </h2>
          <div className="space-y-3">
            {acceptedOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onClick={handleOfferClick} />
            ))}
          </div>
        </div>
      )}

      {/* Other (expired, cancelled) */}
      {otherOffers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-neutral-500">
            Expired / Cancelled ({otherOffers.length})
          </h2>
          <div className="space-y-3 opacity-60">
            {otherOffers.map((offer) => (
              <OfferCard key={offer.id} offer={offer} onClick={handleOfferClick} />
            ))}
          </div>
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
