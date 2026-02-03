import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Delivery status info
 */
export const DELIVERY_STATUSES = {
  pending: { label: 'Pending Review', color: 'amber', icon: '⏳' },
  approved: { label: 'Approved', color: 'emerald', icon: '✅' },
  revision_requested: { label: 'Revision Requested', color: 'red', icon: '🔄' },
};

export function getDeliveryStatusInfo(status) {
  return DELIVERY_STATUSES[status] || DELIVERY_STATUSES.pending;
}

/**
 * Fetch deliveries for a project
 */
export function useDeliveries(projectId) {
  return useQuery({
    queryKey: ['deliveries', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          submitter:profiles!submitted_by(id, full_name, email),
          reviewer:profiles!reviewed_by(id, full_name, email),
          stage:workflow_stages(id, name),
          files:project_files(*)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch a single delivery
 */
export function useDelivery(deliveryId) {
  return useQuery({
    queryKey: ['delivery', deliveryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          submitter:profiles!submitted_by(id, full_name, email),
          reviewer:profiles!reviewed_by(id, full_name, email),
          stage:workflow_stages(id, name),
          files:project_files(*)
        `)
        .eq('id', deliveryId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!deliveryId,
  });
}

/**
 * Create a new delivery (staff only)
 */
export function useCreateDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ projectId, stageId = null, title, description }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          project_id: projectId,
          stage_id: stageId,
          title,
          description,
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', data.project_id] });
    },
  });
}

/**
 * Approve a delivery (client)
 */
export function useApproveDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ deliveryId, feedback = null }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          client_feedback: feedback,
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['delivery', data.id] });
    },
  });
}

/**
 * Request revision (client)
 */
export function useRequestRevision() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ deliveryId, feedback }) => {
      // First get current revision count
      const { data: current, error: fetchError } = await supabase
        .from('deliveries')
        .select('revision_count')
        .eq('id', deliveryId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'revision_requested',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          client_feedback: feedback,
          revision_count: (current.revision_count || 0) + 1,
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['delivery', data.id] });
    },
  });
}

/**
 * Resubmit delivery after revision (staff)
 */
export function useResubmitDelivery() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ deliveryId, description }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          status: 'pending',
          description,
          submitted_by: user.id,
          submitted_at: new Date().toISOString(),
          reviewed_by: null,
          reviewed_at: null,
          client_feedback: null,
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', data.project_id] });
      queryClient.invalidateQueries({ queryKey: ['delivery', data.id] });
    },
  });
}

/**
 * Get delivery checklist for a project
 */
export function useDeliveryChecklist(projectId) {
  return useQuery({
    queryKey: ['delivery-checklist', projectId],
    queryFn: async () => {
      // Fetch all related data
      const [tasksResult, stagesResult, approvalsResult, filesResult] = await Promise.all([
        supabase.from('tasks').select('id, status').eq('project_id', projectId),
        supabase.from('workflow_stages').select('id, status').eq('project_id', projectId),
        supabase.from('approvals').select('id, status').eq('project_id', projectId),
        supabase.from('project_files').select('id, bucket').eq('project_id', projectId),
      ]);

      const tasks = tasksResult.data || [];
      const stages = stagesResult.data || [];
      const approvals = approvalsResult.data || [];
      const files = filesResult.data || [];

      // Calculate checklist
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const totalTasks = tasks.length;

      const completedStages = stages.filter(s => s.status === 'completed').length;
      const totalStages = stages.length;

      const approvedApprovals = approvals.filter(a => a.status === 'approved').length;
      const totalApprovals = approvals.length;

      const deliverableFiles = files.filter(f => f.bucket === 'deliverables').length;
      const sourceFiles = files.filter(f => f.bucket === 'sources').length;

      const checklist = [
        {
          id: 'tasks',
          label: 'All tasks completed',
          completed: totalTasks > 0 && completedTasks === totalTasks,
          progress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
          detail: `${completedTasks}/${totalTasks} tasks`,
        },
        {
          id: 'stages',
          label: 'All stages completed',
          completed: totalStages > 0 && completedStages === totalStages,
          progress: totalStages > 0 ? (completedStages / totalStages) * 100 : 0,
          detail: `${completedStages}/${totalStages} stages`,
        },
        {
          id: 'approvals',
          label: 'All approvals received',
          completed: totalApprovals === 0 || approvedApprovals === totalApprovals,
          progress: totalApprovals > 0 ? (approvedApprovals / totalApprovals) * 100 : 100,
          detail: totalApprovals > 0 ? `${approvedApprovals}/${totalApprovals} approvals` : 'No approvals required',
        },
        {
          id: 'deliverables',
          label: 'Deliverables uploaded',
          completed: deliverableFiles > 0,
          progress: deliverableFiles > 0 ? 100 : 0,
          detail: `${deliverableFiles} files`,
        },
        {
          id: 'sources',
          label: 'Source files uploaded',
          completed: sourceFiles > 0,
          progress: sourceFiles > 0 ? 100 : 0,
          detail: `${sourceFiles} files`,
          optional: true,
        },
      ];

      const requiredItems = checklist.filter(item => !item.optional);
      const completedItems = requiredItems.filter(item => item.completed).length;
      const overallProgress = (completedItems / requiredItems.length) * 100;
      const readyForDelivery = completedItems === requiredItems.length;

      return {
        checklist,
        overallProgress,
        readyForDelivery,
        completedItems,
        totalItems: requiredItems.length,
      };
    },
    enabled: !!projectId,
  });
}

/**
 * Finalize project (mark as completed)
 */
export function useFinalizeProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
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
