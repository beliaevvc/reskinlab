import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Fetch minimum order settings from price_configs
 */
function useMinimumOrderSettings() {
  return useQuery({
    queryKey: ['minimum-order-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('price_configs')
        .select('name, value, description')
        .eq('category', 'Minimum Order');

      if (error) throw error;

      const settings = {};
      (data || []).forEach((row) => {
        settings[row.name] = row;
      });

      return {
        isEnabled: (settings.min_order_enabled?.value ?? 0) === 1,
        amount: settings.min_order_amount?.value ?? 0,
        message: settings.min_order_message?.description || '',
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}

/**
 * Check if project has any paid invoices (= not first order)
 */
export function useProjectHasPaidInvoices(projectId) {
  return useQuery({
    queryKey: ['project-paid-invoices', projectId],
    queryFn: async () => {
      if (!projectId) return false;

      const { count, error } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'paid');

      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: !!projectId,
  });
}

/**
 * Main hook: combines settings + project check
 *
 * @param {string|null} projectId - Current project ID
 * @returns {{ isEnabled, amount, message, isFirstOrder, isLoading, isBelowMinimum: function }}
 */
export function useMinimumOrder(projectId) {
  const {
    data: settings,
    isLoading: settingsLoading,
  } = useMinimumOrderSettings();

  const {
    data: hasPaidInvoices,
    isLoading: invoicesLoading,
  } = useProjectHasPaidInvoices(projectId);

  const isEnabled = settings?.isEnabled ?? false;
  const amount = settings?.amount ?? 0;
  const message = settings?.message || '';

  // No project selected → treat as first order (conservative)
  const isFirstOrder = !projectId ? true : !hasPaidInvoices;

  const isLoading = settingsLoading || (!!projectId && invoicesLoading);

  /**
   * Check if a given grandTotal is below the minimum
   * Only relevant when minimum is enabled AND it's a first order
   */
  const isBelowMinimum = (grandTotal) => {
    if (!isEnabled || !isFirstOrder || amount <= 0) return false;
    return grandTotal > 0 && grandTotal < amount;
  };

  return {
    isEnabled,
    amount,
    message,
    isFirstOrder,
    isLoading,
    isBelowMinimum,
    /** Whether the minimum enforcement is active for this context */
    isMinimumActive: isEnabled && isFirstOrder && amount > 0,
  };
}

export default useMinimumOrder;
