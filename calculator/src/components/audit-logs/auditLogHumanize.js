/**
 * Human-readable descriptions and icons for audit log actions
 */

const ACTION_DESCRIPTIONS = {
  // Auth
  login: 'Logged in',
  logout: 'Logged out',
  failed_login: 'Failed login attempt',
  register: 'Registered account',

  // Projects
  create_project: 'Created project',
  update_project: 'Updated project',
  delete_project: 'Deleted project',

  // Specifications
  create_specification: 'Created specification',
  finalize_specification: 'Finalized specification',
  delete_specification: 'Deleted specification',
  update_specification: 'Updated specification',

  // Offers
  create_offer: 'Created offer',
  accept_offer: 'Accepted offer',
  reject_offer: 'Rejected offer',
  send_offer: 'Sent offer',

  // Invoices
  create_invoice: 'Created invoice',
  pay_invoice: 'Paid invoice',
  confirm_payment: 'Confirmed payment',

  // Users / Roles
  update_role: 'Changed user role',
  update_profile: 'Updated profile',

  // Pricing
  update_price: 'Updated pricing',
  create_price_config: 'Created pricing config',
  delete_price_config: 'Deleted pricing config',

  // Files
  upload_file: 'Uploaded file',
  delete_file: 'Deleted file',
  download_file: 'Downloaded file',

  // Tasks
  create_task: 'Created task',
  update_task: 'Updated task',
  delete_task: 'Deleted task',
  complete_task: 'Completed task',

  // Comments
  add_comment: 'Added comment',
  update_comment: 'Updated comment',
  delete_comment: 'Deleted comment',

  // Promo codes
  create_promo_code: 'Created promo code',
  update_promo_code: 'Updated promo code',
  delete_promo_code: 'Deleted promo code',
  toggle_promo_code: 'Toggled promo code',

  // Crypto wallets
  create_crypto_wallet: 'Created wallet',
  update_crypto_wallet: 'Updated wallet',
  delete_crypto_wallet: 'Deleted wallet',
  toggle_crypto_wallet: 'Toggled wallet',

  // Templates
  create_offer_template: 'Created template',
  update_offer_template: 'Updated template',
  delete_offer_template: 'Deleted template',
  activate_offer_template: 'Activated template',
  duplicate_offer_template: 'Duplicated template',

  // Settings
  update_settings: 'Updated settings',

  // Navigation
  page_view: 'Viewed page',

  // Generic
  create: 'Created',
  update: 'Updated',
  delete: 'Deleted',
};

const ACTION_ICONS = {
  login: '🔑',
  logout: '🚪',
  failed_login: '⚠️',
  register: '👤',
  create: '➕',
  update: '✏️',
  delete: '🗑️',
  accept: '✅',
  reject: '❌',
  finalize: '📋',
  send: '📤',
  pay: '💳',
  confirm: '💰',
  upload: '📎',
  download: '📥',
  complete: '☑️',
  toggle: '🔄',
  activate: '⚡',
  duplicate: '📑',
  page_view: '👁️',
  add_comment: '💬',
  update_comment: '💬',
  delete_comment: '💬',
};

const ENTITY_LABELS = {
  project: 'project',
  specification: 'specification',
  offer: 'offer',
  invoice: 'invoice',
  profile: 'user',
  auth: '',
  navigation: '',
  system: '',
  price_config: 'pricing',
  promo_code: 'promo code',
  crypto_wallet: 'wallet',
  offer_template: 'template',
  task: 'task',
  file: 'file',
  comment: 'comment',
  settings: 'settings',
  approval: 'approval',
  delivery: 'delivery',
  workflow_stage: 'stage',
  client: 'client',
};

/**
 * Get a human-readable description for an audit log entry
 */
export function getHumanDescription(log) {
  // Try exact match
  let desc = ACTION_DESCRIPTIONS[log.action];

  if (!desc) {
    // Fallback: humanize action string
    desc = log.action?.replace(/_/g, ' ') || 'Action';
    // Capitalize first letter
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  // Append entity name from metadata — check all common fields
  const m = log.metadata;
  const entityName = m?.name
    || m?.title
    || m?.offer_number
    || m?.code
    || m?.company_name
    || m?.filename
    || m?.config_name
    || (m?.currency && m?.network ? `${m.currency} (${m.network})` : null)
    || (m?.version ? (String(m.version).startsWith('v') ? m.version : `v${m.version}`) : null);

  if (entityName) {
    desc = `${desc} "${entityName}"`;
  } else {
    // Append entity type label if meaningful
    const entityLabel = ENTITY_LABELS[log.entity_type];
    if (entityLabel && !desc.toLowerCase().includes(entityLabel)) {
      desc = `${desc} ${entityLabel}`;
    }
  }

  // Append parent context (project, client)
  const context = getParentContext(log);
  if (context) {
    desc = `${desc} → ${context}`;
  }

  return desc;
}

/**
 * Build parent context string from metadata
 * e.g. "проект «My Game»" or "проект «My Game» · клиент «Studio X»"
 */
function getParentContext(log) {
  const m = log.metadata;
  if (!m) return null;

  const parts = [];

  // Show project context for child entities (not for projects themselves)
  if (m.project_name && log.entity_type !== 'project') {
    parts.push(`проект «${m.project_name}»`);
  }

  // Show client context for projects
  if (m.client_name && log.entity_type === 'project') {
    parts.push(`клиент «${m.client_name}»`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Get an icon for an audit log action
 */
export function getActionIcon(action) {
  // Try exact match first
  if (ACTION_ICONS[action]) return ACTION_ICONS[action];
  // Try partial match
  const key = Object.keys(ACTION_ICONS).find(k => action?.toLowerCase().includes(k));
  return ACTION_ICONS[key] || '📝';
}
