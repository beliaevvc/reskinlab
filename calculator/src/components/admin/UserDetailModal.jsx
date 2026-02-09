import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useUser, useAdminUpdateProfile, useUpdateUserRole } from '../../hooks/useUsers';
import { useUpdateClient } from '../../hooks/useClients';
import { useDeleteProject } from '../../hooks/useProjects';
import { formatDate, formatCurrency, formatDateTime } from '../../lib/utils';
import { getInvoiceStatusInfo, isInvoiceOverdue, formatInvoiceAmount } from '../../lib/invoiceUtils';
import { InvoiceModal } from '../project/InvoiceModal';
import { OfferModal } from '../project/OfferModal';
import { SpecificationModal } from '../project/SpecificationModal';
import UserAvatar from '../UserAvatar';

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    badge: 'bg-purple-100 text-purple-700',
    avatarRing: 'ring-purple-400',
    dotColor: 'bg-purple-400',
  },
  am: {
    label: 'Account Manager',
    badge: 'bg-blue-100 text-blue-700',
    avatarRing: 'ring-blue-400',
    dotColor: 'bg-blue-400',
  },
  client: {
    label: 'Client',
    badge: 'bg-emerald-100 text-emerald-700',
    avatarRing: 'ring-emerald-400',
    dotColor: 'bg-emerald-400',
  },
};

const TAB_ICONS = {
  profile: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  company: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  projects: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  specs: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  finance: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  activity: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company' },
  { id: 'projects', label: 'Projects' },
  { id: 'specs', label: 'Specs / Offers' },
  { id: 'finance', label: 'Finance' },
  { id: 'activity', label: 'Activity' },
];

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login: 'bg-purple-100 text-purple-700',
  logout: 'bg-neutral-100 text-neutral-700',
  accept: 'bg-green-100 text-green-700',
};

const ACTION_ICONS = {
  create: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  update: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  delete: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  login: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  ),
  logout: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
};

const PROJECT_STATUS_COLORS = {
  draft: 'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

function getRelativeTime(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return null; // fallback to formatted date
}

function isRecentlyActive(dateStr) {
  if (!dateStr) return false;
  const diffMs = new Date() - new Date(dateStr);
  return diffMs < 24 * 60 * 60 * 1000; // 24 hours
}

/**
 * Inline editable field — click to edit, save on Enter/blur, cancel on Escape.
 */
function InlineField({ value, onSave, type = 'text', placeholder = '—', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(value || ''); }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = useCallback(async () => {
    const trimmed = draft.trim();
    if (trimmed === (value || '')) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(trimmed); }
    catch (e) { console.error('Inline save failed:', e); }
    finally { setSaving(false); setEditing(false); }
  }, [draft, value, onSave]);

  const cancel = useCallback(() => { setDraft(value || ''); setEditing(false); }, [value]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  }, [save, cancel]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className={`text-sm text-neutral-900 bg-transparent border-b border-emerald-400 outline-none py-0 px-0 min-w-[120px] ${saving ? 'opacity-50' : ''} ${className}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`text-sm text-neutral-900 hover:text-emerald-600 transition-colors cursor-pointer border-b border-transparent hover:border-emerald-300 ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-neutral-400">{placeholder}</span>}
    </button>
  );
}

/**
 * Inline role selector — click to open dropdown.
 */
