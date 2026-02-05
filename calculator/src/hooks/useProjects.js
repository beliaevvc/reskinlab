import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logProjectEvent } from '../lib/auditLog';

/**
 * Fetch all projects for the current client with counts
 * RLS handles filtering by client ownership
 */
export function useProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects', user?.id],
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          specifications:specifications(count),
          invoices:invoices(count),
          tasks:tasks(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data?.length > 0) {
        const projectIds = data.map(p => p.id);
        
        // Get offers count grouped by project
        const { data: offersData } = await supabase
          .from('specifications')
          .select(`
            project_id,
            offers:offers(count)
          `)
          .in('project_id', projectIds);
        
        // Aggregate offers by project
        const offersByProject = {};
        offersData?.forEach(spec => {
          const count = spec.offers?.[0]?.count || 0;
          offersByProject[spec.project_id] = (offersByProject[spec.project_id] || 0) + count;
        });
        
        // Add offers count to projects
        data.forEach(project => {
          project.offersCount = offersByProject[project.id] || 0;
        });
      }
      
      return data;
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch ALL projects with client info and counts (for admin/AM)
 */
export function useAllProjects() {
  return useQuery({
    queryKey: ['projects', 'all'],
    staleTime: 30 * 1000, // 30 seconds
    refetchOnMount: true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          specifications:specifications(count),
          invoices:invoices(count),
          tasks:tasks(count),
          client:clients(
            id,
            company_name,
            profile:profiles(id, full_name, email)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data?.length > 0) {
        const projectIds = data.map(p => p.id);
        
        // Get offers count grouped by project
        const { data: offersData } = await supabase
          .from('specifications')
          .select(`
            project_id,
            offers:offers(count)
          `)
          .in('project_id', projectIds);
        
        // Aggregate offers by project
        const offersByProject = {};
        offersData?.forEach(spec => {
          const count = spec.offers?.[0]?.count || 0;
          offersByProject[spec.project_id] = (offersByProject[spec.project_id] || 0) + count;
        });
        
        // Add offers count to projects
        data.forEach(project => {
          project.offersCount = offersByProject[project.id] || 0;
        });
      }
      
      return data;
    },
  });
}

/**
 * Delete a project (admin only)
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId) => {
      // Helper to safely delete (ignore errors for non-existent tables/records)
      const safeDelete = async (table, column, value) => {
        try {
          await supabase.from(table).delete().eq(column, value);
        } catch (e) {
          console.warn(`Could not delete from ${table}:`, e);
        }
      };

      const safeDeleteIn = async (table, column, values) => {
        if (!values?.length) return;
        try {
          await supabase.from(table).delete().in(column, values);
        } catch (e) {
          console.warn(`Could not delete from ${table}:`, e);
        }
      };

      // 1. Get specifications to find offers
      const { data: specs } = await supabase
        .from('specifications')
        .select('id')
        .eq('project_id', projectId);
      
      const specIds = specs?.map(s => s.id) || [];
      
      // 2. Delete invoices first (they reference offers)
      await safeDelete('invoices', 'project_id', projectId);
      
      // 3. Delete offer_acceptance_logs (they reference offers)
      if (specIds.length) {
        const { data: offers } = await supabase
          .from('offers')
          .select('id')
          .in('specification_id', specIds);
        
        if (offers?.length) {
          const offerIds = offers.map(o => o.id);
          await safeDeleteIn('offer_acceptance_logs', 'offer_id', offerIds);
        }
        
        // 4. Delete offers
        await safeDeleteIn('offers', 'specification_id', specIds);
      }
      
      // 5. Delete specifications
      await safeDelete('specifications', 'project_id', projectId);
      
      // 6. Delete approvals (may not exist)
      await safeDelete('approvals', 'project_id', projectId);
      
      // 7. Delete tasks first (they reference workflow_stages)
      await safeDelete('tasks', 'project_id', projectId);
      
      // 8. Delete workflow_stages (they reference projects)
      await safeDelete('workflow_stages', 'project_id', projectId);
      
      // 9. Delete project files
      await safeDelete('project_files', 'project_id', projectId);
      
      // 10. Finally delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['stages'] });
    },
  });
}

/**
 * Fetch a single project with its specifications and offers
 */
