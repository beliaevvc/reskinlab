import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logStageEvent } from '../lib/auditLog';

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
    onSuccess: (data, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['stages', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      logStageEvent('create_stages', projectId, { count: data?.length });
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
      logStageEvent('update_stage_status', data.id, { status: data.status, project_id: data.projectId });
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

      const now = new Date().toISOString();
      const activateData = {
        status: 'in_progress',
        started_at: now,
        completed_at: null,
      };

      // Разделяем на реальные стадии из БД и плейсхолдеры
      const placeholderStages = stagesToActivate.filter(s => s._isPlaceholder);
      const realStages = stagesToActivate.filter(s => !s._isPlaceholder);

      // Сначала создаём плейсхолдерные стадии в БД со статусом in_progress
      if (placeholderStages.length > 0) {
        const newStages = placeholderStages.map(s => ({
          project_id: projectId,
          stage_key: s.stage_key,
          name: s.name,
          description: '',
          order: s.order,
          status: 'in_progress',
          started_at: now,
        }));

        const { error: insertError } = await supabase
          .from('workflow_stages')
          .insert(newStages);

        if (insertError) throw insertError;
      }

      // Обновляем существующие стадии из БД
      if (realStages.length > 0) {
        const stageIds = realStages.map(s => s.id);

        const { error } = await supabase
          .from('workflow_stages')
          .update(activateData)
          .in('id', stageIds)
          .select();

        if (error) throw error;
      } else if (placeholderStages.length === 0) {
        // Если нет ни плейсхолдеров, ни реальных стадий для активации,
        // просто обновляем выбранный этап
        if (!targetStage._isPlaceholder) {
          const { data, error } = await supabase
            .from('workflow_stages')
            .update(activateData)
            .eq('id', stageId)
            .select()
            .single();

          if (error) throw error;
        }
      }

      // Отправляем одно батч-уведомление через RPC (не блокируем UI при ошибке)
      try {
        const stageNames = stagesToActivate.map(s => s.name);
        await supabase.rpc('notify_stages_changed', {
          p_project_id: projectId,
          p_target_stage_name: targetStage.name,
          p_action: 'activated',
          p_stage_names: stageNames,
        });
      } catch { /* ignore notification errors */ }

      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stages', data.projectId] });
      logStageEvent('activate_stages', data.projectId, { project_id: data.projectId });
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

      // Плейсхолдеры нельзя деактивировать — они и так pending
      if (targetStage._isPlaceholder) {
        return { projectId };
      }

      // Находим все этапы, которые нужно деактивировать:
      // - все этапы с order >= выбранного этапа (выбранный этап и все последующие)
      // - которые находятся в активном статусе (in_progress, review) или завершены (completed, approved)
      // - только реальные стадии из БД (не плейсхолдеры)
      const stagesToDeactivate = allStages
        .filter(
          stage => !stage._isPlaceholder &&
          stage.order >= targetStage.order && 
          (stage.status === 'in_progress' || stage.status === 'review' || 
           stage.status === 'completed' || stage.status === 'approved')
        )
        .sort((a, b) => b.order - a.order);

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

      // Отправляем одно батч-уведомление через RPC (не блокируем UI при ошибке)
      try {
        const stageNames = stagesToDeactivate.map(s => s.name);
        await supabase.rpc('notify_stages_changed', {
          p_project_id: projectId,
          p_target_stage_name: targetStage.name,
          p_action: 'deactivated',
          p_stage_names: stageNames,
        });
      } catch { /* ignore notification errors */ }

      return { stages: data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stages', data.projectId] });
      logStageEvent('deactivate_stages', data.projectId, { project_id: data.projectId });
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
