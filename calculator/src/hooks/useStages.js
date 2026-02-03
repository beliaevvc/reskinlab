import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Default workflow stages for a new project
 */
export const DEFAULT_STAGES = [
  { key: 'briefing', name: 'Briefing', order: 1 },
  { key: 'moodboard', name: 'Moodboard', order: 2 },
  { key: 'symbols', name: 'Symbols Design', order: 3 },
  { key: 'ui', name: 'UI Elements', order: 4 },
  { key: 'animation', name: 'Animation', order: 5 },
  { key: 'revisions', name: 'Revisions', order: 6 },
  { key: 'delivery', name: 'Final Delivery', order: 7 },
];

/**
 * Fetch all stages for a project
 */
export function useStages(projectId) {
  return useQuery({
    queryKey: ['stages', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('workflow_stages')
        .select('*')
        .eq('project_id', projectId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch a single stage with its tasks
 */
export function useStage(stageId) {
  return useQuery({
    queryKey: ['stage', stageId],
    queryFn: async () => {
      if (!stageId) return null;

      const { data, error } = await supabase
        .from('workflow_stages')
        .select(`
          *,
          tasks (
            id,
            title,
            status,
            due_date,
            order
          )
        `)
        .eq('id', stageId)
        .single();

      if (error) throw error;
      
      // Sort tasks by order
      if (data?.tasks) {
        data.tasks.sort((a, b) => a.order - b.order);
      }
      
      return data;
    },
    enabled: !!stageId,
  });
}

/**
 * Create default stages for a project
 */
export function useCreateStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId) => {
      // Check if stages already exist
      const { data: existing } = await supabase
        .from('workflow_stages')
        .select('id')
        .eq('project_id', projectId)
        .limit(1);

      if (existing && existing.length > 0) {
        throw new Error('Stages already exist for this project');
      }

      // Create all default stages
      const stagesToCreate = DEFAULT_STAGES.map((stage) => ({
        project_id: projectId,
        stage_key: stage.key,
        name: stage.name,
        order: stage.order,
        status: 'pending',
      }));

      const { data, error } = await supabase
        .from('workflow_stages')
        .insert(stagesToCreate)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

/**
 * Update stage status
 */
export function useUpdateStageStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, status, projectId }) => {
      const updateData = { status };

      // Set timestamps based on status
      if (status === 'in_progress' || status === 'review') {
        updateData.started_at = new Date().toISOString();
        // Очищаем completed_at при активации
        updateData.completed_at = null;
      }
      if (status === 'completed' || status === 'approved') {
        updateData.completed_at = new Date().toISOString();
      }
      if (status === 'pending') {
        // При деактивации очищаем started_at и completed_at
        updateData.started_at = null;
        updateData.completed_at = null;
      }

      const { data, error } = await supabase
        .from('workflow_stages')
        .update(updateData)
        .eq('id', stageId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stages', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['stage', data.id] });
    },
  });
}

/**
 * Activate stage and all previous pending stages
 */
export function useActivateStageWithPrevious() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, allStages, projectId }) => {
      // Находим выбранный этап
      const targetStage = allStages.find(s => s.id === stageId);
      if (!targetStage) throw new Error('Stage not found');

      // Находим все этапы, которые нужно активировать:
      // - все этапы с order <= выбранного этапа
      // - которые находятся в статусе pending
      const stagesToActivate = allStages.filter(
        stage => stage.order <= targetStage.order && stage.status === 'pending'
      );

      if (stagesToActivate.length === 0) {
        // Если нет этапов для активации, просто обновляем выбранный
        const updateData = {
          status: 'in_progress',
          started_at: new Date().toISOString(),
          completed_at: null,
        };

        const { data, error } = await supabase
          .from('workflow_stages')
          .update(updateData)
          .eq('id', stageId)
          .select()
          .single();

        if (error) throw error;
        return { ...data, projectId };
      }

      // Массовое обновление всех этапов
      const stageIds = stagesToActivate.map(s => s.id);
      const updateData = {
        status: 'in_progress',
        started_at: new Date().toISOString(),
        completed_at: null,
      };

      const { data, error } = await supabase
        .from('workflow_stages')
        .update(updateData)
        .in('id', stageIds)
        .select();

      if (error) throw error;
      return { stages: data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stages', data.projectId] });
    },
  });
}

/**
 * Deactivate stage and all previous stages (from selected to the beginning)
 */
export function useDeactivateStageWithPrevious() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stageId, allStages, projectId }) => {
      // Находим выбранный этап
      const targetStage = allStages.find(s => s.id === stageId);
      if (!targetStage) throw new Error('Stage not found');

      // Находим все этапы, которые нужно деактивировать:
      // - все этапы с order >= выбранного этапа (выбранный этап и все последующие)
      // - которые находятся в активном статусе (in_progress, review) или завершены (completed, approved)
      const stagesToDeactivate = allStages
        .filter(
          stage => stage.order >= targetStage.order && 
          (stage.status === 'in_progress' || stage.status === 'review' || 
           stage.status === 'completed' || stage.status === 'approved')
        )
        .sort((a, b) => b.order - a.order); // Сортируем от большего к меньшему (справа налево)

      if (stagesToDeactivate.length === 0) {
        // Если нет этапов для деактивации, просто обновляем выбранный
        const updateData = {
          status: 'pending',
          started_at: null,
          completed_at: null,
        };

        const { data, error } = await supabase
          .from('workflow_stages')
          .update(updateData)
          .eq('id', stageId)
          .select()
          .single();

        if (error) throw error;
        return { ...data, projectId };
      }

      // Массовое обновление всех этапов (все сразу, порядок не важен для БД)
      const stageIds = stagesToDeactivate.map(s => s.id);
      const updateData = {
        status: 'pending',
        started_at: null,
        completed_at: null,
      };

      const { data, error } = await supabase
        .from('workflow_stages')
        .update(updateData)
        .in('id', stageIds)
        .select();

      if (error) throw error;
      return { stages: data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stages', data.projectId] });
    },
  });
}

/**
 * Get stage status info for display
 */
export function getStageStatusInfo(status) {
  switch (status) {
    case 'in_progress':
      return {
        label: 'In Progress',
        color: 'blue',
        bgClass: 'bg-blue-100',
        textClass: 'text-blue-800',
      };
    case 'review':
      return {
        label: 'In Review',
        color: 'amber',
        bgClass: 'bg-amber-100',
        textClass: 'text-amber-800',
      };
    case 'approved':
      return {
        label: 'Approved',
        color: 'emerald',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-800',
      };
    case 'completed':
      return {
        label: 'Completed',
        color: 'emerald',
        bgClass: 'bg-emerald-100',
        textClass: 'text-emerald-800',
      };
    case 'pending':
    default:
      return {
        label: 'Pending',
        color: 'neutral',
        bgClass: 'bg-neutral-100',
        textClass: 'text-neutral-600',
      };
  }
}
