import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Получить чеклист для задачи
 */
export function useTaskChecklist(taskId) {
  return useQuery({
    queryKey: ['task-checklist', taskId],
    queryFn: async () => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!taskId,
  });
}

/**
 * Создать новый элемент чеклиста
 */
export function useCreateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, title, order = 0 }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({
          task_id: taskId,
          title: title.trim(),
          completed: false,
          order: order,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', data.task_id] });
    },
  });
}

/**
 * Обновить элемент чеклиста
 */
export function useUpdateChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', data.task_id] });
    },
  });
}

/**
 * Удалить элемент чеклиста
 */
export function useDeleteChecklistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, taskId }) => {
      const { error } = await supabase
        .from('task_checklist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return { itemId, taskId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
    },
  });
}

/**
 * Переместить элемент чеклиста (изменить порядок)
 */
export function useReorderChecklistItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, items }) => {
      // Обновляем порядок всех элементов
      const updates = items.map((item, index) =>
        supabase
          .from('task_checklist_items')
          .update({ order: index })
          .eq('id', item.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);
      
      if (errors.length > 0) {
        throw errors[0].error;
      }

      return { taskId, items };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', data.taskId] });
    },
  });
}
