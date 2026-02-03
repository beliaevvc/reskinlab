import { useState } from 'react';
import { useClients, useClientStats } from '../../hooks/useClients';
import { ClientsTable, ClientDetailModal } from '../../components/admin';

export function ClientsPage() {
  const [filters, setFilters] = useState({ search: '' });
  const [selectedClientId, setSelectedClientId] = useState(null);

  const { data: clients, isLoading } = useClients(filters);
  const { data: stats } = useClientStats();

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
        <p className="text-neutral-500 mt-1">Manage client companies and their accounts</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total Clients</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">With Active Projects</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.withActiveProjects}</p>
          </div>
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Inactive</p>
            <p className="text-2xl font-bold text-neutral-400 mt-1">{stats.inactive}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-md border border-neutral-200 p-4">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search by company name or email..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
        <ClientsTable
          clients={clients}
          isLoading={isLoading}
          onViewDetails={(client) => setSelectedClientId(client.id)}
        />
      </div>

      {/* Detail Modal */}
      <ClientDetailModal
        clientId={selectedClientId}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </div>
  );
}

export default ClientsPage;
