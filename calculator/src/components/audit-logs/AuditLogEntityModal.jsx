import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatDateTime, formatCurrency } from '../../lib/utils';

/**
 * Entity fetchers — each returns the entity data or null
 */
const ENTITY_FETCHERS = {
  project: async (id) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, client:clients(company_name), am:profiles!am_id(full_name, email)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  specification: async (id) => {
    const { data, error } = await supabase
      .from('specifications')
      .select('*, project:projects(name)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  offer: async (id) => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, specification:specifications(project:projects(name))')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  invoice: async (id) => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, project:projects(name)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  task: async (id) => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, project:projects(name), assignee:profiles!assignee_id(full_name)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  client: async (id) => {
    const { data, error } = await supabase
      .from('clients')
      .select('*, user:profiles!user_id(full_name, email)')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  profile: async (id) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  promo_code: async (id) => {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  price_config: async (id) => {
    const { data, error } = await supabase
      .from('price_configs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  crypto_wallet: async (id) => {
    const { data, error } = await supabase
      .from('crypto_wallets')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
  offer_template: async (id) => {
    const { data, error } = await supabase
      .from('offer_templates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
};

/**
 * Entity type display config
 */
const ENTITY_TITLES = {
  project: 'Project',
  specification: 'Specification',
  offer: 'Offer',
  invoice: 'Invoice',
  task: 'Task',
  client: 'Client',
  profile: 'User Profile',
  promo_code: 'Promo Code',
  price_config: 'Price Config',
  crypto_wallet: 'Crypto Wallet',
  offer_template: 'Offer Template',
};

/**
 * Render entity details based on type
 */
function EntityDetails({ entityType, data }) {
  const fields = getEntityFields(entityType, data);

  return (
    <div className="space-y-3">
      {fields.map(({ label, value }) => (
        <div key={label} className="flex justify-between items-start gap-4 py-1.5 border-b border-neutral-100 last:border-0">
          <span className="text-sm text-neutral-500 shrink-0">{label}</span>
          <span className="text-sm text-neutral-900 text-right break-all">{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}

function getEntityFields(type, d) {
  switch (type) {
    case 'project':
      return [
        { label: 'Name', value: d.name },
        { label: 'Status', value: d.status },
        { label: 'Client', value: d.client?.company_name },
        { label: 'Account Manager', value: d.am?.full_name },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    case 'specification':
      return [
        { label: 'Project', value: d.project?.name },
        { label: 'Version', value: d.version },
        { label: 'Status', value: d.status },
        { label: 'Total', value: d.totals_json?.grandTotal ? formatCurrency(d.totals_json.grandTotal) : '—' },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    case 'offer':
      return [
        { label: 'Offer #', value: d.offer_number },
        { label: 'Project', value: d.specification?.project?.name },
        { label: 'Status', value: d.status },
        { label: 'Total', value: d.total ? formatCurrency(d.total) : '—' },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    case 'invoice':
      return [
        { label: 'Invoice #', value: d.invoice_number },
        { label: 'Project', value: d.project?.name },
        { label: 'Status', value: d.status },
        { label: 'Amount', value: d.amount ? formatCurrency(d.amount, d.currency) : '—' },
        { label: 'Due Date', value: d.due_date ? formatDateTime(d.due_date) : '—' },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    case 'task':
      return [
        { label: 'Title', value: d.title },
        { label: 'Project', value: d.project?.name },
        { label: 'Status', value: d.status },
        { label: 'Priority', value: d.priority },
        { label: 'Assignee', value: d.assignee?.full_name },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    case 'client':
      return [
        { label: 'Company', value: d.company_name },
        { label: 'Contact', value: d.contact_name },
        { label: 'Phone', value: d.contact_phone },
        { label: 'User', value: d.user?.full_name || d.user?.email },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    case 'profile':
      return [
        { label: 'Name', value: d.full_name },
        { label: 'Email', value: d.email },
        { label: 'Role', value: d.role },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    case 'promo_code':
      return [
        { label: 'Code', value: d.code },
        { label: 'Type', value: d.type },
        { label: 'Value', value: d.value },
        { label: 'Active', value: d.is_active ? 'Yes' : 'No' },
        { label: 'Uses', value: `${d.times_used || 0} / ${d.max_uses || '∞'}` },
        { label: 'Expires', value: d.expires_at ? formatDateTime(d.expires_at) : 'Never' },
        { label: 'ID', value: d.id },
      ];
    case 'price_config':
      return [
        { label: 'Name', value: d.name },
        { label: 'Category', value: d.category },
        { label: 'Value', value: d.value },
        { label: 'Description', value: d.description },
        { label: 'ID', value: d.id },
      ];
    case 'crypto_wallet':
      return [
        { label: 'Currency', value: d.currency },
        { label: 'Network', value: d.network },
        { label: 'Address', value: d.address },
        { label: 'Label', value: d.label },
        { label: 'Active', value: d.is_active ? 'Yes' : 'No' },
        { label: 'ID', value: d.id },
      ];
    case 'offer_template':
      return [
        { label: 'Name', value: d.name },
        { label: 'Description', value: d.description },
        { label: 'Active', value: d.is_active ? 'Yes' : 'No' },
        { label: 'Created', value: formatDateTime(d.created_at) },
        { label: 'ID', value: d.id },
      ];
    default:
      return Object.entries(d).filter(([k]) => !['created_at', 'updated_at'].includes(k)).map(([k, v]) => ({
        label: k,
        value: typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''),
      }));
  }
}

/**
 * AuditLogEntityModal — universal modal for viewing entity details from audit logs
 */
export function AuditLogEntityModal({ isOpen, onClose, entityType, entityId }) {
  const fetcher = ENTITY_FETCHERS[entityType];
  const title = ENTITY_TITLES[entityType] || entityType;

  const { data: entity, isLoading, isError } = useQuery({
    queryKey: ['audit-entity-preview', entityType, entityId],
    queryFn: () => fetcher(entityId),
    enabled: isOpen && !!fetcher && !!entityId,
    staleTime: 30000,
  });

  if (!isOpen) return null;

  const isDeleted = !isLoading && (entity === null || entity === undefined || isError);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">{entityId}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : isDeleted ? (
            <div className="text-center py-10">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1">Deleted</h3>
              <p className="text-sm text-neutral-500">
                This {title.toLowerCase()} has been deleted and is no longer available.
              </p>
              <p className="text-xs text-neutral-400 font-mono mt-3">{entityId}</p>
            </div>
          ) : (
            <EntityDetails entityType={entityType} data={entity} />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AuditLogEntityModal;
