import { supabase } from './supabase';

// ============================================
// IP Address caching
// ============================================

let cachedIpAddress = null;
let cachedGeoLocation = null;

/**
 * Fetch and cache the user's IP address + geolocation
 * Uses ip-api.com which returns IP + city + country in one call (free, no key needed)
 */
export async function fetchAndCacheIp() {
  try {
    const stored = sessionStorage.getItem('audit_ip');
    const storedGeo = sessionStorage.getItem('audit_geo');
    if (stored && storedGeo) {
      cachedIpAddress = stored;
      try { cachedGeoLocation = JSON.parse(storedGeo); } catch { cachedGeoLocation = null; }
      return stored;
    }

    // Clear stale cache (IP without geo)
    sessionStorage.removeItem('audit_ip');
    sessionStorage.removeItem('audit_geo');

    // Try multiple APIs in order until one works
    const apis = [
      {
        url: 'https://ipwho.is/',
        parse: (d) => d.success !== false ? { ip: d.ip, city: d.city, region: d.region, country: d.country, isp: d.connection?.isp } : null,
      },
      {
        url: 'https://ipapi.co/json/',
        parse: (d) => !d.error ? { ip: d.ip, city: d.city, region: d.region, country: d.country_name, isp: d.org } : null,
      },
      {
        url: 'https://api.ipify.org?format=json',
        parse: (d) => ({ ip: d.ip, city: null, region: null, country: null, isp: null }),
      },
    ];

    for (const api of apis) {
      try {
        const res = await fetch(api.url);
        if (!res.ok) continue;
        const raw = await res.json();
        const parsed = api.parse(raw);
        if (parsed && parsed.ip) {
          cachedIpAddress = parsed.ip;
          cachedGeoLocation = parsed.city ? {
            city: parsed.city,
            region: parsed.region,
            country: parsed.country,
            isp: parsed.isp,
          } : null;
          break;
        }
      } catch {
        continue;
      }
    }

    if (cachedIpAddress) {
      sessionStorage.setItem('audit_ip', cachedIpAddress);
      if (cachedGeoLocation) {
        sessionStorage.setItem('audit_geo', JSON.stringify(cachedGeoLocation));
      }
    }

    return cachedIpAddress;
  } catch (err) {
    console.warn('Failed to fetch IP address:', err);
    return null;
  }
}

/**
 * Get cached geolocation data
 */
function getCachedGeo() {
  if (cachedGeoLocation) return cachedGeoLocation;
  const stored = sessionStorage.getItem('audit_geo');
  if (stored) {
    try {
      cachedGeoLocation = JSON.parse(stored);
      return cachedGeoLocation;
    } catch { return null; }
  }
  return null;
}

/**
 * Get cached IP address, or fetch it lazily if not yet cached
 */
async function getIpAddress() {
  if (cachedIpAddress) return cachedIpAddress;
  const stored = sessionStorage.getItem('audit_ip');
  if (stored) {
    cachedIpAddress = stored;
    return stored;
  }
  // Lazy fetch — first log call triggers IP + geo resolution
  return await fetchAndCacheIp();
}

/**
 * Get user agent string
 */
function getUserAgent() {
  return typeof navigator !== 'undefined' ? navigator.userAgent : null;
}

// ============================================
// Core logging function
// ============================================

/**
 * Log an audit event to the audit_logs table
 * 
 * @param {Object} params
 * @param {string} params.action - The action performed (e.g., 'login', 'update_role', 'create_project')
 * @param {string} [params.entity_type] - Type of entity affected (e.g., 'profile', 'project', 'invoice')
 * @param {string} [params.entity_id] - ID of the entity affected
 * @param {Object} [params.details] - Additional details about the action (stored in metadata)
 * @param {Object} [params.oldData] - Previous state of the entity
 * @param {Object} [params.newData] - New state of the entity
 */
