import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logSpecificationEvent, fetchProjectName } from '../lib/auditLog';
import { generateSpecNumber } from '../lib/specUtils';

/**
 * Fetch specifications for a project
 */
export function useSpecifications(projectId) {
  return useQuery({
    queryKey: ['specifications', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specifications')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch a single specification with full details
 */
export function useSpecification(specId) {
  return useQuery({
    queryKey: ['specifications', 'detail', specId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specifications')
        .select(
          `
          *,
          project:projects (
            id,
            name,
            status,
            client_id,
            client:clients (
              id,
              company_name,
              contact_name,
              contact_phone,
              user:profiles!user_id (
                id,
                email,
                full_name
              )
            )
          )
        `
        )
        .eq('id', specId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!specId,
  });
}

/**
 * Helper: Get next version number for a project
 */
async function getNextVersionNumber(projectId) {
  const { data } = await supabase
    .from('specifications')
    .select('version_number')
    .eq('project_id', projectId)
    .eq('is_addon', false)
    .order('version_number', { ascending: false })
    .limit(1);

  return (data?.[0]?.version_number || 0) + 1;
}

/**
 * Save or update a specification (draft only)
 */
export function useSaveSpecification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ specId, projectId, stateJson, totalsJson }) => {
      if (specId) {
        // Update existing draft
        const { data, error } = await supabase
          .from('specifications')
          .update({
            state_json: stateJson,
            totals_json: totalsJson,
          })
          .eq('id', specId)
          .eq('status', 'draft') // Only drafts can be updated
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new specification
        const versionNumber = await getNextVersionNumber(projectId);
        const specNumber = await generateSpecNumber();

        const { data, error } = await supabase
          .from('specifications')
          .insert({
            project_id: projectId,
            number: specNumber,
            version: `v${versionNumber}.0`,
            version_number: versionNumber,
            is_addon: false,
            status: 'draft',
            state_json: stateJson,
            totals_json: totalsJson,
          })
          .select()
          .single();

        if (error) throw error;

        // Fetch project name for audit log context
        const project_name = await fetchProjectName(projectId);

        // Log audit event for new specification
        try {
          await logSpecificationEvent('create_specification', data.id, {
            project_id: projectId,
            project_name,
            version: data.version,
            total: totalsJson?.grandTotal,
          });
        } catch (e) {
          console.warn('Failed to log audit event:', e);
        }

        return { ...data, _project_name: project_name };
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['specifications', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['specifications', 'detail', data.id] });
      queryClient.invalidateQueries({ queryKey: ['projects', data.project_id] });
      logSpecificationEvent('save_specification', data.id, { project_id: data.project_id, project_name: data._project_name, version: data.version });
    },
  });
}

/**
 * Finalize a specification (lock from editing)
 */
export function useFinalizeSpecification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (specId) => {
      // First check if spec exists and is draft
      const { data: existingSpec, error: checkError } = await supabase
        .from('specifications')
        .select('id, status, project_id')
        .eq('id', specId)
        .single();

      if (checkError) throw checkError;
      
      if (existingSpec.status === 'finalized') {
        // Already finalized, just return it
        return existingSpec;
      }

      if (existingSpec.status !== 'draft') {
        throw new Error('Specification is not in draft status');
      }

      // Perform the update
      const { data, error } = await supabase
        .from('specifications')
        .update({
          status: 'finalized',
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
        })
        .eq('id', specId)
        .select()
        .maybeSingle();

      if (error) throw error;
      
      // Fetch project name for context
      const project_name = await fetchProjectName(existingSpec.project_id);

      // If update returned nothing, refetch the spec
      if (!data) {
        const { data: refetched } = await supabase
          .from('specifications')
          .select('*')
          .eq('id', specId)
          .single();
        
        // Log audit event
        try {
          await logSpecificationEvent('finalize_specification', specId, {
            version: refetched?.version,
            project_id: existingSpec.project_id,
            project_name,
          });
        } catch (e) {
          console.warn('Failed to log audit event:', e);
        }
        
        return { ...refetched, _project_name: project_name };
      }

      // Log audit event
      try {
        await logSpecificationEvent('finalize_specification', data.id, {
          version: data.version,
          project_id: data.project_id,
          project_name,
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }
      
      return { ...data, _project_name: project_name };
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['specifications', data.project_id] });
        queryClient.invalidateQueries({ queryKey: ['specifications', 'detail', data.id] });
        queryClient.invalidateQueries({ queryKey: ['projects', data.project_id] });
        logSpecificationEvent('finalize_specification', data.id, { version: data.version, project_name: data._project_name });
      }
    },
  });
}

