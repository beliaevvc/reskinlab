import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Fetch all promo codes
 */
export function usePromoCodes() {
  return useQuery({
    queryKey: ['promo-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Create promo code
 */
export function useCreatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (promoCode) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          code: promoCode.code.toUpperCase(),
          type: promoCode.type,
          value: promoCode.value,
          min_order: promoCode.minOrder || null,
          max_uses: promoCode.maxUses || null,
          expires_at: promoCode.expiresAt || null,
          is_active: promoCode.isActive ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
    },
  });
}

/**
 * Update promo code
 */
export function useUpdatePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .update({
          ...updates,
          code: updates.code?.toUpperCase(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
    },
  });
}

/**
 * Delete promo code
 */
export function useDeletePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
    },
  });
}

/**
 * Toggle promo code active status
 */
export function useTogglePromoCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .update({ is_active: isActive })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
    },
  });
}

/**
 * Validate promo code (for use in calculator)
 */
export function useValidatePromoCode() {
  return useMutation({
    mutationFn: async ({ code, orderTotal }) => {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        throw new Error('Invalid promo code');
      }

      // Check expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('Promo code has expired');
      }

      // Check max uses
      if (data.max_uses && data.times_used >= data.max_uses) {
        throw new Error('Promo code usage limit reached');
      }

      // Check minimum order
      if (data.min_order && orderTotal < data.min_order) {
        throw new Error(`Minimum order amount is $${data.min_order}`);
      }

      // Calculate discount
      let discount = 0;
      if (data.type === 'percentage') {
        discount = (orderTotal * data.value) / 100;
      } else {
        discount = Math.min(data.value, orderTotal);
      }

      return {
        code: data.code,
        type: data.type,
        value: data.value,
        discount,
      };
    },
  });
}
