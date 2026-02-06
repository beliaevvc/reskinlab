import { useState } from 'react';
import { AuditLogEntityModal } from './AuditLogEntityModal';

/**
 * Entity type labels
 */
const ENTITY_LABELS = {
  project: 'Project',
  offer: 'Offer',
  invoice: 'Invoice',
  specification: 'Specification',
  profile: 'Profile',
  price_config: 'Price Config',
  promo_code: 'Promo Code',
  crypto_wallet: 'Crypto Wallet',
  offer_template: 'Offer Template',
  task: 'Task',
  auth: 'Auth',
  system: 'System',
  navigation: 'Navigation',
  file: 'File',
  comment: 'Comment',
  approval: 'Approval',
  delivery: 'Delivery',
  workflow_stage: 'Stage',
  settings: 'Settings',
  client: 'Client',
  task_checklist: 'Checklist',
  task_auto_template: 'Auto Template',
  task_spec_item_template: 'Spec Template',
  notification: 'Notification',
  comment_reaction: 'Reaction',
};

/**
 * Entity types that support modal preview
 */
const MODAL_SUPPORTED = [
  'project', 'specification', 'offer', 'invoice', 'task',
  'client', 'profile', 'promo_code', 'price_config',
  'crypto_wallet', 'offer_template',
];

/**
 * AuditLogEntityLink — clickable link that opens a modal with entity details
 * For navigation (page_view) events, shows the specific page name
 * If entity was deleted, modal shows a "Deleted" state
 */
export function AuditLogEntityLink({ entityType, entityId, metadata }) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!entityType) return <span className="text-neutral-400">—</span>;

  // For page_view events, show the specific page name
  if (entityType === 'navigation' && metadata?.page) {
    return (
      <span className="text-sm text-neutral-500" title="Page view">
        <span className="text-neutral-400">📄</span> {metadata.page}
      </span>
    );
  }

  const label = ENTITY_LABELS[entityType] || entityType;
  const canOpenModal = MODAL_SUPPORTED.includes(entityType) && entityId;

  // Extract display name from metadata
  const m = metadata || {};
  const entityName = m.name || m.title || m.offer_number || m.code || m.company_name
    || m.filename || m.config_name
    || (m.currency && m.network ? `${m.currency} (${m.network})` : null)
    || (m.version ? (String(m.version).startsWith('v') ? m.version : `v${m.version}`) : null);

  const displayLabel = entityName ? `${label}: ${entityName}` : label;

  // Build parent context subtext
  const parentContext = getParentContext(entityType, m);

  if (canOpenModal) {
    return (
      <div className="flex flex-col">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
          className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline transition-colors text-left"
          title={`View ${label}: ${entityId}`}
        >
          {displayLabel}
        </button>
        {parentContext && (
          <span className="text-xs text-neutral-400 mt-0.5">{parentContext}</span>
        )}
        <AuditLogEntityModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          entityType={entityType}
          entityId={entityId}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <span className="text-sm text-neutral-500" title={entityId || undefined}>
        {displayLabel}
      </span>
      {parentContext && (
        <span className="text-xs text-neutral-400 mt-0.5">{parentContext}</span>
      )}
    </div>
  );
}

/**
 * Build parent context string for entity link subtext
 */
function getParentContext(entityType, metadata) {
  if (!metadata) return null;

  const parts = [];

  // For child entities — show project
  if (metadata.project_name && entityType !== 'project') {
    parts.push(`📁 ${metadata.project_name}`);
  }

  // For projects — show client
  if (metadata.client_name && entityType === 'project') {
    parts.push(`👤 ${metadata.client_name}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export default AuditLogEntityLink;
