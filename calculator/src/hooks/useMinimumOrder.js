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
        .select('name, value, description, config_data')
        .eq('category', 'Minimum Order');

      if (error) throw error;

      const settings = {};
      (data || []).forEach((row) => {
        settings[row.name] = row;
      });

      // Get bilingual messages from config_data or fallback to description
      const messageConfig = settings.min_order_message;
      const configData = messageConfig?.config_data || {};
      const messageRu = configData.message_ru || messageConfig?.description || '';
      const messageEn = configData.message_en || messageConfig?.description || '';

      return {
        isEnabled: (settings.min_order_enabled?.value ?? 0) === 1,
        amount: settings.min_order_amount?.value ?? 0,
        messageRu,
        messageEn,
        // Legacy: keep message for backward compatibility
        message: messageEn,
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
 * @returns {{ isEnabled, amount, message, messageRu, messageEn, getMessage, isFirstOrder, isLoading, isBelowMinimum: function }}
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
  const messageRu = settings?.messageRu || '';
  const messageEn = settings?.messageEn || '';
  // Legacy: default to English
  const message = messageEn;

  // No project selected → treat as first order (conservative)
  const isFirstOrder = !projectId ? true : !hasPaidInvoices;

  const isLoading = settingsLoading || (!!projectId && invoicesLoading);

  /**
   * Get message by language code
   * @param {string} lang - 'ru' or 'en'
   */
  const getMessage = (lang) => {
    if (lang === 'ru') return messageRu || messageEn;
    return messageEn || messageRu;
  };

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
    messageRu,
    messageEn,
    getMessage,
    isFirstOrder,
    isLoading,
    isBelowMinimum,
    /** Whether the minimum enforcement is active for this context */
    isMinimumActive: isEnabled && isFirstOrder && amount > 0,
  };
}

export default useMinimumOrder;
