import { useState, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { formatDate, formatCurrency } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useProjectLinks, useCreateProjectLink, useUpdateProjectLink, useDeleteProjectLink, useReorderProjectLinks, detectServiceType, SERVICE_CONFIG } from '../../hooks/useProjectLinks';
import { Select } from '../Select';

// Service type options for the Select dropdown
const SERVICE_TYPE_OPTIONS = [
  { value: 'figma', label: 'Figma' },
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'dropbox', label: 'Dropbox' },
  { value: 'google_drive', label: 'Google Drive' },
  { value: 'notion', label: 'Notion' },
  { value: 'miro', label: 'Miro' },
  { value: 'custom', label: 'Custom Link' },
];

export function ProjectSidebar({
  project,
  specifications = [],
  isCollapsed,
  onToggleCollapse,
  onSpecClick,
  onOfferClick,
  onInvoiceClick,
  onNewSpecification,
}) {
  const { t } = useTranslation('projects');
  const [activeTab, setActiveTab] = useState('specs');
  const { isAdmin, isAM } = useAuth();
  const isStaff = isAdmin || isAM;
  
  const TABS = [
    { id: 'specs', label: t('card.specs') },
    { id: 'offers', label: t('card.offers') },
    { id: 'invoices', label: t('card.invoices') },
    { id: 'resources', label: t('detail.files', { defaultValue: 'Resources' }) },
  ];

  // Resources data
  const { data: resources = [] } = useProjectLinks(project?.id);

  // Derive offers and invoices from specifications
  const offers = useMemo(() => 
    specifications
      .filter(s => s.offer)
      .map(s => ({ 
        ...s.offer, 
        specNumber: s.number || `v${s.version_number || s.version || 1}`,
      })),
    [specifications]
  );

  const invoices = useMemo(() => 
    specifications
      .flatMap(s => (s.offer?.invoices || []).map(inv => ({
        ...inv,
        specNumber: s.number || `v${s.version_number || s.version || 1}`,
        offerNumber: s.offer?.number,
        offerStatus: s.offer?.status,
      }))),
    [specifications]
  );

  // Counts for tab badges
  const counts = {
    specs: specifications.length,
    offers: offers.length,
    invoices: invoices.length,
    resources: resources.length,
  };

  return (
    <>
      {/* Toggle button -- always visible at the edge */}
      <button
        onClick={onToggleCollapse}
        className={`
          hidden md:flex fixed z-30 top-1/2 -translate-y-1/2 items-center justify-center
          w-5 h-10 bg-white border border-neutral-200 shadow-sm rounded-l-md
          text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all
          ${isCollapsed ? 'right-0' : 'right-[280px]'}
        `}
        title={isCollapsed ? t('common:openPanel', { defaultValue: 'Open panel' }) : t('common:closePanel', { defaultValue: 'Close panel' })}
      >
        <svg className={`w-3 h-3 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Sidebar panel */}
      <div className={`
        hidden md:flex flex-col flex-shrink-0 bg-white border-l border-neutral-200 h-full
        transition-all duration-300 ease-in-out overflow-hidden
        ${isCollapsed ? 'w-0 border-l-0' : 'w-[280px]'}
      `}>
        {/* Tab navigation — scrollable */}
        <div className="flex border-b border-neutral-100 px-2 pt-2 flex-shrink-0 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id
                  ? 'text-neutral-900 bg-neutral-50 border-b-2 border-emerald-500'
                  : 'text-neutral-400 hover:text-neutral-600'
                }
              `}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`px-1.5 py-0 rounded-full text-[10px] tabular-nums ${
                  activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* Specs tab */}
          {activeTab === 'specs' && (
            <div className="p-3 space-y-2">
              {onNewSpecification && (
                <button
                  onClick={onNewSpecification}
                  className="w-full py-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors font-medium"
                >
                  + {t('detail.specifications', { defaultValue: 'New Specification' })}
                </button>
              )}
              {specifications.length === 0 ? (
                <EmptyState
                  icon="document"
                  text={t('empty.noSpecs', { defaultValue: 'No specifications yet' })}
                />
              ) : (
                specifications.map((spec) => (
                  <SpecCard
                    key={spec.id}
                    specification={spec}
                    onSpecClick={onSpecClick}
                    onOfferClick={onOfferClick}
                  />
                ))
              )}
            </div>
          )}

          {/* Offers tab */}
          {activeTab === 'offers' && (
            <div className="p-3 space-y-2">
              {offers.length === 0 ? (
                <EmptyState icon="offer" text={t('empty.noOffers', { defaultValue: 'No offers yet' })} />
              ) : (
                offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} onOfferClick={onOfferClick} />
                ))
              )}
            </div>
          )}

          {/* Invoices tab */}
          {activeTab === 'invoices' && (
            <div className="p-3 space-y-2">
              {invoices.length === 0 ? (
                <EmptyState icon="invoice" text={t('empty.noInvoices', { defaultValue: 'No invoices yet' })} />
              ) : (
                invoices.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} onInvoiceClick={onInvoiceClick} />
                ))
              )}
            </div>
          )}

          {/* Resources tab */}
          {activeTab === 'resources' && (
            <ResourcesTab
              projectId={project?.id}
              resources={resources}
              isStaff={isStaff}
            />
          )}
        </div>
      </div>

      {/* Mobile: Bottom sheet trigger */}
      <MobilePanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        specifications={specifications}
        offers={offers}
        invoices={invoices}
        resources={resources}
        counts={counts}
        onSpecClick={onSpecClick}
        onOfferClick={onOfferClick}
        onInvoiceClick={onInvoiceClick}
        onNewSpecification={onNewSpecification}
        projectId={project?.id}
        isStaff={isStaff}
      />
    </>
  );
}

// --- Resources Tab ---

function ResourcesTab({ projectId, resources, isStaff }) {
  const { t } = useTranslation('projects');
  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [deletingLink, setDeletingLink] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [dropIndex, setDropIndex] = useState(null);

  const reorderLinks = useReorderProjectLinks();
  const deleteLink = useDeleteProjectLink();

  const handleEdit = (link) => {
    setEditingLink(link);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingLink(null);
    setShowModal(true);
  };

  const handleConfirmDelete = () => {
    if (deletingLink) {
      deleteLink.mutate({ linkId: deletingLink.id, projectId });
      setDeletingLink(null);
    }
  };

  // DnD handlers
  const handleDragStart = useCallback((e, linkId) => {
    setDraggedId(linkId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    setDropIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedId !== null && dropIndex !== null) {
      const currentIndex = resources.findIndex(r => r.id === draggedId);
      if (currentIndex !== -1 && currentIndex !== dropIndex) {
        const newOrder = [...resources];
        const [moved] = newOrder.splice(currentIndex, 1);
        newOrder.splice(dropIndex > currentIndex ? dropIndex - 1 : dropIndex, 0, moved);
        reorderLinks.mutate({
          projectId,
          orderedIds: newOrder.map(r => r.id),
        });
      }
    }
    setDraggedId(null);
    setDropIndex(null);
  }, [draggedId, dropIndex, resources, projectId, reorderLinks]);

  return (
    <div className="p-3 space-y-2">
      {isStaff && (
        <button
          onClick={handleAdd}
          className="w-full py-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors font-medium"
        >
          + {t('resources.add', { defaultValue: 'Add Resource' })}
        </button>
      )}

      {resources.length === 0 ? (
        <ResourcesEmptyState isStaff={isStaff} onAdd={handleAdd} />
      ) : (
        resources.map((link, index) => (
          <div key={link.id}>
            {/* Drop indicator */}
            {draggedId && dropIndex === index && draggedId !== link.id && (
              <div className="h-0.5 bg-emerald-500 rounded-full mx-1 mb-1" />
            )}
            <ResourceCard
              link={link}
              isStaff={isStaff}
              onEdit={() => handleEdit(link)}
              onDelete={() => setDeletingLink(link)}
              isDragging={draggedId === link.id}
              onDragStart={(e) => handleDragStart(e, link.id)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              draggable={isStaff}
            />
          </div>
        ))
      )}

      {/* Drop indicator at the end */}
      {draggedId && dropIndex === resources.length && (
        <div className="h-0.5 bg-emerald-500 rounded-full mx-1" />
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <ResourceModal
          projectId={projectId}
          link={editingLink}
          onClose={() => { setShowModal(false); setEditingLink(null); }}
        />
      )}

      {/* Delete confirmation */}
      {deletingLink && (
        <DeleteConfirmModal
          title={t('resources.remove', { defaultValue: 'Remove Resource' })}
          message={t('resources.removeConfirm', { name: deletingLink.title, defaultValue: `Are you sure you want to remove "${deletingLink.title}"?` })}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingLink(null)}
          isLoading={deleteLink.isPending}
        />
      )}
    </div>
  );
}

// --- ResourceCard ---

function ServiceIcon({ type, url, size = 20 }) {
  const config = SERVICE_CONFIG[type] || SERVICE_CONFIG.custom;

  // For custom type, try to show favicon
  if (type === 'custom' && url) {
    try {
      const domain = new URL(url).hostname;
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          width={size}
          height={size}
          className="rounded-sm flex-shrink-0"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    } catch {
      // fall through to default icon
    }
  }

  // SVG icons per service
  const iconPaths = {
    figma: (
      <svg width={size} height={size} viewBox="0 0 38 57" className="flex-shrink-0">
        <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
        <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
        <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
        <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
        <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
      </svg>
    ),
    github: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color} className="flex-shrink-0">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.11.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    gitlab: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color} className="flex-shrink-0">
        <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 01-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 014.82 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0118.6 2a.43.43 0 01.58 0 .42.42 0 01.11.18l2.44 7.51L23 13.45a.84.84 0 01-.35.94z" />
      </svg>
    ),
    dropbox: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color} className="flex-shrink-0">
        <path d="M6 2l6 3.75L6 9.5 0 5.75 6 2zm12 0l6 3.75-6 3.75-6-3.75L18 2zM0 13.25L6 9.5l6 3.75L6 17 0 13.25zm18-3.75l6 3.75L18 17l-6-3.75L18 9.5zM6 18.25l6-3.75 6 3.75L12 22l-6-3.75z" />
      </svg>
    ),
    google_drive: (
      <svg width={size} height={size} viewBox="0 0 24 24" className="flex-shrink-0">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
    ),
    notion: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color} className="flex-shrink-0">
        <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.19 2.168c-.42-.326-.98-.7-2.055-.607L3.01 2.61c-.466.046-.56.28-.373.466l1.822 1.132zm.793 3.172v13.864c0 .746.373 1.026 1.213.98l14.523-.84c.84-.046.932-.56.932-1.166V6.354c0-.606-.233-.932-.746-.886l-15.176.886c-.56.046-.746.326-.746.886v.14zm14.337.42c.093.42 0 .84-.42.886l-.7.14v10.264c-.607.326-1.166.513-1.633.513-.746 0-.932-.233-1.492-.932l-4.573-7.186v6.953l1.446.327s0 .84-1.166.84l-3.218.187c-.093-.187 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.093-.42.14-1.026.793-1.073l3.451-.233 4.76 7.28v-6.44l-1.213-.14c-.093-.513.28-.886.746-.932l3.218-.187.014-.006z" />
      </svg>
    ),
    miro: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill={config.color} className="flex-shrink-0">
        <path d="M17.392 0H13.9l4.462 7.56L12.669 0H9.177l5.761 10.167L8.31 0H4.816l7.072 13.607L4.2 0H.708l8.447 17.975L.708 24h3.492l6.617-10.167L4.816 24h3.493l5.693-13.607L8.31 24h3.492l5.694-7.56L13.9 24h3.492L24 6.025 17.392 0z" />
      </svg>
    ),
    custom: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={config.color} strokeWidth={1.5} className="flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  };

  if (type === 'custom' && url) {
    return (
      <span className="flex-shrink-0">
        <img
          src={`https://www.google.com/s2/favicons?domain=${(() => { try { return new URL(url).hostname; } catch { return ''; } })()}&sz=32`}
          alt=""
          width={size}
          height={size}
          className="rounded-sm"
          onError={(e) => {
            e.target.style.display = 'none';
            if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = '';
          }}
        />
        <span style={{ display: 'none' }}>{iconPaths.custom}</span>
      </span>
    );
  }

  return iconPaths[type] || iconPaths.custom;
}

