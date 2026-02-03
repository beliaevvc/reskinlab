import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Fetch all price configurations
 */
export function usePriceConfigs() {
  return useQuery({
    queryKey: ['price-configs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_configs')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Update price config
 */
export function useUpdatePriceConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value, description }) => {
      const updateData = { 
        value, 
        updated_at: new Date().toISOString() 
      };
      
      // Only include description if provided (can be null to clear)
      if (description !== undefined) {
        updateData.description = description;
      }

      const { data, error } = await supabase
        .from('price_configs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-configs'] });
    },
  });
}

/**
 * Create new price config
 */
export function useCreatePriceConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ category, name, value, description }) => {
      const { data, error } = await supabase
        .from('price_configs')
        .insert({ category, name, value, description })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-configs'] });
    },
  });
}

/**
 * Delete price config
 */
export function useDeletePriceConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('price_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-configs'] });
    },
  });
}

/**
 * Get price config by name (for calculator)
 */
export function usePriceConfig(name) {
  return useQuery({
    queryKey: ['price-config', name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_configs')
        .select('*')
        .eq('name', name)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!name,
  });
}
