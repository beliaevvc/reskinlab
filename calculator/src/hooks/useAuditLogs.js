import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Fetch audit logs with pagination and filters
 */
export function useAuditLogs(filters = {}) {
  const { action, userId, dateFrom, dateTo, limit = 50, offset = 0 } = filters;

  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          user_id,
          user_role,
          action,
          entity_type,
          entity_id,
          old_data,
          new_data,
          metadata,
          created_at,
          user:profiles!user_id(id, email, full_name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (action && action !== 'all') {
        query = query.eq('action', action);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Map to expected format for UI compatibility
      const mappedData = data?.map(log => ({
        ...log,
        details: log.metadata, // UI expects 'details'
      })) || [];

      return { data: mappedData, count };
    },
  });
}

/**
 * Get unique action types for filter dropdown
 */
export function useAuditActionTypes() {
  return useQuery({
    queryKey: ['audit-action-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .limit(1000);

      if (error) throw error;

      // Get unique actions
      const actions = [...new Set(data.map(d => d.action))].sort();
      return actions;
    },
  });
}

/**
 * Audit log stats
 */
export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
      // Get counts for last 24 hours, 7 days, 30 days
      const now = new Date();
      const day = new Date(now - 24 * 60 * 60 * 1000).toISOString();
      const week = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      const month = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [dayCount, weekCount, monthCount] = await Promise.all([
        supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', day),
        supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', week),
        supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', month),
      ]);

      return {
        last24h: dayCount.count || 0,
        last7d: weekCount.count || 0,
        last30d: monthCount.count || 0,
      };
    },
  });
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsCSV(filters = {}) {
  const { action, userId, dateFrom, dateTo } = filters;

  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      metadata,
      user_role,
      created_at,
      user:profiles!user_id(email)
    `)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (action && action !== 'all') {
    query = query.eq('action', action);
  }

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }

  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Convert to CSV
  const headers = ['ID', 'Action', 'Entity Type', 'Entity ID', 'User Email', 'User Role', 'Metadata', 'Created At'];
  const rows = data.map(log => [
    log.id,
    log.action,
    log.entity_type || '',
    log.entity_id || '',
    log.user?.email || '',
    log.user_role || '',
    JSON.stringify(log.metadata || {}),
    log.created_at,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
