import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { logPromoCodeEvent } from '../lib/auditLog';

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
          discount_type: promoCode.type === 'percentage' ? 'percent' : promoCode.type,
          discount_value: promoCode.value,
          min_order_amount: promoCode.minOrder || null,
          max_uses: promoCode.maxUses || null,
          valid_until: promoCode.expiresAt || null,
          is_active: promoCode.isActive ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      logPromoCodeEvent('create_promo_code', data.id, { code: data.code, type: data.discount_type, value: data.discount_value });
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
      const dbUpdates = {
        code: updates.code?.toUpperCase(),
        discount_type: updates.type === 'percentage' ? 'percent' : (updates.type === 'fixed' ? 'fixed' : undefined),
        discount_value: updates.value,
        min_order_amount: updates.minOrder,
        max_uses: updates.maxUses,
        valid_until: updates.expiresAt,
        is_active: updates.isActive,
      };
      // Remove undefined values
      Object.keys(dbUpdates).forEach(key => dbUpdates[key] === undefined && delete dbUpdates[key]);
      const { data, error } = await supabase
        .from('promo_codes')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      logPromoCodeEvent('update_promo_code', data.id, { code: data.code });
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
      // Fetch promo code before deletion for audit log
      const { data: promoData } = await supabase
        .from('promo_codes')
        .select('code')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, code: promoData?.code };
    },
    onSuccess: ({ id, code }) => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      logPromoCodeEvent('delete_promo_code', id, { code });
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      logPromoCodeEvent('toggle_promo_code', data.id, { is_active: data.is_active });
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
      if (data.valid_until && new Date(data.valid_until) < new Date()) {
        throw new Error('Promo code has expired');
      }

      // Check max uses
      if (data.max_uses && data.current_uses >= data.max_uses) {
        throw new Error('Promo code usage limit reached');
      }

      // Check minimum order
      if (data.min_order_amount && orderTotal < data.min_order_amount) {
        throw new Error(`Minimum order amount is $${data.min_order_amount}`);
      }

      // Calculate discount
      let discount = 0;
      if (data.discount_type === 'percent') {
        discount = (orderTotal * data.discount_value) / 100;
      } else {
        discount = Math.min(data.discount_value, orderTotal);
      }

      return {
        code: data.code,
        type: data.discount_type === 'percent' ? 'percentage' : data.discount_type,
        value: data.discount_value,
        discount,
      };
    },
  });
}
