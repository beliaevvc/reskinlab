import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUsers, useUpdateUserRole, useUserStats, useBulkUpdateRoles } from '../../hooks/useUsers';
import { UsersTable, UserRoleModal, UserDetailModal } from '../../components/admin';

export function UsersPage() {
  const { t } = useTranslation('admin');
  const [filters, setFilters] = useState({ role: 'all', search: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailUserId, setDetailUserId] = useState(null);
  const [detailUserTab, setDetailUserTab] = useState('profile');
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  const { data: users, isLoading } = useUsers(filters);
  const { data: stats } = useUserStats();
  const updateRole = useUpdateUserRole();
  const bulkUpdateRoles = useBulkUpdateRoles();

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleRoleFilter = (role) => {
    setFilters(prev => ({ ...prev, role }));
  };

  const handleSaveRole = async (newRole) => {
    try {
      await updateRole.mutateAsync({ 
        userId: selectedUser.id, 
        role: newRole,
        oldRole: selectedUser.role 
      });
      setSelectedUser(null);
    } catch (err) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleBulkRoleChange = async (newRole) => {
    if (!confirm(t('users.confirmBulkRole', { role: newRole, count: selectedIds.length }))) return;
    
    try {
      await bulkUpdateRoles.mutateAsync({ userIds: selectedIds, role: newRole });
      setSelectedIds([]);
      setShowBulkActions(false);
    } catch (err) {
      alert('Failed to update roles: ' + err.message);
    }
  };

  const handleSelectionChange = (ids) => {
    setSelectedIds(ids);
    setShowBulkActions(ids.length > 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('users.title')}</h1>
          <p className="text-neutral-500 mt-1">{t('users.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">{t('users.stats.total')}</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">{t('users.stats.admins')}</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{stats.admins}</p>
          </div>
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">{t('users.stats.ams')}</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.ams}</p>
          </div>
          <div className="bg-white rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">{t('users.stats.clients')}</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.clients}</p>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              {t('users.selected', { count: selectedIds.length })}
            </span>
            <span className="text-emerald-700">{t('users.bulkActions')}</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              onChange={(e) => {
                if (e.target.value) handleBulkRoleChange(e.target.value);
                e.target.value = '';
              }}
              className="px-3 py-2 border border-emerald-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled={bulkUpdateRoles.isPending}
            >
              <option value="">{t('users.changeRoleTo')}</option>
              <option value="admin">{t('users.roles.admin')}</option>
              <option value="am">{t('users.roles.am')}</option>
              <option value="client">{t('users.roles.client')}</option>
            </select>
            <button
              onClick={() => {
                setSelectedIds([]);
                setShowBulkActions(false);
              }}
              className="px-3 py-2 text-emerald-700 hover:text-emerald-900"
            >
              {t('users.clearSelection')}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-md border border-neutral-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
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
                placeholder={t('users.search')}
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {['all', 'admin', 'am', 'client'].map((role) => (
              <button
                key={role}
                onClick={() => handleRoleFilter(role)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  filters.role === role
                    ? 'bg-emerald-500 text-white'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {t(`users.roles.${role}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
        <UsersTable
          users={users}
          isLoading={isLoading}
          onEditRole={setSelectedUser}
          onViewDetails={(user, tab = 'profile') => {
            setDetailUserId(user.id);
            setDetailUserTab(tab);
          }}
          onViewFinance={(user) => {
            setDetailUserId(user.id);
            setDetailUserTab('finance');
          }}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectionChange}
          showCheckboxes={true}
        />
      </div>

      {/* Role Modal */}
      <UserRoleModal
        user={selectedUser}
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        onSave={handleSaveRole}
        isSaving={updateRole.isPending}
      />

      {/* Detail Modal */}
      <UserDetailModal
        userId={detailUserId}
        isOpen={!!detailUserId}
        onClose={() => {
          setDetailUserId(null);
          setDetailUserTab('profile');
        }}
        initialTab={detailUserTab}
      />
    </div>
  );
}

export default UsersPage;