export async function logAuditEvent({ action, entity_type, entity_id, details = {}, oldData = null, newData = null }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('Audit log: No user session, skipping log');
      return;
    }

    // Get user role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const ipAddress = await getIpAddress();
    const geo = getCachedGeo();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        user_role: profile?.role || 'unknown',
        action,
        entity_type: entity_type || 'system',
        entity_id: entity_id || null,
        old_data: oldData,
        new_data: newData,
        metadata: {
          ...details,
          ...(geo ? { _geo: geo } : {}),
        },
        ip_address: ipAddress,
        user_agent: getUserAgent(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

// ============================================
// Diff utility
// ============================================

/**
 * Calculate diff between two objects
 * 
 * @param {Object} oldObj - Original object
 * @param {Object} newObj - New object
 * @returns {Object} Object with changes { field: { from: oldValue, to: newValue } }
 */
export function calculateDiff(oldObj, newObj) {
  const changes = {};
  
  const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
  
  for (const key of allKeys) {
    const oldVal = oldObj?.[key];
    const newVal = newObj?.[key];
    
    // Skip functions and undefined
    if (typeof oldVal === 'function' || typeof newVal === 'function') continue;
    
    // Check if values are different
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[key] = { from: oldVal, to: newVal };
    }
  }
  
  return changes;
}

// ============================================
// Specialized logging helpers
// ============================================

/**
 * Log authentication event
 */
export async function logAuthEvent(action, userId = null) {
  try {
    // Fetch user role if userId is available
    let userRole = null;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      userRole = profile?.role || 'unknown';
    }

    const ipAddress = await getIpAddress();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        user_role: userRole,
        action,
        entity_type: 'auth',
        metadata: {
          timestamp: new Date().toISOString(),
        },
        ip_address: ipAddress,
        user_agent: getUserAgent(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log auth event:', error);
    }
  } catch (err) {
    console.error('Auth log error:', err);
  }
}

/**
 * Log a failed login attempt (no user session available)
 */
export async function logFailedLogin(email) {
  try {
    // Use anon key insertion — the RLS policy allows inserts for authenticated,
    // but failed login has no session. We log it with null user_id.
    const ipAddress = await getIpAddress();

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: null,
        user_role: 'anonymous',
        action: 'failed_login',
        entity_type: 'auth',
        metadata: {
          email,
          timestamp: new Date().toISOString(),
        },
        ip_address: ipAddress,
        user_agent: getUserAgent(),
        created_at: new Date().toISOString(),
      });

    if (error) {
      // Silently fail — failed login log is best-effort
      console.warn('Failed to log failed login:', error);
    }
  } catch (err) {
    console.warn('Failed login log error:', err);
  }
}

/**
 * Log price configuration change
 */
export async function logPriceChange({ configId, configName, oldValue, newValue, oldDescription, newDescription }) {
  const oldData = { value: oldValue };
  const newData = { value: newValue };
  
  // Include description in diff if changed
  if (oldDescription !== newDescription) {
    oldData.description = oldDescription;
    newData.description = newDescription;
  }

  return logAuditEvent({
    action: 'update_price',
    entity_type: 'price_config',
    entity_id: configId,
    details: {
      config_name: configName,
    },
    oldData,
    newData,
  });
}

// ============================================
// Parent entity name helpers (for audit context)
// ============================================

/**
 * Fetch project name by ID (for use in audit log metadata)
 */
export async function fetchProjectName(projectId) {
  if (!projectId) return null;
  try {
    const { data } = await supabase
      .from('projects')
      .select('name')
      .eq('id', projectId)
      .single();
    return data?.name || null;
  } catch {
    return null;
  }
}

/**
 * Fetch client name by client_id (for use in audit log metadata)
 */
export async function fetchClientName(clientId) {
  if (!clientId) return null;
  try {
    const { data } = await supabase
      .from('clients')
      .select('user:profiles!user_id(full_name, email)')
      .eq('id', clientId)
      .single();
    return data?.user?.full_name || data?.user?.email || null;
  } catch {
    return null;
  }
}

/**
 * Enrich an array of audit log entries with missing parent names.
 * For logs with project_id but no project_name — batch-fetch project names.
 * For project entities without client_name — batch-fetch client names.
 */
