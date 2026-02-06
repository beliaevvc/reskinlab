import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logApprovalEvent } from '../lib/auditLog';

/**
 * Fetch all approvals for a project
 */
export function useApprovals(projectId) {
  return useQuery({
    queryKey: ['approvals', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          stage:workflow_stages (
            id,
            name,
            stage_key
          ),
          requested_by_profile:profiles!approvals_requested_by_fkey (
            id,
            full_name
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch pending approvals for a project
 */
export function usePendingApprovals(projectId) {
  return useQuery({
    queryKey: ['approvals', projectId, 'pending'],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          stage:workflow_stages (
            id,
            name,
            stage_key
          )
        `)
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch all pending approvals for the current client (across all projects)
 */
export function useAllPendingApprovals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['approvals', 'all-pending', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // RLS will filter by client ownership
      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          stage:workflow_stages (
            id,
            name
          ),
          project:projects (
            id,
            name
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });
}

/**
 * Fetch a single approval with details
 */
export function useApproval(approvalId) {
  return useQuery({
    queryKey: ['approval', approvalId],
    queryFn: async () => {
      if (!approvalId) return null;

      const { data, error } = await supabase
        .from('approvals')
        .select(`
          *,
          stage:workflow_stages (
            id,
            name,
            stage_key
          ),
          project:projects (
            id,
            name
          ),
          requested_by_profile:profiles!approvals_requested_by_fkey (
            id,
            full_name
          )
        `)
        .eq('id', approvalId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!approvalId,
  });
}

/**
 * Respond to an approval request (client action)
 */
export function useRespondToApproval() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ approvalId, response, comment }) => {
      // response: 'approved', 'needs_revision', 'rejected'
      
      // First get the current approval to check revision rounds
      const { data: currentApproval, error: fetchError } = await supabase
        .from('approvals')
        .select('*')
        .eq('id', approvalId)
        .single();

      if (fetchError) throw fetchError;

      const updates = {
        status: response,
        responded_by: user.id,
        responded_at: new Date().toISOString(),
        client_comment: comment || null,
      };

      // Increment revision round if needs_revision
      if (response === 'needs_revision') {
        updates.revision_round = (currentApproval.revision_round || 1) + 1;
      }

      const { data, error } = await supabase
        .from('approvals')
        .update(updates)
        .eq('id', approvalId)
        .select()
        .single();

      if (error) throw error;

      // If approved and it's a stage approval, update stage status
      if (response === 'approved' && currentApproval.stage_id) {
        await supabase
          .from('workflow_stages')
          .update({
            status: 'approved',
            completed_at: new Date().toISOString(),
          })
          .eq('id', currentApproval.stage_id);
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['approval', data.id] });
      queryClient.invalidateQueries({ queryKey: ['approvals', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['approvals', 'all-pending'] });
      if (data.stage_id) {
        queryClient.invalidateQueries({ queryKey: ['stages', data.project_id] });
      }
      logApprovalEvent('respond_to_approval', data.id, { status: data.status, project_id: data.project_id });
    },
  });
}

/**
 * Get approval status info for display
 */
export function getApprovalStatusInfo(status) {
  switch (status) {
    case 'approved':
      return {
        label: 'Approved',
        color: 'emerald',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-800',
      };
    case 'rejected':
      return {
        label: 'Rejected',
        color: 'red',
        bgClass: 'bg-red-100',
        textClass: 'text-red-800',
      };
    case 'needs_revision':
      return {
        label: 'Needs Revision',
        color: 'amber',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-800',
      };
    case 'pending':
    default:
      return {
        label: 'Pending Review',
        color: 'blue',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-800',
      };
  }
}

/**
 * Get approval type label
 */
export function getApprovalTypeLabel(type) {
  switch (type) {
    case 'stage':
      return 'Stage Approval';
    case 'asset':
      return 'Asset Approval';
    case 'final':
      return 'Final Approval';
    default:
      return type;
  }
}
