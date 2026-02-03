import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/auditLog';

/**
 * Fetch all users (profiles) - admin only
 */
export function useUsers(filters = {}) {
  const { role, search } = filters;
  
  console.log('🔴 useUsers RENDER:', { filters });

  const query = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      console.log('🔴 useUsers queryFn EXECUTING...');
      // Simple query first - just profiles
      let profilesQuery = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (role && role !== 'all') {
        profilesQuery = profilesQuery.eq('role', role);
      }

      if (search) {
        profilesQuery = profilesQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      console.log('🔴 useUsers: fetching profiles...');
      const { data: users, error } = await profilesQuery;
      console.log('🔴 useUsers: profiles fetched:', { count: users?.length, error: error?.message });
      
      if (error) {
        console.error('useUsers error:', error);
        throw error;
      }

      if (!users || users.length === 0) {
        return [];
      }

      // Get client info separately
      const userIds = users.map(u => u.id);
      let clients = [];
      let clientMap = {};
      try {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('user_id, id, company_name, contact_phone')
          .in('user_id', userIds);
        
        if (!clientsError && clientsData) {
          clients = clientsData;
          clients.forEach(c => {
            clientMap[c.user_id] = c;
          });
        }
      } catch (err) {
        console.warn('Failed to fetch clients:', err);
      }

      // Get all projects with client info (admin can see all via RLS)
      let allProjects = [];
      let projectCounts = {};
      try {
        const { data: projectsData, error: projError } = await supabase
          .from('projects')
          .select('id, client_id, am_id, client:clients(user_id, company_name)');
        
        if (!projError && projectsData) {
          allProjects = projectsData;
          
          // Count projects per user
          allProjects.forEach(p => {
            // Count for client (via clients.user_id)
            if (p.client?.user_id) {
              projectCounts[p.client.user_id] = (projectCounts[p.client.user_id] || 0) + 1;
            }
            // Count for AM
            if (p.am_id) {
              projectCounts[p.am_id] = (projectCounts[p.am_id] || 0) + 1;
            }
          });
        }
      } catch (err) {
        console.warn('Failed to fetch projects:', err);
        // Continue without project counts - users should still be returned
      }

      // Get all invoices to calculate revenue per user (with error handling)
      let revenueMap = {};
      try {
        const { data: allInvoices, error: invoicesError } = await supabase
          .from('invoices')
          .select('project_id, status, amount_usd, paid_at');
        
        if (!invoicesError && allInvoices && allInvoices.length > 0 && allProjects && allProjects.length > 0 && clients && clients.length > 0) {
          const clientIdToUserId = {};
          clients.forEach(c => {
            clientIdToUserId[c.id] = c.user_id;
          });

          allInvoices.forEach(invoice => {
            const project = allProjects.find(p => p.id === invoice.project_id);
            if (!project) return;

            // Count all invoices with status 'paid' (paid_at is optional)
            if (invoice.status === 'paid') {
              const projectOwnerUserId = clientIdToUserId[project.client_id];
              if (projectOwnerUserId) {
                revenueMap[projectOwnerUserId] = (revenueMap[projectOwnerUserId] || 0) + parseFloat(invoice.amount_usd || 0);
              }
            }
          });
        }
      } catch (err) {
        console.warn('Failed to fetch invoices for revenue calculation:', err);
        // Continue without revenue data - users should still be returned
      }

      // Merge data
      const usersWithClients = users.map(user => {
        const clientData = clientMap[user.id];
        
        return {
          ...user,
          client: clientData || null,
          projects_count: projectCounts[user.id] || 0,
          total_revenue: revenueMap[user.id] || 0,
        };
      });

      console.log('📊 useUsers returning:', { 
        usersCount: usersWithClients.length, 
        projectsCount: Object.keys(projectCounts).length,
        revenueCount: Object.keys(revenueMap).length 
      });

      return usersWithClients;
    },
  });
  
  console.log('🔴 useUsers QUERY STATE:', {
    status: query.status,
    fetchStatus: query.fetchStatus,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    dataLength: query.data?.length
  });
  
  return query;
}

/**
 * Fetch single user with full details
 */