export async function enrichLogsWithParentNames(logs) {
  if (!logs || logs.length === 0) return logs;

  // 1. Collect project_ids that need enrichment
  const projectIdsNeeded = new Set();
  const projectEntityIds = new Set();

  for (const log of logs) {
    const m = log.metadata;
    if (m?.project_id && !m.project_name && log.entity_type !== 'project') {
      projectIdsNeeded.add(m.project_id);
    }
    if (log.entity_type === 'project' && log.entity_id && !m?.client_name) {
      projectEntityIds.add(log.entity_id);
    }
  }

  // Batch-fetch project names
  let projectNamesMap = {};
  if (projectIdsNeeded.size > 0) {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', [...projectIdsNeeded]);
      if (data) {
        for (const p of data) projectNamesMap[p.id] = p.name;
      }
    } catch { /* ignore */ }
  }

  // Batch-fetch client names for project entities
  let projectClientMap = {};
  if (projectEntityIds.size > 0) {
    try {
      const { data } = await supabase
        .from('projects')
        .select('id, client:clients!client_id(user:profiles!user_id(full_name, email))')
        .in('id', [...projectEntityIds]);
      if (data) {
        for (const p of data) {
          const u = p.client?.user;
          projectClientMap[p.id] = u?.full_name || u?.email || null;
        }
      }
    } catch { /* ignore */ }
  }

  // Enrich
  return logs.map(log => {
    const m = log.metadata ? { ...log.metadata } : {};
    let changed = false;

    if (m.project_id && !m.project_name && log.entity_type !== 'project') {
      const name = projectNamesMap[m.project_id];
      if (name) { m.project_name = name; changed = true; }
    }

    if (log.entity_type === 'project' && log.entity_id && !m.client_name) {
      const cn = projectClientMap[log.entity_id];
      if (cn) { m.client_name = cn; changed = true; }
    }

    return changed ? { ...log, metadata: m } : log;
  });
}

/**
 * Log project event
 */
export async function logProjectEvent(action, projectId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'project',
    entity_id: projectId,
    details
  });
}

/**
 * Log specification event
 */
export async function logSpecificationEvent(action, specId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'specification',
    entity_id: specId,
    details
  });
}

/**
 * Log offer event
 */
export async function logOfferEvent(action, offerId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'offer',
    entity_id: offerId,
    details
  });
}

/**
 * Log invoice/payment event
 */
export async function logPaymentEvent(action, invoiceId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'invoice',
    entity_id: invoiceId,
    details
  });
}

/**
 * Log file-related action
 * 
 * @param {string} action - The action (e.g., 'upload_file', 'delete_file', 'download_file')
 * @param {string} fileId - The file/asset ID
 * @param {Object} [details] - Additional context (e.g., { fileName, fileSize, projectId })
 */
export async function logFileAction(action, fileId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'file',
    entity_id: fileId,
    details,
  });
}

/**
 * Log task event
 */
export async function logTaskEvent(action, taskId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'task',
    entity_id: taskId,
    details,
  });
}

/**
 * Log client event
 */
export async function logClientEvent(action, clientId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'client',
    entity_id: clientId,
    details,
  });
}

/**
 * Log promo code event
 */
export async function logPromoCodeEvent(action, promoId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'promo_code',
    entity_id: promoId,
    details,
  });
}

/**
 * Log crypto wallet event
 */
export async function logCryptoWalletEvent(action, walletId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'crypto_wallet',
    entity_id: walletId,
    details,
  });
}

/**
 * Log offer template event
 */
export async function logOfferTemplateEvent(action, templateId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'offer_template',
    entity_id: templateId,
    details,
  });
}

/**
 * Log settings change event
 */
export async function logSettingsEvent(action, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'settings',
    details,
  });
}

/**
 * Log comment event
 */
export async function logCommentEvent(action, commentId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'comment',
    entity_id: commentId,
    details,
  });
}

/**
 * Log approval event
 */
export async function logApprovalEvent(action, approvalId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'approval',
    entity_id: approvalId,
    details,
  });
}

/**
 * Log delivery event
 */
export async function logDeliveryEvent(action, deliveryId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'delivery',
    entity_id: deliveryId,
    details,
  });
}

/**
 * Log workflow stage event
 */
export async function logStageEvent(action, stageId, details = {}) {
  return logAuditEvent({
    action,
    entity_type: 'workflow_stage',
    entity_id: stageId,
    details,
  });
}
