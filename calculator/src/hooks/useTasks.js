import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
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
 * Fetch all tasks for a project with comments stats
 */
export function useTasks(projectId) {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get tasks
      const { data: tasks, error } = await supabase
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
      if (!tasks || tasks.length === 0) return [];

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      // Get comments stats for all tasks
      const taskIds = tasks.map(t => t.id);
      const { data: comments } = await supabase
        .from('comments')
        .select('id, entity_id, author_id')
        .eq('entity_type', 'task')
        .in('entity_id', taskIds);

      // Get checklist stats for all tasks
      const { data: checklistItems } = await supabase
        .from('task_checklist_items')
        .select('task_id, completed')
        .in('task_id', taskIds);

      // Calculate checklist stats per task
      const checklistStatsMap = {};
      (checklistItems || []).forEach(item => {
        if (!checklistStatsMap[item.task_id]) {
          checklistStatsMap[item.task_id] = { total: 0, completed: 0 };
        }
        checklistStatsMap[item.task_id].total++;
        if (item.completed) {
          checklistStatsMap[item.task_id].completed++;
        }
      });

      // Get read status for current user
      let readCommentIds = new Set();
      if (userId && comments?.length > 0) {
        const commentIds = comments.map(c => c.id);
        try {
          const { data: reads, error: readsError } = await supabase
            .from('comment_reads')
            .select('comment_id')
            .eq('user_id', userId)
            .in('comment_id', commentIds);
          
          if (!readsError && reads) {
            readCommentIds = new Set(reads.map(r => r.comment_id));
          }
        } catch (e) {
          // Table might not exist yet, treat all as unread
          console.warn('comment_reads table not available:', e);
        }
      }

      // Calculate stats per task
      const statsMap = {};
      (comments || []).forEach(comment => {
        if (!statsMap[comment.entity_id]) {
          statsMap[comment.entity_id] = { total: 0, unread: 0 };
        }
        statsMap[comment.entity_id].total++;
        // Unread = not read AND not authored by current user
        if (!readCommentIds.has(comment.id) && comment.author_id !== userId) {
          statsMap[comment.entity_id].unread++;
        }
      });

      // Merge stats into tasks
      return tasks.map(task => ({
        ...task,
        comments_count: statsMap[task.id]?.total || 0,
        unread_comments_count: statsMap[task.id]?.unread || 0,
        checklist_total: checklistStatsMap[task.id]?.total || 0,
        checklist_completed: checklistStatsMap[task.id]?.completed || 0,
      }));
    },
    enabled: !!projectId,
    // Auto-refresh every 10 seconds to check for new comments
    // Using polling because Supabase Realtime blocks HTTP requests on page reload
    // See memory-bank/systemPatterns.md for details
    refetchInterval: 10000,
    refetchIntervalInBackground: false,
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
 * Reorder tasks within a column or move to another column with position
 */
export function useReorderTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status, newOrder, projectId }) => {
      const updates = { 
        status,
        order: newOrder,
      };

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

/**
 * Mark all comments of a task as read
 */
export function useMarkCommentsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, projectId }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get unread comments for this task
      const { data: comments } = await supabase
        .from('comments')
        .select('id, author_id')
        .eq('entity_type', 'task')
        .eq('entity_id', taskId)
        .neq('author_id', user.id);

      if (!comments || comments.length === 0) return null;

      // Check which are already read
      const commentIds = comments.map(c => c.id);
      const { data: existingReads } = await supabase
        .from('comment_reads')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      const alreadyReadIds = new Set(existingReads?.map(r => r.comment_id) || []);
      const unreadCommentIds = commentIds.filter(id => !alreadyReadIds.has(id));

      if (unreadCommentIds.length === 0) return null;

      // Insert read records
      const records = unreadCommentIds.map(commentId => ({
        user_id: user.id,
        comment_id: commentId,
      }));

      const { error } = await supabase
        .from('comment_reads')
        .insert(records);

      if (error) throw error;
      return { taskId, projectId };
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ['tasks', data.projectId] });
      }
    },
  });
}