function ResourceCard({ link, isStaff, onEdit, onDelete, isDragging, onDragStart, onDragOver, onDragEnd, draggable }) {
  const { t } = useTranslation('projects');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const shortUrl = (() => {
    try {
      const u = new URL(link.url);
      return u.hostname + (u.pathname !== '/' ? u.pathname.substring(0, 30) : '');
    } catch {
      return link.url?.substring(0, 40);
    }
  })();

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`
        group relative border border-neutral-100 rounded-lg transition-all
        ${isDragging ? 'opacity-50 shadow-lg border-emerald-300' : 'hover:border-neutral-200 hover:bg-neutral-50/50'}
        ${draggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      <button
        onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
        className="w-full p-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          {/* Drag handle (visible on hover for staff) */}
          {isStaff && (
            <span className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0 text-neutral-400">
              <svg width={10} height={10} viewBox="0 0 10 10" fill="currentColor">
                <circle cx="3" cy="2" r="1" /><circle cx="7" cy="2" r="1" />
                <circle cx="3" cy="5" r="1" /><circle cx="7" cy="5" r="1" />
                <circle cx="3" cy="8" r="1" /><circle cx="7" cy="8" r="1" />
              </svg>
            </span>
          )}
          <ServiceIcon type={link.type} url={link.url} size={18} />
          <span className="text-xs font-medium text-neutral-700 truncate flex-1">{link.title}</span>

          {/* Actions menu */}
          {isStaff && (
            <span
              ref={menuRef}
              className="relative flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setMenuOpen(!menuOpen); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors"
                    >
                      {t('common:edit', { defaultValue: 'Edit' })}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {t('common:remove', { defaultValue: 'Remove' })}
                    </button>
                  </div>
                </>
              )}
            </span>
          )}
        </div>

        {link.description && (
          <p className="mt-1 text-[10px] text-neutral-400 truncate pl-0"
             style={{ paddingLeft: isStaff ? '26px' : '26px' }}
          >
            {link.description}
          </p>
        )}
        <p className="mt-0.5 text-[10px] text-neutral-300 truncate"
           style={{ paddingLeft: isStaff ? '26px' : '26px' }}
        >
          {shortUrl}
        </p>
      </button>
    </div>
  );
}

// --- ResourceModal ---

function ResourceModal({ projectId, link, onClose }) {
  const { t } = useTranslation('projects');
  const isEditing = !!link;
  const createLink = useCreateProjectLink();
  const updateLink = useUpdateProjectLink();

  const [url, setUrl] = useState(link?.url || '');
  const [type, setType] = useState(link?.type || 'custom');
  const [title, setTitle] = useState(link?.title || '');
  const [description, setDescription] = useState(link?.description || '');
  const [autoDetected, setAutoDetected] = useState(false);

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    if (!isEditing || !autoDetected) {
      const detected = detectServiceType(newUrl);
      if (detected !== 'custom') {
        setType(detected);
        if (!title || autoDetected) {
          setTitle(SERVICE_CONFIG[detected]?.label || '');
          setAutoDetected(true);
        }
      }
    }
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    if (!title || autoDetected) {
      setTitle(SERVICE_CONFIG[newType]?.label || '');
      setAutoDetected(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || !title.trim()) return;

    try {
      if (isEditing) {
        await updateLink.mutateAsync({
          linkId: link.id,
          updates: { type, title: title.trim(), url: url.trim(), description: description.trim() || null },
        });
      } else {
        await createLink.mutateAsync({
          projectId,
          type,
          title: title.trim(),
          url: url.trim(),
          description: description.trim() || null,
        });
      }
      onClose();
    } catch (err) {
      console.error('Failed to save resource:', err);
    }
  };

  const isSaving = createLink.isPending || updateLink.isPending;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">
          {isEditing ? t('resources.edit', { defaultValue: 'Edit Resource' }) : t('resources.add', { defaultValue: 'Add Resource' })}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">{t('resources.url', { defaultValue: 'URL' })}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onPaste={(e) => {
                setTimeout(() => handleUrlChange(e.target.value), 0);
              }}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
              autoFocus
            />
          </div>

          {/* Service type */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">{t('resources.service', { defaultValue: 'Service' })}</label>
            <Select
              value={type}
              onChange={handleTypeChange}
              options={SERVICE_TYPE_OPTIONS}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">{t('resources.title', { defaultValue: 'Title' })}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setAutoDetected(false); }}
              placeholder={t('resources.titlePlaceholder', { defaultValue: 'Resource name' })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {t('create.description')} <span className="text-neutral-400 font-normal">({t('create.optional')})</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('resources.descPlaceholder', { defaultValue: 'Brief description' })}
              className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving || !url.trim() || !title.trim()}
              className="px-4 py-2 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? t('common:saving', { defaultValue: 'Saving...' }) : isEditing ? t('common:save', { defaultValue: 'Save' }) : t('common:add', { defaultValue: 'Add' })}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// --- Delete Confirm Modal ---

function DeleteConfirmModal({ title, message, onConfirm, onCancel, isLoading }) {
  const { t } = useTranslation('projects');
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
            <p className="mt-1 text-xs text-neutral-500">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded-md transition-colors"
          >
            {t('actions.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"
          >
            {isLoading ? t('common:removing', { defaultValue: 'Removing...' }) : t('common:remove', { defaultValue: 'Remove' })}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// --- Resources Empty State ---

function ResourcesEmptyState({ isStaff, onAdd }) {
  const { t } = useTranslation('projects');
  return (
    <div className="flex flex-col items-center py-8 text-neutral-300">
      <div className="flex items-center gap-2 mb-3">
        {['figma', 'github', 'dropbox', 'notion'].map((svc) => (
          <span key={svc} className="opacity-30">
            <ServiceIcon type={svc} size={16} />
          </span>
        ))}
      </div>
      <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <span className="text-xs">{t('empty.noResources', { defaultValue: 'No resources yet' })}</span>
      {isStaff && (
        <button
          onClick={onAdd}
          className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          + {t('resources.add', { defaultValue: 'Add Resource' })}
        </button>
      )}
    </div>
  );
}

// --- Sub-components (existing) ---

function EmptyState({ icon, text, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center py-8 text-neutral-300">
      <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        {icon === 'document' && (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        )}
        {icon === 'offer' && (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        )}
        {icon === 'invoice' && (
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        )}
      </svg>
      <span className="text-xs">{text}</span>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SpecCard({ specification, onSpecClick, onOfferClick }) {
  const isFinalized = specification.status === 'finalized';
  const hasOffer = specification.offer;

  return (
    <div className="border border-neutral-100 rounded-lg overflow-hidden hover:border-neutral-200 transition-colors">
      <button
        onClick={() => onSpecClick?.(specification)}
        className="w-full p-2.5 text-left hover:bg-neutral-50/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-700">
              {specification.number || `v${specification.version_number || specification.version || 1}`}
            </span>
            {specification.is_addon && (
              <span className="px-1 py-0 bg-purple-50 text-purple-600 text-[10px] font-medium rounded">
                Add-on
              </span>
            )}
          </div>
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
            isFinalized 
              ? 'bg-emerald-50 text-emerald-600' 
              : 'bg-neutral-100 text-neutral-500'
          }`}>
            {isFinalized ? 'Final' : 'Draft'}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-sm font-semibold text-neutral-900">
            {formatCurrency(specification.totals_json?.grandTotal || 0)}
          </span>
          <span className="text-[10px] text-neutral-400">
            {formatDate(specification.updated_at || specification.created_at)}
          </span>
        </div>
      </button>

      {/* Linked offer */}
      {hasOffer && (
        <button
          onClick={() => onOfferClick?.(specification.offer)}
          className="w-full px-2.5 py-1.5 border-t border-neutral-100 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
        >
          <span className="text-[11px] text-emerald-600 font-medium">Offer</span>
          <OfferStatusBadge status={specification.offer.status} />
        </button>
      )}
    </div>
  );
}