export function useProject(projectId) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: async () => {
      // 1. Fetch project with specifications
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          specifications (
            id,
            version,
            version_number,
            status,
            is_addon,
            totals_json,
            created_at,
            updated_at,
            finalized_at
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (!data) return null;

      // 2. Fetch offers for all specifications
      if (data?.specifications?.length > 0) {
        const specIds = data.specifications.map(s => s.id);
        
        try {
          const { data: offers, error: offersError } = await supabase
            .from('offers')
            .select('id, number, status, valid_until, specification_id')
            .in('specification_id', specIds);

          const offersBySpecId = {};
          if (!offersError && offers && offers.length > 0) {
            offers.forEach(offer => {
              offersBySpecId[offer.specification_id] = offer;
            });

            // 3. Fetch invoices for all offers
            const offerIds = offers.map(o => o.id);
            if (offerIds.length > 0) {
              try {
                const { data: invoices, error: invoicesError } = await supabase
                  .from('invoices')
                  .select('id, number, amount_usd, currency, status, milestone_name, milestone_order, offer_id')
                  .in('offer_id', offerIds)
                  .order('milestone_order', { ascending: true });

                if (!invoicesError && invoices && invoices.length > 0) {
                  const invoicesByOfferId = {};
                  invoices.forEach(invoice => {
                    if (!invoicesByOfferId[invoice.offer_id]) {
                      invoicesByOfferId[invoice.offer_id] = [];
                    }
                    invoicesByOfferId[invoice.offer_id].push(invoice);
                  });

                  offers.forEach(offer => {
                    offer.invoices = invoicesByOfferId[offer.id] || [];
                  });
                }
              } catch (invoiceErr) {
                console.warn('Failed to load invoices:', invoiceErr);
              }
            }
          }

          data.specifications = data.specifications.map(spec => ({
            ...spec,
            offer: offersBySpecId[spec.id] || null,
          }));

          data.specifications.sort((a, b) => (b.version_number || 0) - (a.version_number || 0));
        } catch (offersErr) {
          console.warn('Failed to load offers:', offersErr);
        }
      }

      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { client, user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description }) => {
      let clientId = client?.id;

      if (!clientId && user?.id) {
        // Try to fetch client record
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (clientError) {
          // Client doesn't exist, try to create one
          const { data: newClient, error: createError } = await supabase
            .from('clients')
            .insert({ user_id: user.id })
            .select('id')
            .single();

          if (createError) {
            throw new Error('Failed to create client record. Please try again.');
          }
          clientId = newClient.id;
        } else {
          clientId = clientData.id;
        }
      }

      if (!clientId) {
        throw new Error('Please log in to create a project.');
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          client_id: clientId,
          name,
          description,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit event
      try {
        await logProjectEvent('create_project', data.id, {
          name: data.name,
          status: data.status,
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, updates }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.id] });
    },
  });
}

/**
 * Get projects for dropdown/selector
 */
export function useProjectsForSelector() {
  const { client } = useAuth();

  return useQuery({
    queryKey: ['projects', 'selector'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!client,
    staleTime: 1000 * 60, // 1 minute
  });
}

/**
 * Complete a project (admin and AM only)
 */
export function useCompleteProject() {
  const queryClient = useQueryClient();
  const { isAdmin, isAM } = useAuth();

  return useMutation({
    mutationFn: async (projectId) => {
      if (!isAdmin && !isAM) {
        throw new Error('Only admins and AMs can complete projects');
      }

      const { error } = await supabase.rpc('complete_project', {
        project_uuid: projectId,
      });

      if (error) throw error;

      try {
        await logProjectEvent('complete_project', projectId, {
          status: 'completed',
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

/**
 * Archive a project (admin and AM only)
 */
export function useArchiveProject() {
  const queryClient = useQueryClient();
  const { isAdmin, isAM } = useAuth();

  return useMutation({
    mutationFn: async (projectId) => {
      if (!isAdmin && !isAM) {
        throw new Error('Only admins and AMs can archive projects');
      }

      const { error } = await supabase.rpc('archive_project', {
        project_uuid: projectId,
      });

      if (error) throw error;

      try {
        await logProjectEvent('archive_project', projectId, {
          status: 'archived',
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}