function InlineRoleField({ value, onSave, roleConfig: currentRoleConfig }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => { if (editing && selectRef.current) selectRef.current.focus(); }, [editing]);

  const handleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole === value) { setEditing(false); return; }
    setSaving(true);
    try { await onSave(newRole); }
    catch (err) { console.error('Role save failed:', err); }
    finally { setSaving(false); setEditing(false); }
  };

  if (editing) {
    return (
      <select
        ref={selectRef}
        value={value}
        onChange={handleChange}
        onBlur={() => setEditing(false)}
        disabled={saving}
        className={`text-xs font-medium border border-emerald-300 rounded-full px-2.5 py-0.5 outline-none bg-white cursor-pointer ${saving ? 'opacity-50' : ''}`}
      >
        <option value="admin">Admin</option>
        <option value="am">Account Manager</option>
        <option value="client">Client</option>
      </select>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="group/role inline-flex items-center gap-1.5 cursor-pointer"
      title="Click to change role"
    >
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${currentRoleConfig.badge} group-hover/role:ring-1 group-hover/role:ring-emerald-300 transition-all`}>
        <span className={`w-1.5 h-1.5 rounded-full ${currentRoleConfig.dotColor}`} />
        {currentRoleConfig.label}
      </span>
    </button>
  );
}

export function UserDetailModal({ userId, isOpen, onClose, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [selectedSpecId, setSelectedSpecId] = useState(null);
  const { data: user, isLoading, refetch } = useUser(userId);
  const deleteProject = useDeleteProject();
  const updateProfile = useAdminUpdateProfile();
  const updateRole = useUpdateUserRole();
  const updateClient = useUpdateClient();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, userId, isOpen]);

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProject.mutateAsync(projectId);
      setDeleteConfirm(null);
      refetch();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Inline save handlers
  const saveProfileField = useCallback(async (field, value) => {
    if (!user?.id) return;
    await updateProfile.mutateAsync({ userId: user.id, updates: { [field]: value } });
  }, [user?.id, updateProfile]);

  const saveRole = useCallback(async (newRole) => {
    if (!user?.id) return;
    await updateRole.mutateAsync({ userId: user.id, role: newRole, oldRole: user.role });
  }, [user?.id, user?.role, updateRole]);

  const saveClientField = useCallback(async (field, value) => {
    if (!user?.client?.id) return;
    await updateClient.mutateAsync({ clientId: user.client.id, updates: { [field]: value } });
  }, [user?.client?.id, updateClient]);

  if (!isOpen) return null;

  const roleConfig = ROLE_CONFIG[user?.role] || ROLE_CONFIG.client;
  const recentlyActive = isRecentlyActive(user?.last_login_at);

  const renderHeroHeader = () => {
    if (isLoading) {
      return (
        <div className="px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="w-[72px] h-[72px] rounded-full bg-neutral-200 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-40 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-56 bg-neutral-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      );
    }

    if (!user) return null;

    return (
      <div className="relative px-6 pt-5 pb-4">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <UserAvatar
              name={user.full_name}
              email={user.email}
              avatarUrl={user.avatar_url}
              role={user.role}
              size="xl"
              ring
              className="ring-offset-2 ring-offset-white"
            />
            {/* Online status dot */}
            <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${recentlyActive ? 'bg-emerald-400' : 'bg-neutral-300'}`} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-neutral-900 truncate">
                  {user.full_name || 'No name'}
                </h2>
                <p className="text-sm text-neutral-500 truncate">{user.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${roleConfig.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dotColor}`} />
                {roleConfig.label}
              </span>
            </div>

            {/* Quick stats row */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="font-medium text-neutral-700">{user.projects_count || user.projects?.length || 0}</span>
                <span>projects</span>
              </div>
              <div className="w-px h-3 bg-neutral-200" />
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-neutral-700">{formatCurrency(user.total_revenue || user.finance?.total_revenue || 0)}</span>
              </div>
              <div className="w-px h-3 bg-neutral-200" />
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Joined {formatDate(user.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 -mt-1 -mr-1 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      );
    }

    if (!user) {
      return <div className="py-8 text-center text-neutral-500">User not found</div>;
    }

    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-4">
            {/* Personal info — editable */}
            <div className="bg-white rounded-lg border border-neutral-200 divide-y divide-neutral-100">
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Full Name</span>
                <InlineField
                  value={user.full_name}
                  onSave={(v) => saveProfileField('full_name', v)}
                  placeholder="Add name"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Email</span>
                <span className="text-sm text-neutral-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Phone</span>
                <InlineField
                  value={user.phone}
                  onSave={(v) => saveProfileField('phone', v)}
                  type="tel"
                  placeholder="Add phone"
                />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-xs text-neutral-400 uppercase tracking-wider">Role</span>
                <InlineRoleField
                  value={user.role}
                  onSave={saveRole}
                  roleConfig={roleConfig}
                />
              </div>
            </div>

            {/* System info — 2x2 grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${user.is_active !== false ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className={`text-sm font-medium ${user.is_active !== false ? 'text-emerald-600' : 'text-red-600'}`}>
                    {user.is_active !== false ? 'Active' : 'Blocked'}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Joined</p>
                <p className="text-sm text-neutral-900 mt-1">{formatDate(user.created_at)}</p>
              </div>
              <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Last Login</p>
                <p className="text-sm text-neutral-900 mt-1">
                  {user.last_login_at 
                    ? (getRelativeTime(user.last_login_at) || formatDateTime(user.last_login_at))
                    : '—'}
                </p>
              </div>
              <div 
                className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5 cursor-pointer hover:border-neutral-300 transition-colors"
                onClick={handleCopyId}
                title="Click to copy"
              >
                <p className="text-xs text-neutral-400 uppercase tracking-wider">{copiedId ? 'Copied!' : 'User ID'}</p>
                <p className="text-xs font-mono text-neutral-500 mt-1 truncate">{user.id}</p>
              </div>
            </div>

            {/* Company quick info (if client) */}
            {user.client?.company_name && (
              <button 
                onClick={() => setActiveTab('company')}
                className="w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors text-left group"
              >
                <div className="min-w-0">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">Company</p>
                  <p className="text-sm font-medium text-neutral-900 mt-0.5">{user.client.company_name}</p>
                </div>
                <svg className="w-4 h-4 text-neutral-300 group-hover:text-neutral-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        );

      case 'company':
        return (
          <div className="space-y-4">
            {user.client ? (
              <>
                {/* Company name — prominent */}
                <div className="bg-white rounded-lg border border-neutral-200 px-4 py-4">
                  <p className="text-xs text-neutral-400 uppercase tracking-wider">Company Name</p>
                  <div className="mt-1">
                    <InlineField
                      value={user.client.company_name}
                      onSave={(v) => saveClientField('company_name', v)}
                      placeholder="Add company name"
                      className="font-medium text-base"
                    />
                  </div>
                </div>

                {/* Contact details — 2x2 grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">Contact Email</p>
                    <p className="text-sm text-neutral-900 mt-1 truncate">{user.email}</p>
                  </div>
                  <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">Phone</p>
                    <div className="mt-1">
                      <InlineField
                        value={user.client.contact_phone}
                        onSave={(v) => saveClientField('contact_phone', v)}
                        placeholder="Add phone"
                        className="text-left"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">Country</p>
                    <div className="mt-1">
                      <InlineField
                        value={user.client.country}
                        onSave={(v) => saveClientField('country', v)}
                        placeholder="Add country"
                        className="text-left"
                      />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider">Address</p>
                    <div className="mt-1">
                      <InlineField
                        value={user.client.address}
                        onSave={(v) => saveClientField('address', v)}
                        placeholder="Add address"
                        className="text-left"
                      />
                    </div>
                  </div>
                </div>

                {/* Notes — separate block */}
                {user.client.notes && (
                  <div className="bg-white rounded-lg border border-neutral-200 px-4 py-3.5">
                    <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Notes</p>
                    <p className="text-sm text-neutral-700 leading-relaxed">{user.client.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-neutral-400">No company linked to this user</p>
              </div>
            )}
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-3">
            {user.projects?.length > 0 ? (
              user.projects.map(project => {
                const specCount = project.specifications?.[0]?.count || 
                                (Array.isArray(project.specifications) ? project.specifications.length : 0);
                
                const invoices = project.invoices || [];
                const paidInvoices = invoices.filter(i => i.status === 'paid').length;
                const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
                
                const workflowStages = (project.workflow_stages || []).sort((a, b) => (a.order || 0) - (b.order || 0));
                const activeStage = workflowStages.find(s => s.status === 'in_progress') || 
                                  workflowStages.find(s => s.status === 'review') ||
                                  workflowStages.find(s => s.status === 'pending');
                const completedStages = workflowStages.filter(s => s.status === 'completed' || s.status === 'approved').length;
                const totalStages = workflowStages.length;
                
                return (
                  <div key={project.id} className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-neutral-300 hover:shadow-sm transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <Link 
                        to={`/admin/projects/${project.id}`}
                        onClick={onClose}
                        className="flex-1 min-w-0"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            project.status === 'completed' ? 'bg-emerald-50' :
                            project.status === 'in_progress' ? 'bg-blue-50' :
                            project.status === 'review' ? 'bg-amber-50' : 'bg-neutral-100'
                          }`}>
                            <svg className={`w-4.5 h-4.5 ${
                              project.status === 'completed' ? 'text-emerald-600' :
                              project.status === 'in_progress' ? 'text-blue-600' :
                              project.status === 'review' ? 'text-amber-600' : 'text-neutral-400'
                            }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 hover:text-emerald-600 transition-colors text-sm">
                              {project.name}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5">Created {formatDate(project.created_at)}</p>
                          </div>
                        </div>
                        
                        {/* Stats row */}
                        <div className="flex items-center gap-3 ml-12">
                          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{specCount} specs</span>
                          </div>

                          <div className="w-px h-3 bg-neutral-200" />

                          <div className="flex items-center gap-1.5 text-xs">
                            <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {paidInvoices > 0 && <span className="text-emerald-600 font-medium">{paidInvoices} paid</span>}
                            {paidInvoices > 0 && pendingInvoices > 0 && <span className="text-neutral-300">/</span>}
                            {pendingInvoices > 0 && <span className="text-amber-600 font-medium">{pendingInvoices} pending</span>}
                            {paidInvoices === 0 && pendingInvoices === 0 && <span className="text-neutral-500">0 invoices</span>}
                          </div>

                          {totalStages > 0 && (
                            <>
                              <div className="w-px h-3 bg-neutral-200" />
                              <div className="flex items-center gap-2 flex-1">
                                <div className="flex-1 max-w-[100px] h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all"
                                    style={{ width: `${(completedStages / totalStages) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs text-neutral-500">{completedStages}/{totalStages}</span>
                              </div>
                            </>
                          )}
                        </div>

                        {activeStage && (
                          <div className="ml-12 mt-2">
                            <span className="inline-flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 rounded px-2 py-0.5">
                              <span className="w-1 h-1 rounded-full bg-blue-500" />
                              {activeStage.stage_key || activeStage.name}
                            </span>
                          </div>
                        )}
                      </Link>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${PROJECT_STATUS_COLORS[project.status] || PROJECT_STATUS_COLORS.draft}`}>
                          {project.status?.replace('_', ' ') || 'Draft'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirm(project);
                          }}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete project"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-500">No projects found</p>
              </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
                <div className="relative bg-white rounded-lg max-w-sm w-full p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900">Delete project?</h3>
                  </div>
                  <p className="text-sm text-neutral-600 mb-6">
                    <span className="font-medium text-neutral-900">{deleteConfirm.name}</span> and all its data will be permanently deleted.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteProject(deleteConfirm.id)}
                      disabled={deleteProject.isPending}
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {deleteProject.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'specs': {
        const specsList = user.specifications || [];
        const projects = user.projects || [];
        
        // Build a project name lookup
        const projectNames = {};
        projects.forEach(p => { projectNames[p.id] = p.name; });

        // Group specs by project
        const specsGrouped = {};
        specsList.forEach(spec => {
          const projId = spec.project_id || 'unknown';
          const projName = projectNames[projId] || 'Unknown project';
          if (!specsGrouped[projId]) {
            specsGrouped[projId] = { name: projName, specs: [] };
          }
          specsGrouped[projId].specs.push(spec);
        });

        const SPEC_STATUS_COLORS = {
          draft: 'bg-neutral-100 text-neutral-600',
          ready: 'bg-blue-100 text-blue-700',
          approved: 'bg-emerald-100 text-emerald-700',
          archived: 'bg-amber-100 text-amber-700',
        };

        const OFFER_STATUS_COLORS = {
          draft: 'bg-neutral-100 text-neutral-600',
          sent: 'bg-blue-100 text-blue-700',
          accepted: 'bg-emerald-100 text-emerald-700',
          rejected: 'bg-red-100 text-red-700',
          expired: 'bg-amber-100 text-amber-700',
        };

        const totalOffers = specsList.reduce((sum, s) => sum + (s.offers?.length || 0), 0);

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-900">Specifications & Offers</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">{specsList.length} spec{specsList.length !== 1 ? 's' : ''}</span>
                {totalOffers > 0 && (
                  <span className="text-xs text-neutral-400">{totalOffers} offer{totalOffers !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>

            {specsList.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(specsGrouped).map(([projId, projectGroup]) => (
                  <div key={projId} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                    {/* Project header */}
                    <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <span className="text-sm font-semibold text-neutral-900">{projectGroup.name}</span>
                        <span className="text-xs text-neutral-400 ml-auto">{projectGroup.specs.length} spec{projectGroup.specs.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    {/* Specs inside project */}
                    <div className="divide-y divide-neutral-100">
                      {projectGroup.specs.map(spec => {
                        const specLabel = spec.number || spec.version || `v${spec.version_number || '?'}`;
                        const totalAmount = spec.totals_json?.total_usd || spec.totals_json?.grand_total_usd || 0;
                        const offers = spec.offers || [];

                        return (
                          <div key={spec.id}>
                            {/* Spec header */}
                            <div className="px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => setSelectedSpecId(spec.id)}
                                  className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-medium hover:bg-emerald-100 transition-colors"
                                >
                                  {specLabel}
                                </button>
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${SPEC_STATUS_COLORS[spec.status] || SPEC_STATUS_COLORS.draft}`}>
                                  {spec.status}
                                </span>
                                {spec.is_addon && (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-violet-100 text-violet-600">addon</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                {totalAmount > 0 && (
                                  <span className="text-xs font-medium text-neutral-500">{formatCurrency(totalAmount)}</span>
                                )}
                                <span className="text-xs text-neutral-400">{formatDate(spec.created_at)}</span>
                              </div>
                            </div>

                            {/* Offers under this spec */}
                            {offers.length > 0 && (
                              <div className="border-t border-neutral-50 bg-neutral-50/30">
                                <div className="px-4 py-1.5">
                                  <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Offers ({offers.length})</span>
                                </div>
                                <div className="divide-y divide-neutral-50">
                                  {offers.map(offer => {
                                    const offerInvoices = offer.invoices || [];
                                    const paidCount = offerInvoices.filter(i => i.status === 'paid').length;
                                    const totalInvoices = offerInvoices.length;
                                    const paidAmount = offerInvoices
                                      .filter(i => i.status === 'paid')
                                      .reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0);

                                    return (
                                      <button
                                        key={offer.id}
                                        onClick={() => setSelectedOfferId(offer.id)}
                                        className="flex items-center gap-3 px-4 pl-8 py-2.5 hover:bg-neutral-50 transition-colors group w-full text-left"
                                      >
                                        {/* Status dot */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                          offer.status === 'accepted' ? 'bg-emerald-400' :
                                          offer.status === 'sent' ? 'bg-blue-400' :
                                          offer.status === 'rejected' ? 'bg-red-400' :
                                          offer.status === 'expired' ? 'bg-amber-400' : 'bg-neutral-300'
                                        }`} />
                                        
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-neutral-900 group-hover:text-emerald-600 transition-colors">
                                              {offer.number}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${OFFER_STATUS_COLORS[offer.status] || OFFER_STATUS_COLORS.draft}`}>
                                              {offer.status}
                                            </span>
                                          </div>
                                          <p className="text-xs text-neutral-400 mt-0.5">
                                            {formatDate(offer.created_at)}
                                            {totalInvoices > 0 && (
                                              <span className="ml-2">
                                                {paidCount}/{totalInvoices} invoices paid
                                              </span>
                                            )}
                                          </p>
                                        </div>

                                        {/* Paid amount */}
                                        {paidAmount > 0 && (
                                          <div className="text-right flex-shrink-0">
                                            <p className="text-sm font-medium text-emerald-600">
                                              {formatCurrency(paidAmount)}
                                            </p>
                                            <p className="text-[11px] text-neutral-400">paid</p>
                                          </div>
                                        )}

                                        {/* Arrow */}
                                        <svg className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-500">No specifications yet</p>
              </div>
            )}
          </div>
        );
      }

      case 'finance': {
        const invoicesList = user.invoices || [];
        return (
          <div className="space-y-4">
            {/* Revenue cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg border border-neutral-200 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-r" />
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Revenue</p>
                    <p className="text-xl font-bold text-neutral-900 mt-1">{formatCurrency(user.finance?.total_revenue || 0)}</p>
                    <p className="text-xs text-emerald-600 font-medium mt-1">{user.finance?.paid_invoices || 0} paid invoices</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-r" />
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium">Pending</p>
                    <p className="text-xl font-bold text-neutral-900 mt-1">{formatCurrency(user.finance?.pending_revenue || 0)}</p>
                    <p className="text-xs text-amber-600 font-medium mt-1">{user.finance?.pending_invoices || 0} pending invoices</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lifetime value */}
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-lg p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 uppercase tracking-wider font-medium">Total Lifetime Value</p>
                  <p className="text-3xl font-bold mt-1">
                    {formatCurrency((user.finance?.total_revenue || 0) + (user.finance?.pending_revenue || 0))}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Invoices grouped by project */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-900">Invoices</h3>
                <span className="text-xs text-neutral-500">{invoicesList.length} total</span>
              </div>

              {invoicesList.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Group by project, then by offer/spec
                    const grouped = {};
                    invoicesList.forEach(inv => {
                      const projId = inv.project_id;
                      const projName = inv.project?.name || 'Unknown project';
                      if (!grouped[projId]) {
                        grouped[projId] = { name: projName, offers: {} };
                      }
                      const offerKey = inv.offer?.id || 'no-offer';
                      const offerLabel = inv.offer?.number || null;
                      const specLabel = inv.offer?.specification?.number || inv.offer?.specification?.version || null;
                      if (!grouped[projId].offers[offerKey]) {
                        grouped[projId].offers[offerKey] = { 
                          offerLabel, 
                          specLabel, 
                          invoices: [] 
                        };
                      }
                      grouped[projId].offers[offerKey].invoices.push(inv);
                    });

                    return Object.entries(grouped).map(([projId, projectGroup]) => {
                      const projectTotal = Object.values(projectGroup.offers)
                        .flatMap(o => o.invoices)
                        .reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0);
                      const projectPaid = Object.values(projectGroup.offers)
                        .flatMap(o => o.invoices)
                        .filter(i => i.status === 'paid')
                        .reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0);

                      return (
                        <div key={projId} className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                          {/* Project header */}
                          <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                  </svg>
                                </div>
                                <span className="text-sm font-semibold text-neutral-900">{projectGroup.name}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-medium text-neutral-900">
                                  {formatCurrency(projectTotal)}
                                </span>
                                {projectPaid > 0 && projectPaid < projectTotal && (
                                  <span className="text-xs text-emerald-600 ml-1.5">
                                    ({formatCurrency(projectPaid)} paid)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Offers/specs groups */}
                          <div className="divide-y divide-neutral-100">
                            {Object.entries(projectGroup.offers).map(([offerKey, offerGroup]) => (
                              <div key={offerKey}>
                                {/* Offer/Spec sub-header (only if there's offer info) */}
                                {(offerGroup.offerLabel || offerGroup.specLabel) && (
                                  <div className="px-4 py-2 bg-neutral-50/50 flex items-center gap-2">
                                    {offerGroup.offerLabel && (
                                      <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-medium">
                                        {offerGroup.offerLabel}
                                      </span>
                                    )}
                                    {offerGroup.specLabel && (
                                      <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-medium">
                                        {offerGroup.specLabel}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Invoice rows */}
                                <div className="divide-y divide-neutral-50">
                                  {offerGroup.invoices.map(invoice => {
                                    const overdue = isInvoiceOverdue(invoice);
                                    const statusInfo = getInvoiceStatusInfo(overdue ? 'overdue' : invoice.status);
                                    const statusBarColor = 
                                      invoice.status === 'paid' ? 'bg-emerald-400' :
                                      invoice.status === 'awaiting_confirmation' ? 'bg-blue-400' :
                                      overdue ? 'bg-red-400' : 'bg-neutral-300';

                                    return (
                                      <button
                                        key={invoice.id}
                                        onClick={() => setSelectedInvoiceId(invoice.id)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors group w-full text-left"
                                      >
                                        {/* Status dot */}
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusBarColor}`} />
                                        
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-neutral-900 group-hover:text-emerald-600 transition-colors">
                                              {invoice.number}
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${statusInfo.bgClass} ${statusInfo.textClass}`}>
                                              {statusInfo.label}
                                            </span>
                                            {invoice.rejection_reason && invoice.status === 'pending' && (
                                              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-700">
                                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                                                </svg>
                                                Retry
                                              </span>
                                            )}
                                          </div>
                                          {invoice.milestone_name && (
                                            <p className="text-xs text-neutral-400 mt-0.5 truncate">{invoice.milestone_name}</p>
                                          )}
                                        </div>

                                        {/* Amount + date */}
                                        <div className="text-right flex-shrink-0">
                                          <p className="text-sm font-semibold text-neutral-900">
                                            {formatInvoiceAmount(invoice.amount_usd, invoice.currency || 'USDT')}
                                          </p>
                                          <p className="text-[11px] text-neutral-400 mt-0.5">
                                            {invoice.paid_at 
                                              ? `Paid ${formatDate(invoice.paid_at)}`
                                              : invoice.due_date 
                                                ? `Due ${formatDate(invoice.due_date)}`
                                                : formatDate(invoice.created_at)
                                            }
                                          </p>
                                        </div>

                                        {/* Arrow */}
                                        <svg className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-neutral-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-500">No invoices yet</p>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'activity':
        return (
          <div className="space-y-1">
            {user.audit_logs?.length > 0 ? (
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[18px] top-6 bottom-6 w-px bg-neutral-200" />
                
                <div className="space-y-1">
                  {user.audit_logs.map((log, idx) => {
                    const actionColor = Object.keys(ACTION_COLORS).find(k => log.action?.includes(k));
                    const actionIcon = Object.keys(ACTION_ICONS).find(k => log.action?.includes(k));
                    const isFirst = idx === 0;
                    
                    return (
                      <div key={log.id} className="relative flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors group">
                        {/* Timeline dot */}
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2 border-white relative z-10 ${
                          actionColor ? ACTION_COLORS[actionColor].replace('text-', 'text-').split(' ')[0] : 'bg-neutral-100'
                        }`}>
                          {actionIcon && ACTION_ICONS[actionIcon] ? (
                            <span className={actionColor ? ACTION_COLORS[actionColor].split(' ')[1] : 'text-neutral-500'}>
                              {ACTION_ICONS[actionIcon]}
                            </span>
                          ) : (
                            <div className={`w-2 h-2 rounded-full ${
                              actionColor ? ACTION_COLORS[actionColor].split(' ')[1]?.replace('text-', 'bg-') : 'bg-neutral-400'
                            }`} />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[actionColor] || 'bg-neutral-100 text-neutral-700'}`}>
                                {log.action}
                              </span>
                              <span className="text-xs text-neutral-500 truncate">
                                {log.entity_type}
                              </span>
                            </div>
                            <span className="text-xs text-neutral-400 flex-shrink-0">
                              {getRelativeTime(log.created_at) || formatDate(log.created_at, true)}
                            </span>
                          </div>
                          {log.details && Object.keys(log.details).length > 0 && (
                            <div className="mt-1.5 text-xs text-neutral-600 bg-neutral-100 rounded-lg p-2.5 font-mono overflow-x-auto max-h-20 overflow-y-auto opacity-0 group-hover:opacity-100 transition-opacity">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-neutral-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-500">No activity recorded</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-neutral-50 rounded-xl shadow-2xl w-[95vw] h-[95vh] md:w-[900px] md:h-[700px] mx-4 overflow-hidden flex flex-col">
        {/* Hero Header with profile */}
        <div className="bg-white border-b border-neutral-200">
          {renderHeroHeader()}
        </div>

        {/* Tabs */}
        <div className="bg-white px-6 border-b border-neutral-200">
          <div className="flex gap-1 -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <span className={activeTab === tab.id ? 'text-emerald-500' : 'text-neutral-400'}>
                  {TAB_ICONS[tab.id]}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-neutral-50">
          {renderTabContent()}
        </div>
      </div>

      {/* Invoice detail modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        invoiceId={selectedInvoiceId}
      />

      {/* Offer detail modal */}
      <OfferModal
        isOpen={!!selectedOfferId}
        onClose={() => setSelectedOfferId(null)}
        offerId={selectedOfferId}
      />

      {/* Specification detail modal */}
      <SpecificationModal
        isOpen={!!selectedSpecId}
        onClose={() => setSelectedSpecId(null)}
        specificationId={selectedSpecId}
      />
    </div>,
    document.body
  );
}

export default UserDetailModal;
