import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/auditLog';

/**
 * Получить все шаблоны задач из спецификации
 */
export function useTaskSpecItemTemplates() {
  return useQuery({
    queryKey: ['task-spec-item-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_spec_item_templates')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('item_id', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Обновить шаблон задачи из спецификации
 */
export function useUpdateTaskSpecItemTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('task_spec_item_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-spec-item-templates'] });
      logAuditEvent({ action: 'update_task_spec_item_template', entity_type: 'task_spec_item_template', entity_id: data.id, details: { item_id: data.item_id } });
    },
  });
}

/**
 * Создать новый шаблон задачи из спецификации
 */
export function useCreateTaskSpecItemTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template) => {
      const { data, error } = await supabase
        .from('task_spec_item_templates')
        .insert({
          ...template,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-spec-item-templates'] });
      logAuditEvent({ action: 'create_task_spec_item_template', entity_type: 'task_spec_item_template', entity_id: data.id, details: { item_id: data.item_id } });
    },
  });
}