/**
 * Delete a draft specification
 */
export function useDeleteSpecification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ specId, projectId }) => {
      // Fetch spec version before deletion for audit log
      const { data: specData } = await supabase
        .from('specifications')
        .select('version')
        .eq('id', specId)
        .single();
      const project_name = await fetchProjectName(projectId);

      const { error } = await supabase
        .from('specifications')
        .delete()
        .eq('id', specId)
        .eq('status', 'draft'); // Only drafts can be deleted

      if (error) throw error;
      return { specId, projectId, version: specData?.version, project_name };
    },
    onSuccess: ({ specId, projectId, version, project_name }) => {
      queryClient.invalidateQueries({ queryKey: ['specifications', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      logSpecificationEvent('delete_specification', specId, { project_id: projectId, project_name, version });
    },
  });
}

/**
 * Admin: Delete any specification (including finalized with offers)
 */
export function useAdminDeleteSpecification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ specId, projectId }) => {
      // Fetch spec version before deletion for audit log
      const { data: specData } = await supabase
        .from('specifications')
        .select('version')
        .eq('id', specId)
        .single();
      const project_name = await fetchProjectName(projectId);

      // 1. Get related offers first
      const { data: offers } = await supabase
        .from('offers')
        .select('id')
        .eq('specification_id', specId);

      const offerIds = offers?.map(o => o.id) || [];

      if (offerIds.length > 0) {
        // 2. Delete invoices for these offers
        const { error: invoicesError } = await supabase
          .from('invoices')
          .delete()
          .in('offer_id', offerIds);

        if (invoicesError) {
          console.error('Failed to delete invoices:', invoicesError);
          throw invoicesError;
        }

        // 3. Delete offer_acceptance_logs for these offers
        const { error: logsError } = await supabase
          .from('offer_acceptance_logs')
          .delete()
          .in('offer_id', offerIds);

        if (logsError) {
          console.error('Failed to delete acceptance logs:', logsError);
          throw logsError;
        }

        // 4. Delete offers
        const { error: offersError } = await supabase
          .from('offers')
          .delete()
          .eq('specification_id', specId);

        if (offersError) {
          console.error('Failed to delete offers:', offersError);
          throw offersError;
        }
      }

      // 5. Delete the specification
      const { error } = await supabase
        .from('specifications')
        .delete()
        .eq('id', specId);

      if (error) throw error;
      return { specId, projectId, version: specData?.version, project_name };
    },
    onSuccess: ({ specId, projectId, version, project_name }) => {
      queryClient.invalidateQueries({ queryKey: ['specifications'] });
      queryClient.invalidateQueries({ queryKey: ['specification'] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      logSpecificationEvent('admin_delete_specification', specId, { project_id: projectId, project_name, version });
    },
  });
}

/**
 * Admin: Get all specifications with project and client info
 */
export function useAllSpecifications() {
  return useQuery({
    queryKey: ['specifications', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specifications')
        .select(`
          *,
          project:projects (
            id,
            name,
            status,
            client:clients (
              id,
              company_name,
              profile:profiles!user_id (
                id,
                email,
                full_name
              )
            )
          ),
          offer:offers (
            id,
            status,
            number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * AM: Get specifications for projects assigned to current AM
 */
export function useAMSpecifications(userId) {
  return useQuery({
    queryKey: ['specifications', 'am', userId],
    queryFn: async () => {
      // First get projects assigned to this AM
      const { data: amProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('am_id', userId);

      if (!amProjects || amProjects.length === 0) {
        return [];
      }

      const projectIds = amProjects.map(p => p.id);

      // Then get specifications for those projects
      const { data, error } = await supabase
        .from('specifications')
        .select(`
          *,
          project:projects (
            id,
            name,
            status,
            client:clients (
              id,
              company_name,
              profile:profiles!user_id (
                id,
                email,
                full_name
              )
            )
          ),
          offer:offers (
            id,
            status,
            number
          )
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

/**
 * Get the latest draft specification for a project (if any)
 */
export function useLatestDraftSpecification(projectId) {
  return useQuery({
    queryKey: ['specifications', projectId, 'latest-draft'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('specifications')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}
