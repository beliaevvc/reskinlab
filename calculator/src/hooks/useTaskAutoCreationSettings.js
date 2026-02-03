import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Получить текущие настройки автоматического создания задач
 */
export function useTaskAutoCreationSettings() {
  return useQuery({
    queryKey: ['task-auto-creation-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_auto_creation_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Если настроек нет, возвращаем дефолтные
      if (!data) {
        return {
          briefing_task_enabled: true,
          briefing_task_title: 'Брифинг клиента',
          briefing_task_description: 'Провести брифинг с клиентом для уточнения требований и получения референсов',
          spec_tasks_enabled: true,
          animation_tasks_separate: true,
          default_assignee_id: null,
          default_due_days: 7,
        };
      }

      return data;
    },
  });
}

/**
 * Обновить настройки автоматического создания задач
 */
export function useUpdateTaskAutoCreationSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (settings) => {
      // Получаем текущие настройки
      const { data: currentSettings } = await supabase
        .from('task_auto_creation_settings')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const updateData = {
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      if (currentSettings?.id) {
        // Обновляем существующие настройки
        const { data, error } = await supabase
          .from('task_auto_creation_settings')
          .update(updateData)
          .eq('id', currentSettings.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Создаем новые настройки
        const { data, error } = await supabase
          .from('task_auto_creation_settings')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-auto-creation-settings'] });
    },
  });
}
