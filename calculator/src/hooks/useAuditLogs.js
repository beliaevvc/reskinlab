import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { enrichLogsWithParentNames } from '../lib/auditLog';

// ============================================
// Main audit logs hook with extended filters
// ============================================

/**
 * Fetch audit logs with pagination, sorting, and extended filters
 */
export function useAuditLogs(filters = {}, options = {}) {
  const {
    action,
    userId,
    userRole,
    entityType,
    entityId,
    dateFrom,
    dateTo,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 100,
    offset = 0,
  } = filters;

  const { autoRefresh = false } = options;

  return useQuery({
    queryKey: ['audit-logs', filters],
    refetchOnMount: 'always',
    staleTime: 0,
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
          ip_address,
          user_agent,
          created_at,
          user:profiles!user_id(id, email, full_name, role, avatar_url)
        `, { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (action && action !== 'all') {
        query = query.eq('action', action);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (userRole && userRole !== 'all') {
        query = query.eq('user_role', userRole);
      }

      if (entityType && entityType !== 'all') {
        query = query.eq('entity_type', entityType);
      }

      if (entityId) {
        query = query.eq('entity_id', entityId);
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }

      if (dateTo) {
        // Add end of day to include the full day
        const endDate = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`;
        query = query.lte('created_at', endDate);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Enrich old logs with missing parent context (project_name, client_name)
      const enrichedData = await enrichLogsWithParentNames(data || []);

      // Map to expected format for UI compatibility
      const mappedData = enrichedData.map(log => ({
        ...log,
        details: log.metadata,
      }));

      return { data: mappedData, count };
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });
}

// ============================================
// Filter options hooks
// ============================================

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

      const actions = [...new Set(data.map(d => d.action))].sort();
      return actions;
    },
    staleTime: 60000,
  });
}

/**
 * Get unique entity types for filter dropdown
 */
export function useAuditEntityTypes() {
  return useQuery({
    queryKey: ['audit-entity-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('entity_type')
        .limit(1000);

      if (error) throw error;

      const types = [...new Set(data.map(d => d.entity_type).filter(Boolean))].sort();
      return types;
    },
    staleTime: 60000,
  });
}

/**
 * Get all users for filter dropdown
 */
export function useAuditUsers() {
  return useQuery({
    queryKey: ['audit-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

// ============================================
// Stats hooks
// ============================================

/**
 * Audit log stats (24h, 7d, 30d counts)
 */
export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: async () => {
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
    refetchInterval: 60000,
  });
}

/**
 * Get daily event counts for the last 30 days (for sparklines and activity chart)
 */
export function useAuditDailyActivity() {
  return useQuery({
    queryKey: ['audit-daily-activity'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyCounts = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        dailyCounts[key] = 0;
      }

      (data || []).forEach(log => {
        const key = log.created_at.split('T')[0];
        if (dailyCounts[key] !== undefined) {
          dailyCounts[key]++;
        }
      });

      return Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count,
      }));
    },
    staleTime: 60000,
  });
}

/**
 * Get top 5 most active users
 */
export function useAuditTopUsers() {
  return useQuery({
    queryKey: ['audit-top-users'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          user_id,
          user:profiles!user_id(full_name, email)
        `)
        .gte('created_at', sevenDaysAgo);

      if (error) throw error;

      // Count per user
      const userCounts = {};
      (data || []).forEach(log => {
        const uid = log.user_id;
        if (!uid) return;
        if (!userCounts[uid]) {
          userCounts[uid] = {
            userId: uid,
            name: log.user?.full_name || log.user?.email || 'Unknown',
            count: 0,
          };
        }
        userCounts[uid].count++;
      });

      return Object.values(userCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    staleTime: 60000,
  });
}

/**
 * Get action type distribution (for pie chart)
 */
export function useAuditActionDistribution() {
  return useQuery({
    queryKey: ['audit-action-distribution'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('audit_logs')
        .select('action')
        .gte('created_at', sevenDaysAgo);

      if (error) throw error;

      // Count per action
      const actionCounts = {};
      (data || []).forEach(log => {
        const action = log.action || 'unknown';
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });

      return Object.entries(actionCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },
    staleTime: 60000,
  });
}

/**
 * Get anomaly indicator: compare today vs 7-day average
 */
export function useAuditAnomalyCheck() {
  return useQuery({
    queryKey: ['audit-anomaly'],
    queryFn: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [todayResult, weekResult] = await Promise.all([
        supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      ]);

      const todayCount = todayResult.count || 0;
      const weekCount = weekResult.count || 0;
      const dailyAvg = weekCount / 7;
      const ratio = dailyAvg > 0 ? todayCount / dailyAvg : 0;

      return {
        todayCount,
        dailyAvg: Math.round(dailyAvg),
        ratio: Math.round(ratio * 100) / 100,
        isAnomaly: ratio > 2, // 2x above average = anomaly
      };
    },
    staleTime: 60000,
  });
}

// ============================================
// Export functions
// ============================================

/**
 * Build Supabase query from filters (shared between CSV and JSON export)
 */
function buildExportQuery(filters = {}) {
  const { action, userId, userRole, entityType, entityId, dateFrom, dateTo } = filters;

  let query = supabase
    .from('audit_logs')
    .select(`
      id,
      action,
      entity_type,
      entity_id,
      metadata,
      user_role,
      ip_address,
      user_agent,
      old_data,
      new_data,
      created_at,
      user:profiles!user_id(email, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(10000);

  if (action && action !== 'all') query = query.eq('action', action);
  if (userId) query = query.eq('user_id', userId);
  if (userRole && userRole !== 'all') query = query.eq('user_role', userRole);
  if (entityType && entityType !== 'all') query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) {
    const endDate = dateTo.includes('T') ? dateTo : `${dateTo}T23:59:59.999Z`;
    query = query.lte('created_at', endDate);
  }

  return query;
}

/**
 * Trigger file download in browser
 */
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogsCSV(filters = {}) {
  const { data, error } = await buildExportQuery(filters);
  if (error) throw error;

  const headers = ['ID', 'Action', 'Entity Type', 'Entity ID', 'User', 'User Email', 'User Role', 'IP Address', 'Metadata', 'Created At'];
  const rows = data.map(log => [
    log.id,
    log.action,
    log.entity_type || '',
    log.entity_id || '',
    log.user?.full_name || '',
    log.user?.email || '',
    log.user_role || '',
    log.ip_address || '',
    JSON.stringify(log.metadata || {}),
    log.created_at,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  downloadFile(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
}

/**
 * Export audit logs to JSON
 */
export async function exportAuditLogsJSON(filters = {}) {
  const { data, error } = await buildExportQuery(filters);
  if (error) throw error;

  const jsonData = data.map(log => ({
    id: log.id,
    action: log.action,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    user_name: log.user?.full_name || '',
    user_email: log.user?.email || '',
    user_role: log.user_role,
    ip_address: log.ip_address,
    old_data: log.old_data,
    new_data: log.new_data,
    metadata: log.metadata,
    created_at: log.created_at,
  }));

  const json = JSON.stringify(jsonData, null, 2);
  downloadFile(json, `audit-logs-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
}
