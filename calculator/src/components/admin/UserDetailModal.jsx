import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useUser } from '../../hooks/useUsers';
import { useDeleteProject } from '../../hooks/useProjects';
import { formatDate, formatCurrency, formatDateTime } from '../../lib/utils';

const ROLE_BADGES = {
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  am: { label: 'Account Manager', color: 'bg-blue-100 text-blue-700' },
  client: { label: 'Client', color: 'bg-emerald-100 text-emerald-700' },
};

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'company', label: 'Company' },
  { id: 'projects', label: 'Projects' },
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

const PROJECT_STATUS_COLORS = {
  draft: 'bg-neutral-100 text-neutral-600',
  in_progress: 'bg-blue-100 text-blue-700',
  review: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

export function UserDetailModal({ userId, isOpen, onClose, initialTab = 'profile' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { data: user, isLoading, refetch } = useUser(userId);
  const deleteProject = useDeleteProject();

  // Debug: log project data when it changes
  useEffect(() => {
    if (user?.projects) {
      console.log('📊 UserDetailModal - projects data:', user.projects);
      user.projects.forEach((p, idx) => {
        console.log(`Project ${idx}:`, {
          name: p.name,
          specifications: p.specifications,
          workflow_stages: p.workflow_stages,
          invoices: p.invoices
        });
      });
    }
  }, [user?.projects]);

  // Update active tab when initialTab or userId changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, userId, isOpen]);

  // Debug: log project data when it changes
  useEffect(() => {
    if (user?.projects && user.projects.length > 0) {
      console.log('📊 UserDetailModal - projects data:', user.projects);
      user.projects.forEach((p, idx) => {
        console.log(`Project ${idx} (${p.name}):`, {
          specifications: p.specifications,
          workflow_stages: p.workflow_stages,
          invoices: p.invoices
        });
      });
    }
  }, [user?.projects]);

  const handleDeleteProject = async (projectId) => {
    try {
      await deleteProject.mutateAsync(projectId);
      setDeleteConfirm(null);
      refetch(); // Refresh user data to update projects list
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  if (!isOpen) return null;

  const roleBadge = ROLE_BADGES[user?.role] || ROLE_BADGES.client;

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
          <div className="space-y-6">
            {/* Avatar and basic info */}
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <span className="text-2xl font-medium text-neutral-600">
                    {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">{user.full_name || 'No name'}</h3>
                <p className="text-neutral-500">{user.email}</p>
                <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-medium ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-50 rounded p-4">
                <p className="text-sm text-neutral-500">Joined</p>
                <p className="text-neutral-900 font-medium">{formatDate(user.created_at)}</p>
              </div>
              <div className="bg-neutral-50 rounded p-4">
                <p className="text-sm text-neutral-500">Last Login</p>
                <p className="text-neutral-900 font-medium">{user.last_login_at ? formatDateTime(user.last_login_at) : '—'}</p>
              </div>
              <div className="bg-neutral-50 rounded p-4">
                <p className="text-sm text-neutral-500">User ID</p>
                <p className="text-neutral-900 font-mono text-sm">{user.id}</p>
              </div>
              <div className="bg-neutral-50 rounded p-4">
                <p className="text-sm text-neutral-500">Status</p>
                <p className="text-emerald-600 font-medium">Active</p>
              </div>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-4">
            {user.client ? (
              <>
                <div className="bg-neutral-50 rounded p-4">
                  <p className="text-sm text-neutral-500">Company Name</p>
                  <p className="text-lg font-semibold text-neutral-900">{user.client.company_name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 rounded p-4">
                    <p className="text-sm text-neutral-500">Contact Email</p>
                  <p className="text-neutral-900">{user.email}</p>
                  </div>
                  <div className="bg-neutral-50 rounded p-4">
                    <p className="text-sm text-neutral-500">Contact Phone</p>
                    <p className="text-neutral-900">{user.client.contact_phone || '—'}</p>
                  </div>
                  <div className="bg-neutral-50 rounded p-4">
                    <p className="text-sm text-neutral-500">Address</p>
                    <p className="text-neutral-900">{user.client.address || '—'}</p>
                  </div>
                  <div className="bg-neutral-50 rounded p-4">
                    <p className="text-sm text-neutral-500">Country</p>
                    <p className="text-neutral-900">{user.client.country || '—'}</p>
                  </div>
                </div>
                {user.client.notes && (
                  <div className="bg-neutral-50 rounded p-4">
                    <p className="text-sm text-neutral-500 mb-1">Notes</p>
                    <p className="text-neutral-700 text-sm">{user.client.notes}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-neutral-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p>No company linked to this user</p>
              </div>
            )}
          </div>
        );

      case 'projects':
        return (
          <div className="space-y-3">
            {user.projects?.length > 0 ? (
              user.projects.map(project => {
                // Get specifications count - Supabase returns {count: number} for count queries
                const specCount = project.specifications?.[0]?.count || 
                                (Array.isArray(project.specifications) ? project.specifications.length : 0);
                
                // Get invoice stats
                const invoices = project.invoices || [];
                const paidInvoices = invoices.filter(i => i.status === 'paid').length;
                const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
                const invoiceCount = invoices.length;
                
                // Get current active stage (first in_progress or first pending)
                // Sort stages by order to get proper sequence
                const workflowStages = (project.workflow_stages || []).sort((a, b) => (a.order || 0) - (b.order || 0));
                const activeStage = workflowStages.find(s => s.status === 'in_progress') || 
                                  workflowStages.find(s => s.status === 'review') ||
                                  workflowStages.find(s => s.status === 'pending');
                const completedStages = workflowStages.filter(s => s.status === 'completed' || s.status === 'approved').length;
                const totalStages = workflowStages.length;
                
                return (
                  <div key={project.id} className="bg-neutral-50 rounded-lg p-4 hover:bg-neutral-100 transition-colors group border border-neutral-200">
                    <div className="flex items-start justify-between gap-4">
                      <Link 
                        to={`/admin/projects/${project.id}`}
                        onClick={onClose}
                        className="flex-1 min-w-0"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 hover:text-emerald-600 transition-colors mb-1">
                              {project.name}
                            </p>
                            <p className="text-xs text-neutral-500 mb-2">Created {formatDate(project.created_at)}</p>
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              {/* Specifications */}
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                  <p className="text-xs text-neutral-500">Specifications</p>
                                  <p className="text-sm font-medium text-neutral-900">{specCount}</p>
                                </div>
                              </div>
                              
                              {/* Invoices */}
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                  <p className="text-xs text-neutral-500">Invoices</p>
                                  <p className="text-sm font-medium text-neutral-900">
                                    {paidInvoices > 0 && <span className="text-emerald-600">{paidInvoices} paid</span>}
                                    {paidInvoices > 0 && pendingInvoices > 0 && <span className="text-neutral-400"> / </span>}
                                    {pendingInvoices > 0 && <span className="text-amber-600">{pendingInvoices} pending</span>}
                                    {paidInvoices === 0 && pendingInvoices === 0 && <span>0</span>}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Workflow Progress */}
                              {totalStages > 0 && (
                                <div className="flex items-center gap-2 col-span-2">
                                  <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-xs text-neutral-500 mb-1">Workflow Progress</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-emerald-500 transition-all"
                                          style={{ width: `${(completedStages / totalStages) * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-xs font-medium text-neutral-700">
                                        {completedStages}/{totalStages}
                                      </span>
                                    </div>
                                    {activeStage && (
                                      <p className="text-xs text-neutral-600 mt-1">
                                        Current: <span className="font-medium">{activeStage.stage_key || activeStage.name}</span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
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
                          className="p-1.5 rounded text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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
              <div className="py-8 text-center text-neutral-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <p>No projects found</p>
              </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirm && (
              <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
                <div className="relative bg-white rounded-md max-w-sm w-full p-5 shadow-lg">
                  <h3 className="text-base font-medium text-neutral-900 mb-2">Delete project?</h3>
                  <p className="text-sm text-neutral-500 mb-4">
                    <strong className="text-neutral-700">{deleteConfirm.name}</strong> and all its data will be permanently deleted.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteProject(deleteConfirm.id)}
                      disabled={deleteProject.isPending}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded disabled:opacity-50"
                    >
                      {deleteProject.isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'finance':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 rounded p-4">
                <p className="text-sm text-emerald-600">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(user.finance?.total_revenue || 0)}</p>
                <p className="text-sm text-emerald-600 mt-1">{user.finance?.paid_invoices || 0} paid invoices</p>
              </div>
              <div className="bg-amber-50 rounded p-4">
                <p className="text-sm text-amber-600">Pending Revenue</p>
                <p className="text-2xl font-bold text-amber-700">{formatCurrency(user.finance?.pending_revenue || 0)}</p>
                <p className="text-sm text-amber-600 mt-1">{user.finance?.pending_invoices || 0} pending invoices</p>
              </div>
            </div>
            
            <div className="bg-neutral-50 rounded p-4">
              <p className="text-sm text-neutral-500 mb-2">Total Lifetime Value</p>
              <p className="text-3xl font-bold text-neutral-900">
                {formatCurrency((user.finance?.total_revenue || 0) + (user.finance?.pending_revenue || 0))}
              </p>
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-3">
            {user.audit_logs?.length > 0 ? (
              user.audit_logs.map(log => {
                const actionColor = Object.keys(ACTION_COLORS).find(k => log.action?.includes(k));
                return (
                  <div key={log.id} className="bg-neutral-50 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[actionColor] || 'bg-neutral-100 text-neutral-700'}`}>
                          {log.action}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {log.entity_type}
                        </span>
                      </div>
                      <span className="text-sm text-neutral-400">
                        {formatDate(log.created_at, true)}
                      </span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 text-sm text-neutral-600 bg-neutral-100 rounded p-2">
                        <code className="text-xs">{JSON.stringify(log.details, null, 2)}</code>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-neutral-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No activity recorded</p>
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
      
      <div className="relative bg-white rounded shadow-2xl w-[95vw] h-[95vh] md:w-[900px] md:h-[700px] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">User Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-neutral-200">
          <div className="flex gap-1 -mb-px">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {renderTabContent()}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default UserDetailModal;
