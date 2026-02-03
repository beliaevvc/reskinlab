import { useState } from 'react';
import { formatDate } from '../../lib/utils';

export function ClientsTable({ clients, isLoading, onViewDetails }) {
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedClients = [...(clients || [])].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'company_name' || sortField === 'contact_email') {
      aVal = (aVal || '').toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortHeader = ({ field, children }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <svg className={`w-4 h-4 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        )}
      </span>
    </th>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!clients || clients.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        No clients found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            <SortHeader field="company_name">Company</SortHeader>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Contact
            </th>
            <SortHeader field="contact_email">Email</SortHeader>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Projects
            </th>
            <SortHeader field="created_at">Joined</SortHeader>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {sortedClients.map((client) => (
            <tr key={client.id} className="hover:bg-neutral-50 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-emerald-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-emerald-700">
                      {client.company_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {client.company_name || 'No company'}
                    </p>
                    {client.user && (
                      <p className="text-xs text-neutral-500">
                        {client.user.full_name}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <p className="text-sm text-neutral-900">{client.contact_person || '—'}</p>
                {client.phone && (
                  <p className="text-xs text-neutral-500">{client.phone}</p>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-neutral-600">{client.contact_email}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">
                    {client.projectCount}
                  </span>
                  {client.activeProjects > 0 && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                      {client.activeProjects} active
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className="text-sm text-neutral-500">
                  {formatDate(client.created_at)}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <button
                  onClick={() => onViewDetails?.(client)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientsTable;
