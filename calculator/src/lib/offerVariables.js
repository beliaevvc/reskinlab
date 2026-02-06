import { supabase } from './supabase';

/**
 * Fetch all available variable definitions from the database
 */
export async function getAvailableVariables() {
  const { data, error } = await supabase
    .from('offer_variables')
    .select('*')
    .order('data_source')
    .order('label');

  if (error) throw error;
  return data || [];
}

/**
 * Resolve variable values from related database records
 * @param {Object} spec - Specification with totals_json, state_json
 * @param {Object} project - Project record
 * @param {Object} client - Client record with profile
 * @param {Array} variables - Variable definitions from offer_variables
 * @returns {Object} Map of variable key → resolved value
 */
export function resolveVariables(spec, project, client, variables) {
  const resolved = {};
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const totals = spec?.totals_json || {};
  const grandTotal = totals.grandTotal || 0;

  for (const variable of variables) {
    try {
      switch (variable.key) {
        // Client variables
        case 'client_name':
          resolved[variable.key] = client?.company_name || 'N/A';
          break;
        case 'client_contact':
          resolved[variable.key] = client?.profile?.full_name || client?.full_name || 'N/A';
          break;

        // Project variables
        case 'project_name':
          resolved[variable.key] = project?.name || 'N/A';
          break;

        // Specification variables
        case 'grand_total':
          resolved[variable.key] = formatCurrencyValue(grandTotal, variable.format_options);
          break;
        case 'spec_items':
          resolved[variable.key] = resolveSpecItems(spec);
          break;

        // Invoice variables
        case 'payment_schedule':
          resolved[variable.key] = 'See invoices for detailed payment schedule';
          break;

        // Manual variables
        case 'currency':
          resolved[variable.key] = variable.format_options?.default || 'USDT';
          break;
        case 'terms_version':
          resolved[variable.key] = variable.format_options?.default || '1.0';
          break;

        // Computed variables
        case 'valid_until':
          resolved[variable.key] = formatDateValue(validUntil, variable.format_options);
          break;
        case 'publish_date':
          resolved[variable.key] = formatDateValue(new Date(), variable.format_options);
          break;
        case 'prepayment_amount':
          resolved[variable.key] = formatCurrencyValue(grandTotal * 0.5, variable.format_options);
          break;
        case 'production_payment':
          resolved[variable.key] = formatCurrencyValue(grandTotal * 0.25, variable.format_options);
          break;
        case 'final_payment':
          resolved[variable.key] = formatCurrencyValue(grandTotal * 0.25, variable.format_options);
          break;

        default:
          // Try to resolve via data_path
          resolved[variable.key] = resolveByPath(variable, { spec, project, client });
          break;
      }
    } catch (e) {
      console.warn(`Failed to resolve variable ${variable.key}:`, e);
      resolved[variable.key] = `[${variable.label}]`;
    }
  }

  return resolved;
}

/**
 * Format a currency value
 */
