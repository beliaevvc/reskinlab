import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/auditLog';

/**
 * Fetch all users (profiles) - admin only
 */
export function useUsers(filters = {}) {
  const { role, search } = filters;

  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
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

      const { data: users, error } = await profilesQuery;
      
      if (error) throw error;
      if (!users || users.length === 0) return [];

      // Get client info separately
      const userIds = users.map(u => u.id);
      const clientMap = {};
      
      try {
        const { data: clientsData } = await supabase
          .from('clients')
          .select('user_id, id, company_name, contact_phone')
          .in('user_id', userIds);
        
        clientsData?.forEach(c => {
          clientMap[c.user_id] = c;
        });
      } catch (err) {
        console.warn('Failed to fetch clients:', err);
      }

      // Get all projects with client info
      let allProjects = [];
      const projectCounts = {};
      
      try {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, client_id, am_id, client:clients(user_id, company_name)');
        
        if (projectsData) {
          allProjects = projectsData;
          
          allProjects.forEach(p => {
            if (p.client?.user_id) {
              projectCounts[p.client.user_id] = (projectCounts[p.client.user_id] || 0) + 1;
            }
            if (p.am_id) {
              projectCounts[p.am_id] = (projectCounts[p.am_id] || 0) + 1;
            }
          });
        }
      } catch (err) {
        console.warn('Failed to fetch projects:', err);
      }

      // Get all invoices to calculate revenue per user
      const revenueMap = {};
      
      try {
        const { data: allInvoices } = await supabase
          .from('invoices')
          .select('project_id, status, amount_usd, paid_at');
        
        if (allInvoices && allProjects.length > 0) {
          const clientIdToUserId = {};
          Object.values(clientMap).forEach(c => {
            clientIdToUserId[c.id] = c.user_id;
          });

          allInvoices.forEach(invoice => {
            const project = allProjects.find(p => p.id === invoice.project_id);
            if (!project) return;

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
      }

      // Merge data
      return users.map(user => ({
        ...user,
        client: clientMap[user.id] || null,
        projects_count: projectCounts[user.id] || 0,
        total_revenue: revenueMap[user.id] || 0,
      }));
    },
  });
}

/**
 * Fetch single user with full details
 */
export function useUser(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Get all projects with related data
      const { data: allProjects } = await supabase
        .from('projects')
        .select('id, name, status, created_at, client_id, am_id')
        .order('created_at', { ascending: false });
      
      if (allProjects && allProjects.length > 0) {
        const projectIds = allProjects.map(p => p.id);
        
        const { data: specsData } = await supabase
          .from('specifications')
          .select('project_id')
          .in('project_id', projectIds);
        
        const { data: stagesData } = await supabase
          .from('workflow_stages')
          .select('project_id, status, stage_key, name, "order"')
          .in('project_id', projectIds)
          .order('"order"', { ascending: true });
        
        const { data: invoicesData } = await supabase
          .from('invoices')
          .select('project_id, status')
          .in('project_id', projectIds);
        
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
        
        allProjects.forEach(project => {
          project.specifications = [{ count: specsByProject[project.id] || 0 }];
          project.workflow_stages = stagesByProject[project.id] || [];
          project.invoices = invoicesByProject[project.id] || [];
        });
      }

      // Get all clients to map client_id -> user_id
      const { data: allClients } = await supabase
        .from('clients')
        .select('id, user_id, company_name, contact_phone, contact_name, country, address, notes');

      const clientData = allClients?.find(c => c.user_id === userId) || null;

      // Filter projects for this user
      let allUserProjects = [];
      let projects = [];
      
      if (allProjects && allClients) {
        const clientIdToUserId = {};
        allClients.forEach(c => {
          clientIdToUserId[c.id] = c.user_id;
        });

        allUserProjects = allProjects.filter(p => {
          const projectOwnerUserId = clientIdToUserId[p.client_id];
          return projectOwnerUserId === userId || p.am_id === userId;
        });
        
        projects = allUserProjects.slice(0, 10);
      }

      // Get invoices summary
      const allProjectIds = allUserProjects.map(p => p.id);
      let finance = {
        total_revenue: 0,
        paid_invoices: 0,
        pending_revenue: 0,
        pending_invoices: 0,
      };

      let allInvoices = [];
      if (allProjectIds.length > 0) {
        const { data: invoices } = await supabase
          .from('invoices')
          .select(`
            id, number, status, amount_usd, currency, milestone_name,
            due_date, paid_at, created_at, project_id, rejection_reason, offer_id,
            project:projects ( id, name ),
            offer:offers ( id, number, specification:specifications ( id, version, number ) )
          `)
          .in('project_id', allProjectIds)
          .order('created_at', { ascending: false });

        allInvoices = invoices || [];

        if (invoices) {
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

      // Get specifications and their offers for this user's projects
      let allSpecs = [];
      if (allProjectIds.length > 0) {
        const { data: specs } = await supabase
          .from('specifications')
          .select('id, number, version, version_number, status, is_addon, created_at, project_id, totals_json')
          .in('project_id', allProjectIds)
          .order('created_at', { ascending: false });

        allSpecs = specs || [];
        const specIds = allSpecs.map(s => s.id);

        if (specIds.length > 0) {
          const { data: offers } = await supabase
            .from('offers')
            .select(`
              id, number, status, created_at, specification_id,
              invoices ( id, status, amount_usd )
            `)
            .in('specification_id', specIds)
            .order('created_at', { ascending: false });

          // Attach offers to their specs
          const offersBySpec = {};
          (offers || []).forEach(o => {
            if (!offersBySpec[o.specification_id]) offersBySpec[o.specification_id] = [];
            offersBySpec[o.specification_id].push(o);
          });
          allSpecs.forEach(s => {
            s.offers = offersBySpec[s.id] || [];
          });
        }
      }

      // Get recent audit logs
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        ...user,
        client: clientData,
        projects,
        finance,
        invoices: allInvoices,
        specifications: allSpecs,
        audit_logs: auditLogs || [],
      };
    },
    enabled: !!userId,
    staleTime: 0,
    refetchOnMount: 'always',
  });
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
 * Admin: update user profile fields (full_name, phone)
 */
export function useAdminUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, updates }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      try {
        await logAuditEvent({
          action: 'update_profile',
          entity_type: 'profile',
          entity_id: userId,
          details: { changes: updates },
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
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

      return {
        total: data?.length || 0,
        admins: data?.filter(u => u.role === 'admin').length || 0,
        ams: data?.filter(u => u.role === 'am').length || 0,
        clients: data?.filter(u => u.role === 'client').length || 0,
      };
    },
  });
}
