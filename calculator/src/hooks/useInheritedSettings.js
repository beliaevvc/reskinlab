import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useProjectHasPaidInvoices } from './useMinimumOrder';
import { STYLES, USAGE_RIGHTS, PAYMENT_MODELS } from '../data';

/**
 * Fetch the first paid specification for a project.
 * "Paid" = has at least one invoice with status='paid'.
 * Returns the earliest such specification (by created_at).
 */
function useFirstPaidSpecification(projectId, enabled) {
  return useQuery({
    queryKey: ['first-paid-specification', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Step 1: Get offer_ids that have paid invoices for this project
      const { data: paidInvoices, error: invError } = await supabase
        .from('invoices')
        .select('offer_id')
        .eq('project_id', projectId)
        .eq('status', 'paid');

      if (invError) throw invError;
      if (!paidInvoices?.length) return null;

      const offerIds = [...new Set(paidInvoices.map((i) => i.offer_id))];

      // Step 2: Get specification_ids from those offers
      const { data: offers, error: offError } = await supabase
        .from('offers')
        .select('specification_id')
        .in('id', offerIds);

      if (offError) throw offError;
      if (!offers?.length) return null;

      const specIds = offers.map((o) => o.specification_id);

      // Step 3: Get the earliest specification among those
      const { data: spec, error: specError } = await supabase
        .from('specifications')
        .select('id, state_json')
        .in('id', specIds)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (specError) throw specError;
      return spec;
    },
    enabled: !!projectId && enabled === true,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

/**
 * Main hook: determines if new specifications in this project
 * should inherit settings from the first paid specification.
 *
 * @param {string|null} projectId - Current project ID
 * @returns {{
 *   shouldInherit: boolean,
 *   parentSpecId: string|null,
 *   inheritedSettings: { globalStyle, usageRights, paymentModel } | null,
 *   isLoading: boolean,
 * }}
 */
export function useInheritedSettings(projectId) {
  const {
    data: hasPaidInvoices,
    isLoading: paidLoading,
  } = useProjectHasPaidInvoices(projectId);

  const {
    data: firstPaidSpec,
    isLoading: specLoading,
  } = useFirstPaidSpecification(projectId, hasPaidInvoices === true);

  const isLoading = paidLoading || (hasPaidInvoices && specLoading);

  // Extract inherited settings from the first paid spec's state_json
  let inheritedSettings = null;
  let parentSpecId = null;

  if (firstPaidSpec?.state_json) {
    const state = firstPaidSpec.state_json;

    // Resolve settings against current data arrays to ensure validity
    const globalStyle = state.globalStyle
      ? STYLES.find((s) => s.id === state.globalStyle.id) || state.globalStyle
      : null;
    const usageRights = state.usageRights
      ? USAGE_RIGHTS.find((r) => r.id === state.usageRights.id) || state.usageRights
      : null;
    const paymentModel = state.paymentModel
      ? PAYMENT_MODELS.find((m) => m.id === state.paymentModel.id) || state.paymentModel
      : null;

    if (globalStyle && usageRights && paymentModel) {
      inheritedSettings = { globalStyle, usageRights, paymentModel };
      parentSpecId = firstPaidSpec.id;
    }
  }

  const shouldInherit = !!hasPaidInvoices && !!inheritedSettings;

  return {
    shouldInherit,
    parentSpecId,
    inheritedSettings,
    isLoading,
  };
}

export default useInheritedSettings;