export function useUser(userId) {
  console.log('🟡 useUser RENDER:', { userId });
  
  const query = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      console.log('🟡 useUser queryFn EXECUTING for:', userId);
      
      console.log('🟡 useUser: fetching profile...');
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      console.log('🟡 useUser: profile fetched:', { hasUser: !!user, error: error?.message });

      if (error) throw error;

      // Get all projects with related data (admin can see all via RLS)
      // First get projects
      const { data: allProjects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, created_at, client_id, am_id')
        .order('created_at', { ascending: false });
      
      if (projectsError) {
        console.warn('Failed to fetch projects:', projectsError);
      }
      
      // Then enrich projects with related data
      if (allProjects && allProjects.length > 0) {
        const projectIds = allProjects.map(p => p.id);
        
        // Get specifications count for each project
        const { data: specsData } = await supabase
          .from('specifications')
          .select('project_id')
          .in('project_id', projectIds);
        
        // Get workflow stages
        const { data: stagesData } = await supabase
          .from('workflow_stages')
          .select('project_id, status, stage_key, name, "order"')
          .in('project_id', projectIds)
          .order('"order"', { ascending: true });
        
        // Get invoices
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('project_id, status')
          .in('project_id', projectIds);
        
        // Group data by project_id
        const specsByProject = {};
        specsData?.forEach(spec => {
          specsByProject[spec.project_id] = (specsByProject[spec.project_id] || 0) + 1;
        });
        
        const stagesByProject = {};
        stagesData?.forEach(stage => {
          if (!stagesByProject[stage.project_id]) {
            stagesByProject[stage.project_id] = [];
          }
          stagesByProject[stage.project_id].push(stage);
        });
        
        const invoicesByProject = {};
        invoicesData?.forEach(invoice => {
          if (!invoicesByProject[invoice.project_id]) {
            invoicesByProject[invoice.project_id] = [];
          }
          invoicesByProject[invoice.project_id].push(invoice);
        });
        
        // Enrich projects with related data
        allProjects.forEach(project => {
          project.specifications = [{ count: specsByProject[project.id] || 0 }];
          project.workflow_stages = stagesByProject[project.id] || [];
          project.invoices = invoicesByProject[project.id] || [];
        });
      }
      
      console.log('📊 useUser - allProjects enriched:', { count: allProjects?.length, sample: allProjects?.[0] });

      // Get all clients to map client_id -> user_id
      const { data: allClients } = await supabase
        .from('clients')
        .select('id, user_id, company_name, contact_phone');

      // Find this user's client record
      const clientData = allClients?.find(c => c.user_id === userId) || null;

      // Filter projects for this user
      let allUserProjects = [];
      let projects = []; // For display (limited to 10)
      if (allProjects && allClients) {
        const clientIdToUserId = {};
        allClients.forEach(c => {
          clientIdToUserId[c.id] = c.user_id;
        });

        // Get ALL projects for this user (for finance calculation)
        allUserProjects = allProjects.filter(p => {
          const projectOwnerUserId = clientIdToUserId[p.client_id];
          return projectOwnerUserId === userId || p.am_id === userId;
        });
        
        // Get first 10 projects for display
        projects = allUserProjects.slice(0, 10);
      }
      
      console.log('📊 User projects:', { 
        userId, 
        clientData, 
        projectsCount: allUserProjects.length, 
        displayedProjects: projects.length,
        sampleProject: projects[0] 
      });

      // Get invoices summary - use ALL projects for accurate finance calculation
      const allProjectIds = allUserProjects.map(p => p.id);
      let finance = {
        total_revenue: 0,
        paid_invoices: 0,
        pending_revenue: 0,
        pending_invoices: 0,
      };

      if (allProjectIds.length > 0) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select('status, amount_usd, paid_at')
          .in('project_id', allProjectIds);

        if (invoices) {
          // Count all invoices with status 'paid' (paid_at is optional)
          const paidInvoices = invoices.filter(i => i.status === 'paid');
          const pendingInvoices = invoices.filter(i => i.status === 'pending');
          finance = {
            total_revenue: paidInvoices.reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0),
            paid_invoices: paidInvoices.length,
            pending_revenue: pendingInvoices.reduce((sum, i) => sum + parseFloat(i.amount_usd || 0), 0),
            pending_invoices: pendingInvoices.length,
          };
        }
      }

      // Get recent audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      console.log('🟡 useUser: returning data for', userId);
      return {
        ...user,
        client: clientData,
        projects: projects,
        finance,
        audit_logs: auditLogs || [],
      };
    },
    enabled: !!userId,
    staleTime: 0, // Always consider stale
    refetchOnMount: 'always', // Always refetch when component mounts
  });
  
  console.log('🟡 useUser QUERY STATE:', {
    status: query.status,
    fetchStatus: query.fetchStatus,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    hasData: !!query.data
  });
  
  return query;
}

/**
 * Update user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role, oldRole }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      try {
        await logAuditEvent({
          action: 'update_role',
          entity_type: 'profile',
          entity_id: userId,
          details: {
            changes: {
              role: { from: oldRole, to: role }
            }
          }
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });
}

/**
 * Bulk update user roles
 */
export function useBulkUpdateRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userIds, role }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .in('id', userIds)
        .select();

      if (error) throw error;

      // Log audit event
      try {
        await logAuditEvent({
          action: 'bulk_update_role',
          entity_type: 'profiles',
          details: {
            user_ids: userIds,
            new_role: role,
            count: userIds.length
          }
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
    },
  });
}

/**
 * Fetch list of AMs (for assignment dropdown)
 */
export function useAMList() {
  return useQuery({
    queryKey: ['am-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('role', ['am', 'admin'])
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Assign AM to project
 */
export function useAssignAM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, amId }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ am_id: amId })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;

      try {
        await logAuditEvent({
          action: 'assign_am',
          entity_type: 'project',
          entity_id: projectId,
          details: { am_id: amId }
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * User stats for admin dashboard
 */
export function useUserStats() {
  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role');

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        admins: data?.filter(u => u.role === 'admin').length || 0,
        ams: data?.filter(u => u.role === 'am').length || 0,
        clients: data?.filter(u => u.role === 'client').length || 0,
      };

      return stats;
    },
  });
}
