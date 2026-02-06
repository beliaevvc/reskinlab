import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logAuditEvent } from '../lib/auditLog';

/**
 * Получить все шаблоны автоматических задач
 */
export function useTaskAutoTemplates() {
  return useQuery({
    queryKey: ['task-auto-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_auto_templates')
        .select('*')
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
}

/**
 * Создать новый шаблон задачи
 */
export function useCreateTaskAutoTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (template) => {
      const { data, error } = await supabase
        .from('task_auto_templates')
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
      queryClient.invalidateQueries({ queryKey: ['task-auto-templates'] });
      logAuditEvent({ action: 'create_task_auto_template', entity_type: 'task_auto_template', entity_id: data.id, details: { title: data.title } });
    },
  });
}

/**
 * Обновить шаблон задачи
 */
export function useUpdateTaskAutoTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('task_auto_templates')
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
      queryClient.invalidateQueries({ queryKey: ['task-auto-templates'] });
      logAuditEvent({ action: 'update_task_auto_template', entity_type: 'task_auto_template', entity_id: data.id, details: { title: data.title } });
    },
  });
}

/**
 * Удалить шаблон задачи
 */
export function useDeleteTaskAutoTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('task_auto_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['task-auto-templates'] });
      logAuditEvent({ action: 'delete_task_auto_template', entity_type: 'task_auto_template', entity_id: id });
    },
  });
}
