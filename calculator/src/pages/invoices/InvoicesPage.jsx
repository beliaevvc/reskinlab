import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices } from '../../hooks/useInvoices';
import { useAuth } from '../../contexts/AuthContext';
import { InvoiceCard, InvoicesTable } from '../../components/invoices';
import { InvoiceModal } from '../../components/project';
import { Select } from '../../components/Select';
import { formatInvoiceAmount, isInvoiceOverdue } from '../../lib/invoiceUtils';
export function InvoicesPage() {
  const { isAdmin, isStaff } = useAuth();
  const { data: invoices, isLoading, error } = useInvoices();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('invoices-view') || 'grid';
  });
  
  // Filters
  const [clientFilter, setClientFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [offerFilter, setOfferFilter] = useState('');
  
  const showClient = isAdmin || isStaff;

  const handleViewChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('invoices-view', mode);
  };

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoiceId(invoice.id);
  };

  // Get unique clients for filter (admin/staff only)
  const clients = useMemo(() => {
    if (!showClient || !invoices) return [];
    const uniqueClients = new Map();
    invoices.forEach(inv => {
      const client = inv.project?.client;
      if (client?.id && !uniqueClients.has(client.id)) {
        uniqueClients.set(client.id, {
          id: client.id,
          name: client.company_name || client.profile?.full_name || client.profile?.email || 'Unknown',
        });
      }
    });
    return Array.from(uniqueClients.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [showClient, invoices]);

  // Get unique projects for filter (filtered by client if selected)
  const projects = useMemo(() => {
    if (!invoices) return [];
    const uniqueProjects = new Map();
    invoices.forEach(inv => {
      const project = inv.project;
      if (!project?.id) return;
      // If client filter is active, only show projects for that client
      if (clientFilter && project.client?.id !== clientFilter) return;
      if (!uniqueProjects.has(project.id)) {
        uniqueProjects.set(project.id, {
          id: project.id,
          name: project.name || 'Unknown',
        });
      }
    });
    return Array.from(uniqueProjects.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices, clientFilter]);

  // Get unique offers for filter (only when project is selected)
  const offers = useMemo(() => {
    if (!invoices || !projectFilter) return [];
    const uniqueOffers = new Map();
    invoices.forEach(inv => {
      if (inv.project?.id !== projectFilter) return;
      const offer = inv.offer;
      if (offer?.id && !uniqueOffers.has(offer.id)) {
        uniqueOffers.set(offer.id, {
          id: offer.id,
          number: offer.number,
          specVersion: offer.specification?.version,
        });
      }
    });
    return Array.from(uniqueOffers.values()).sort((a, b) => a.number.localeCompare(b.number));
  }, [invoices, projectFilter]);

  // Apply filters
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => {
      if (clientFilter && inv.project?.client?.id !== clientFilter) return false;
      if (projectFilter && inv.project?.id !== projectFilter) return false;
      if (offerFilter && inv.offer?.id !== offerFilter) return false;
      return true;
    });
  }, [invoices, clientFilter, projectFilter, offerFilter]);

  // Reset dependent filters when parent changes
  const handleClientChange = (value) => {
    setClientFilter(value);
    setProjectFilter('');
    setOfferFilter('');
  };

  const handleProjectChange = (value) => {
    setProjectFilter(value);
    setOfferFilter('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <p className="text-red-800">Failed to load invoices: {error.message}</p>
      </div>
    );
  }

  // Group filtered invoices by status
  const pendingInvoices = filteredInvoices?.filter((i) => i.status === 'pending') || [];
  const overdueInvoices = pendingInvoices.filter(isInvoiceOverdue);
  const normalPending = pendingInvoices.filter((i) => !isInvoiceOverdue(i));
  const awaitingConfirmation = filteredInvoices?.filter((i) => i.status === 'awaiting_confirmation') || [];
  const paidInvoices = filteredInvoices?.filter((i) => i.status === 'paid') || [];
  const cancelledInvoices = filteredInvoices?.filter((i) => i.status === 'cancelled') || [];

  // Calculate totals (from filtered)
  const filteredPendingAmount = pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount_usd || 0), 0);
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount_usd || 0), 0);
  
  const hasActiveFilters = clientFilter || projectFilter || offerFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Invoices</h1>
          <p className="text-neutral-500 mt-1">
            Track and pay your project invoices
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

      {/* Stats */}
      {invoices && invoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">{hasActiveFilters ? 'Filtered' : 'Total'} Invoices</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{filteredInvoices.length}</p>
            {hasActiveFilters && (
              <p className="text-xs text-neutral-400 mt-1">of {invoices.length} total</p>
            )}
          </div>
          <div className="bg-white rounded-lg border border-amber-200 p-4">
            <p className="text-sm text-amber-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {formatInvoiceAmount(filteredPendingAmount)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{pendingInvoices.length} invoices</p>
          </div>
          <div className="bg-white rounded-lg border border-emerald-200 p-4">
            <p className="text-sm text-emerald-600">Paid</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatInvoiceAmount(paidAmount)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">{paidInvoices.length} invoices</p>
          </div>
          {awaitingConfirmation.length > 0 && (
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <p className="text-sm text-blue-600">Awaiting Confirmation</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{awaitingConfirmation.length}</p>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {invoices && invoices.length > 0 && (clients.length > 0 || projects.length > 0) && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Client filter (admin/staff only) */}
            {showClient && clients.length > 0 && (
              <div className="w-52">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Client</label>
                <Select
                  value={clientFilter}
                  onChange={handleClientChange}
                  options={[
                    { value: '', label: 'All clients' },
                    ...clients.map(c => ({ value: c.id, label: c.name }))
                  ]}
                />
              </div>
            )}

            {/* Project filter */}
            {projects.length > 0 && (
              <div className="w-52">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Project</label>
                <Select
                  value={projectFilter}
                  onChange={handleProjectChange}
                  options={[
                    { value: '', label: 'All projects' },
                    ...projects.map(p => ({ value: p.id, label: p.name }))
                  ]}
                />
              </div>
            )}

            {/* Offer filter (only when project selected) */}
            {projectFilter && offers.length > 0 && (
              <div className="w-60">
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Offer / Spec</label>
                <Select
                  value={offerFilter}
                  onChange={setOfferFilter}
                  options={[
                    { value: '', label: 'All offers' },
                    ...offers.map(o => ({
                      value: o.id,
                      label: `${o.number}${o.specVersion ? ` (${o.specVersion})` : ''}`
                    }))
                  ]}
                />
              </div>
            )}

            {/* Clear filters & count */}
            {hasActiveFilters && (
              <div className="flex items-center gap-3 ml-auto">
                <span className="text-sm text-neutral-400">
                  {filteredInvoices.length} of {invoices.length}
                </span>
                <button
                  onClick={() => {
                    setClientFilter('');
                    setProjectFilter('');
                    setOfferFilter('');
                  }}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state - no invoices at all */}
      {(!invoices || invoices.length === 0) && (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900">
            No invoices yet
          </h2>
          <p className="mt-2 text-neutral-500 max-w-md mx-auto">
            Invoices will appear here after you accept an offer.
          </p>
          <Link
            to="/offers"
            className="inline-flex items-center gap-2 mt-6 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2.5 rounded transition-colors"
          >
            View Offers
          </Link>
        </div>
      )}

      {/* Empty state - filters applied but no results */}
      {invoices && invoices.length > 0 && filteredInvoices.length === 0 && hasActiveFilters && (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h2 className="mt-4 text-lg font-semibold text-neutral-900">
            No invoices match your filters
          </h2>
          <p className="mt-2 text-neutral-500">
            Try adjusting your filters to see more results.
          </p>
          <button
            onClick={() => {
              setClientFilter('');
              setProjectFilter('');
              setOfferFilter('');
            }}
            className="mt-6 px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Overdue invoices */}
      {overdueInvoices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-red-600 uppercase tracking-wide flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Overdue ({overdueInvoices.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {overdueInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <InvoicesTable invoices={overdueInvoices} onInvoiceClick={handleInvoiceClick} showClient={showClient} />
            </div>
          )}
        </div>
      )}

      {/* Awaiting Confirmation */}
      {awaitingConfirmation.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Awaiting Confirmation ({awaitingConfirmation.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {awaitingConfirmation.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <InvoicesTable invoices={awaitingConfirmation} onInvoiceClick={handleInvoiceClick} showClient={showClient} />
            </div>
          )}
        </div>
      )}

      {/* Pending invoices */}
      {normalPending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neutral-400" />
            Pending Payment ({normalPending.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {normalPending.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <InvoicesTable invoices={normalPending} onInvoiceClick={handleInvoiceClick} showClient={showClient} />
            </div>
          )}
        </div>
      )}

      {/* Paid invoices */}
      {paidInvoices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-emerald-600 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Paid ({paidInvoices.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {paidInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200">
              <InvoicesTable invoices={paidInvoices} onInvoiceClick={handleInvoiceClick} showClient={showClient} />
            </div>
          )}
        </div>
      )}

      {/* Cancelled */}
      {cancelledInvoices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wide">
            Cancelled ({cancelledInvoices.length})
          </h2>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 opacity-60">
              {cancelledInvoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} onClick={handleInvoiceClick} showClient={showClient} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-neutral-200 opacity-60">
              <InvoicesTable invoices={cancelledInvoices} onInvoiceClick={handleInvoiceClick} showClient={showClient} />
            </div>
          )}
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
}

export default InvoicesPage;