function OfferCard({ offer, onOfferClick }) {
  return (
    <button
      onClick={() => onOfferClick?.(offer)}
      className="w-full p-2.5 border border-neutral-100 rounded-lg text-left hover:border-neutral-200 hover:bg-neutral-50/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700">{offer.number || `Offer #${offer.id?.slice(0, 6)}`}</span>
        <OfferStatusBadge status={offer.status} />
      </div>
      <div className="flex items-baseline justify-between mt-1">
        {offer.total_amount && (
          <span className="text-sm font-semibold text-neutral-900">
            {formatCurrency(offer.total_amount)}
          </span>
        )}
        <span className="text-[10px] text-neutral-400">{offer.specNumber}</span>
      </div>
    </button>
  );
}

function OfferStatusBadge({ status }) {
  const colors = {
    accepted: 'bg-emerald-50 text-emerald-600',
    sent: 'bg-blue-50 text-blue-600',
    draft: 'bg-neutral-100 text-neutral-500',
    rejected: 'bg-red-50 text-red-600',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${colors[status] || 'bg-neutral-100 text-neutral-500'}`}>
      {status}
    </span>
  );
}

function InvoiceRow({ invoice, onInvoiceClick }) {
  const statusColors = {
    pending: 'bg-amber-50 text-amber-600',
    paid: 'bg-emerald-50 text-emerald-600',
    overdue: 'bg-red-50 text-red-600',
    awaiting_confirmation: 'bg-blue-50 text-blue-600',
    cancelled: 'bg-neutral-100 text-neutral-500',
  };
  const statusColor = statusColors[invoice.status] || 'bg-neutral-100 text-neutral-500';
  const statusLabel = invoice.status === 'awaiting_confirmation' ? 'confirming' : invoice.status;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onInvoiceClick?.(invoice.id);
      }}
      className="w-full p-2.5 border border-neutral-100 rounded-lg text-left hover:border-neutral-200 hover:bg-neutral-50/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-700 truncate">
          {invoice.milestone_name || invoice.number || 'Invoice'}
        </span>
        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>
      <div className="flex items-baseline justify-between mt-1">
        <span className="text-sm font-semibold text-neutral-900">
          {formatCurrency(invoice.amount_usd, invoice.currency || 'USD')}
        </span>
        <span className="text-[10px] text-neutral-400">
          {invoice.number}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-neutral-400">
        <span>{invoice.specNumber}</span>
        <span className="text-neutral-300">/</span>
        <span className="truncate">{invoice.offerNumber || 'Offer'}</span>
      </div>
    </button>
  );
}

// Mobile bottom-sheet panel
function MobilePanel({
  activeTab,
  setActiveTab,
  specifications,
  offers,
  invoices,
  resources,
  counts,
  onSpecClick,
  onOfferClick,
  onInvoiceClick,
  onNewSpecification,
  projectId,
  isStaff,
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-full shadow-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
      >
        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Docs
        {(counts.specs + counts.offers + counts.invoices + counts.resources) > 0 && (
          <span className="px-1.5 py-0 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">
            {counts.specs + counts.offers + counts.invoices + counts.resources}
          </span>
        )}
      </button>

      {/* Bottom sheet overlay */}
      {isOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-neutral-300" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-100 px-4 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors flex-shrink-0
                    ${activeTab === tab.id
                      ? 'text-neutral-900 border-b-2 border-emerald-500'
                      : 'text-neutral-400'
                    }
                  `}
                >
                  {tab.label}
                  {counts[tab.id] > 0 && (
                    <span className={`px-1.5 rounded-full text-[10px] ${
                      activeTab === tab.id ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {counts[tab.id]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'specs' && (
                <div className="space-y-2">
                  {specifications.length === 0 ? (
                    <EmptyState icon="document" text="No specifications yet" actionLabel={onNewSpecification ? '+ Create' : null} onAction={onNewSpecification} />
                  ) : (
                    <>
                      {specifications.map(spec => (
                        <SpecCard key={spec.id} specification={spec} onSpecClick={(s) => { onSpecClick(s); setIsOpen(false); }} onOfferClick={(o) => { onOfferClick(o); setIsOpen(false); }} />
                      ))}
                      {onNewSpecification && (
                        <button onClick={() => { onNewSpecification(); setIsOpen(false); }} className="w-full py-2 text-xs text-emerald-600 font-medium">
                          + New Specification
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
              {activeTab === 'offers' && (
                <div className="space-y-2">
                  {offers.length === 0 ? (
                    <EmptyState icon="offer" text="No offers yet" />
                  ) : (
                    offers.map(offer => (
                      <OfferCard key={offer.id} offer={offer} onOfferClick={(o) => { onOfferClick(o); setIsOpen(false); }} />
                    ))
                  )}
                </div>
              )}
              {activeTab === 'invoices' && (
                <div className="space-y-1.5">
                  {invoices.length === 0 ? (
                    <EmptyState icon="invoice" text="No invoices yet" />
                  ) : (
                    invoices.map(inv => (
                      <InvoiceRow key={inv.id} invoice={inv} onInvoiceClick={(id) => { onInvoiceClick(id); setIsOpen(false); }} />
                    ))
                  )}
                </div>
              )}
              {activeTab === 'resources' && (
                <ResourcesTab
                  projectId={projectId}
                  resources={resources}
                  isStaff={isStaff}
                />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default ProjectSidebar;