function formatCurrencyValue(value, formatOptions) {
  const locale = formatOptions?.locale || 'en-US';
  const currency = formatOptions?.currency || 'USD';
  return `${Number(value).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/**
 * Format a date value
 */
function formatDateValue(date, formatOptions) {
  const locale = formatOptions?.locale || 'ru-RU';
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Resolve specification items into a readable format
 */
function resolveSpecItems(spec) {
  const stateJson = spec?.state_json;
  if (!stateJson) return 'No specification items';

  const items = [];
  if (stateJson.categories) {
    for (const category of Object.values(stateJson.categories)) {
      if (category.items) {
        for (const item of Object.values(category.items)) {
          if (item.quantity > 0) {
            items.push(`• ${item.name || item.label}: ${item.quantity} шт.`);
          }
        }
      }
    }
  }

  return items.length > 0 ? items.join('\n') : 'No specification items';
}

/**
 * Try to resolve a variable by its data_path
 */
function resolveByPath(variable, context) {
  if (!variable.data_path) return `[${variable.label}]`;

  const source = {
    client: context.client,
    project: context.project,
    specification: context.spec,
  }[variable.data_source];

  if (!source) return `[${variable.label}]`;

  const parts = variable.data_path.split('.');
  let value = source;
  for (const part of parts) {
    if (value == null) return `[${variable.label}]`;
    value = value[part];
  }

  if (value == null) return `[${variable.label}]`;

  switch (variable.value_type) {
    case 'currency':
      return formatCurrencyValue(value, variable.format_options);
    case 'date':
      return formatDateValue(new Date(value), variable.format_options);
    case 'number':
      return Number(value).toLocaleString(variable.format_options?.locale || 'en-US');
    default:
      return String(value);
  }
}

/**
 * Render template content text with resolved variables.
 * Replaces {{variable_key}} placeholders with actual values.
 * @param {string} text - Template text with {{variable}} placeholders
 * @param {Object} resolvedVars - Map of key → value
 * @returns {string} Rendered text
 */
export function renderTemplateContent(text, resolvedVars) {
  if (!text) return '';
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return resolvedVars[key] !== undefined ? resolvedVars[key] : match;
  });
}

/**
 * @deprecated Use renderTemplateContent instead. Kept for backward compat.
 */
export function renderTemplateBlocks(blocks, resolvedVars) {
  const parts = [];
  for (const block of blocks) {
    const text = block.content?.text || '';
    if (block.block_type === 'separator') {
      parts.push('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      continue;
    }
    const rendered = text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return resolvedVars[key] !== undefined ? resolvedVars[key] : match;
    });
    parts.push(rendered);
  }
  return parts.join('\n\n');
}

/**
 * Get the template for a specific client/project, falling back to the active global template
 * @param {string} clientId - Client profile ID
 * @param {string} projectId - Project ID (optional)
 * @returns {Object|null} Template with content
 */
export async function getTemplateForClient(clientId, projectId) {
  // 1. Check for client+project specific assignment
  if (projectId) {
    const { data: projectAssignment } = await supabase
      .from('client_offer_assignments')
      .select('template_id')
      .eq('client_id', clientId)
      .eq('project_id', projectId)
      .single();

    if (projectAssignment) {
      return fetchTemplate(projectAssignment.template_id);
    }
  }

  // 2. Check for client-level assignment (no project)
  const { data: clientAssignment } = await supabase
    .from('client_offer_assignments')
    .select('template_id')
    .eq('client_id', clientId)
    .is('project_id', null)
    .single();

  if (clientAssignment) {
    return fetchTemplate(clientAssignment.template_id);
  }

  // 3. Fall back to global active template (only if audience_type is 'all')
  const { data: activeTemplate, error } = await supabase
    .from('offer_templates')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error || !activeTemplate) return null;

  // If active template is restricted to specific users, don't serve it to unassigned clients
  if (activeTemplate.audience_type === 'specific') {
    // Check if this client is actually assigned to this template
    const { data: isAssigned } = await supabase
      .from('client_offer_assignments')
      .select('id')
      .eq('client_id', clientId)
      .eq('template_id', activeTemplate.id)
      .limit(1);

    if (!isAssigned || isAssigned.length === 0) {
      // Client not assigned — try to find any 'all' template as fallback
      const { data: fallback } = await supabase
        .from('offer_templates')
        .select('*')
        .eq('audience_type', 'all')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (fallback && fallback.length > 0) {
        return ensureContent(fallback[0]);
      }
      return null;
    }
  }

  return ensureContent(activeTemplate);
}

/**
 * Fetch a template by ID
 */
async function fetchTemplate(templateId) {
  const { data, error } = await supabase
    .from('offer_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error) return null;
  return ensureContent(data);
}

/**
 * Backward compat: if content is empty, try to build it from legacy blocks
 */
async function ensureContent(template) {
  if (!template) return null;

  const hasContent = template.content?.text && template.content.text.trim().length > 0;
  if (hasContent) return template;

  try {
    const { data: blocks } = await supabase
      .from('offer_template_blocks')
      .select('content, sort_order')
      .eq('template_id', template.id)
      .order('sort_order');

    if (!blocks?.length) return template;

    const text = blocks
      .map((b) => b.content?.text || '')
      .filter(Boolean)
      .join('\n\n');

    if (text) {
      template.content = { text };
    }
  } catch (e) {
    console.warn('Failed to migrate blocks:', e);
  }

  return template;
}
