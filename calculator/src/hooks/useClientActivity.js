import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { enrichLogsWithParentNames } from '../lib/auditLog';

/**
 * Actions excluded from the client activity feed
 * (noisy or irrelevant for the client dashboard)
 */
const EXCLUDED_ACTIONS = [
  'page_view',
  'logout',
  'failed_login',
  // Admin-only actions (RLS already filters, but double safety)
  'update_role',
  'update_price',
  'create_price_config',
  'delete_price_config',
  'update_settings',
  'create_promo_code',
  'update_promo_code',
  'delete_promo_code',
  'toggle_promo_code',
  'create_crypto_wallet',
  'update_crypto_wallet',
  'delete_crypto_wallet',
  'toggle_crypto_wallet',
  'create_offer_template',
  'update_offer_template',
  'delete_offer_template',
  'activate_offer_template',
  'duplicate_offer_template',
];

/**
 * Fetch recent activity for the current client from audit_logs.
 * RLS ensures only the client's own logs are returned.
 */
export function useClientActivity(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['client-activity', user?.id, limit],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, entity_type, entity_id, metadata, created_at')
        .eq('user_id', user.id)
        .not('action', 'in', `(${EXCLUDED_ACTIONS.join(',')})`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch client activity:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      // Enrich with parent names (project name, client name) for context
      const enriched = await enrichLogsWithParentNames(data);

      return enriched;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Refresh every minute
  });
}

export default useClientActivity;
