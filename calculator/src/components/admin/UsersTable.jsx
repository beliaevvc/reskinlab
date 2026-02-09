import { useState } from 'react';
import { formatDate, formatCurrency, formatDateTime } from '../../lib/utils';
import UserAvatar from '../UserAvatar';

const ROLE_BADGES = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  am: { label: 'AM', color: 'bg-blue-100 text-blue-700' },
  client: { label: 'Client', color: 'bg-emerald-100 text-emerald-700' },
};

export function UsersTable({ 
  users, 
  isLoading, 
  onEditRole, 
  onViewDetails,
  onViewFinance,
  selectedIds = [],
  onSelectionChange,
  showCheckboxes = false 
}) {
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

  const sortedUsers = [...(users || [])].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    
    if (sortField === 'full_name' || sortField === 'email') {
      aVal = (aVal || '').toLowerCase();
      bVal = (bVal || '').toLowerCase();
    }
    
    if (sortField === 'company') {
      aVal = (a.client?.company_name || '').toLowerCase();
      bVal = (b.client?.company_name || '').toLowerCase();
    }
    
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectionChange?.(users?.map(u => u.id) || []);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectOne = (userId) => {
    if (selectedIds.includes(userId)) {
      onSelectionChange?.(selectedIds.filter(id => id !== userId));
    } else {
      onSelectionChange?.([...selectedIds, userId]);
    }
  };

  const SortHeader = ({ field, children, className = '' }) => (
    <th
      onClick={() => handleSort(field)}
      className={`px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none ${className}`}
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

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        No users found
      </div>
    );
  }

  const allSelected = users.length > 0 && selectedIds.length === users.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < users.length;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            {showCheckboxes && (
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={input => {
                    if (input) input.indeterminate = someSelected;
                  }}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
                />
              </th>
            )}
            <SortHeader field="full_name">User</SortHeader>
            <SortHeader field="email">Email</SortHeader>
            <SortHeader field="role">Role</SortHeader>
            <SortHeader field="company">Company</SortHeader>
            <SortHeader field="projects_count">Projects</SortHeader>
            <SortHeader field="total_revenue">Revenue</SortHeader>
            <SortHeader field="created_at">Joined</SortHeader>
            <SortHeader field="last_login_at">Last Login</SortHeader>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-neutral-200">
          {sortedUsers.map((user) => {
            const roleBadge = ROLE_BADGES[user.role] || ROLE_BADGES.client;
            const isSelected = selectedIds.includes(user.id);
            
            return (
              <tr 
                key={user.id} 
                className={`hover:bg-neutral-50 transition-colors ${isSelected ? 'bg-emerald-50' : ''}`}
              >
                {showCheckboxes && (
                  <td className="px-4 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectOne(user.id)}
                      className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
                    />
                  </td>
                )}
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(user, 'profile');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={user.full_name}
                      email={user.email}
                      avatarUrl={user.avatar_url}
                      role={user.role}
                      size="md"
                    />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">
                        {user.full_name || 'No name'}
                      </p>
                    </div>
                  </div>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(user, 'profile');
                  }}
                >
                  <span className="text-sm text-neutral-600">{user.email}</span>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRole?.(user);
                  }}
                >
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(user, 'profile');
                  }}
                >
                  <span className="text-sm text-neutral-500">
                    {user.client?.company_name || '—'}
                  </span>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(user, 'projects');
                  }}
                >
                  <span className="text-sm text-neutral-900 font-medium">
                    {user.projects_count || 0}
                  </span>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewFinance?.(user);
                  }}
                >
                  <span className="text-sm text-neutral-900 font-medium">
                    {formatCurrency(user.total_revenue || 0)}
                  </span>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(user, 'profile');
                  }}
                >
                  <span className="text-sm text-neutral-500">
                    {formatDate(user.created_at)}
                  </span>
                </td>
                <td 
                  className="px-4 py-4 whitespace-nowrap cursor-pointer hover:bg-neutral-100 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(user, 'profile');
                  }}
                >
                  <span className="text-sm text-neutral-500" title={user.last_login_at ? formatDateTime(user.last_login_at) : ''}>
                    {user.last_login_at ? formatDateTime(user.last_login_at) : '—'}
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

export default UsersTable;
