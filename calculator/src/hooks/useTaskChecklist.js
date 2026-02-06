import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logAuditEvent } from '../lib/auditLog';

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
      logAuditEvent({ action: 'create_checklist_item', entity_type: 'task_checklist', entity_id: data.id, details: { title: data.title, task_id: data.task_id } });
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
      logAuditEvent({ action: 'update_checklist_item', entity_type: 'task_checklist', entity_id: data.id, details: { task_id: data.task_id } });
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-checklist', variables.taskId] });
      logAuditEvent({ action: 'delete_checklist_item', entity_type: 'task_checklist', entity_id: variables.itemId, details: { task_id: variables.taskId } });
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
      logAuditEvent({ action: 'reorder_checklist_items', entity_type: 'task_checklist', entity_id: data.taskId, details: { items_count: data.items?.length } });
    },
  });
}
