import { supabase } from './supabase';

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
        metadata: details,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Failed to log audit event:', error);
    }
  } catch (err) {
    console.error('Audit log error:', err);
  }
}

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

/**
 * Log authentication event
 */
export async function logAuthEvent(action, userId = null) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        entity_type: 'auth',
        metadata: {
          timestamp: new Date().toISOString(),
        },
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
