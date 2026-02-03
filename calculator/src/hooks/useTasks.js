import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Task status columns for Kanban (5 columns)
 */
export const TASK_STATUSES = [
  { id: 'backlog', label: 'Backlog', color: 'slate' },
  { id: 'todo', label: 'To Do', color: 'neutral' },
  { id: 'in_progress', label: 'In Progress', color: 'blue' },
  { id: 'review', label: 'Review', color: 'amber' },
  { id: 'done', label: 'Done', color: 'emerald' },
];

/**
 * Fetch all tasks for a project
 */
export function useTasks(projectId) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          stage:workflow_stages (
            id,
            name,
            stage_key
          ),
          assignee:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('project_id', projectId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch tasks by stage
 */
export function useTasksByStage(stageId) {
  return useQuery({
    queryKey: ['tasks', 'stage', stageId],
    queryFn: async () => {
      if (!stageId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('stage_id', stageId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!stageId,
  });
}

/**
 * Fetch a single task with details
 */
export function useTask(taskId) {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          stage:workflow_stages (
            id,
            name,
            stage_key
          ),
          assignee:profiles (
            id,
            full_name,
            avatar_url
          ),
          project:projects (
            id,
            name
          )
        `)
        .eq('id', taskId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, stageId, title, description, dueDate }) => {
      // Get max order for this project
      const { data: maxOrderData } = await supabase
        .from('tasks')
        .select('order')
        .eq('project_id', projectId)
        .order('order', { ascending: false })
        .limit(1);

      const nextOrder = (maxOrderData?.[0]?.order || 0) + 1;

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          project_id: projectId,
          stage_id: stageId || null,
          title,
          description: description || null,
          due_date: dueDate || null,
          status: 'backlog', // Tasks start in backlog
          order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
      if (data.stage_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'stage', data.stage_id] });
      }
    },
  });
}

/**
 * Update a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.project_id] });
      if (data.stage_id) {
        queryClient.invalidateQueries({ queryKey: ['tasks', 'stage', data.stage_id] });
      }
    },
  });
}

/**
 * Update task status (for drag-and-drop)
 */
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status, projectId }) => {
      const updates = { status };

      // Set completed_at when moving to done
      if (status === 'done') {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return { ...data, projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, projectId }) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      return { taskId, projectId };
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
  });
}

/**
 * Get task status info for display
 */
export function getTaskStatusInfo(status) {
  const statusConfig = TASK_STATUSES.find((s) => s.id === status);
  if (!statusConfig) {
    return {
      label: status,
      color: 'neutral',
      bgClass: 'bg-neutral-100',
      textClass: 'text-neutral-600',
    };
  }

  const colorMap = {
    slate: { bgClass: 'bg-slate-100', textClass: 'text-slate-600' },
    neutral: { bgClass: 'bg-neutral-100', textClass: 'text-neutral-600' },
    blue: { bgClass: 'bg-blue-100', textClass: 'text-blue-800' },
    amber: { bgClass: 'bg-amber-100', textClass: 'text-amber-800' },
    emerald: { bgClass: 'bg-emerald-100', textClass: 'text-emerald-800' },
  };

  return {
    label: statusConfig.label,
    color: statusConfig.color,
    ...colorMap[statusConfig.color],
  };
}
