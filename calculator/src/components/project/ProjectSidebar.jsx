import { useState } from 'react';
import { formatDate, formatCurrency } from '../../lib/utils';

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
  const [expandedSection, setExpandedSection] = useState('specs');

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-neutral-50 border-r border-neutral-200 flex flex-col items-center py-4 gap-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-neutral-200 rounded text-neutral-500"
          title="Expand sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        
        {/* Collapsed icons */}
        <button
          onClick={() => { onToggleCollapse(); setExpandedSection('specs'); }}
          className="p-2 hover:bg-neutral-200 rounded text-neutral-500"
          title="Specifications"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-neutral-50 border-r border-neutral-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">Project Panel</span>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-neutral-200 rounded text-neutral-500"
          title="Collapse sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Specifications & Offers Section */}
        <div className="border-b border-neutral-200">
          <button
            onClick={() => toggleSection('specs')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-neutral-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-medium text-neutral-700">
                Specifications
              </span>
              {specifications.length > 0 && (
                <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-600 text-xs rounded">
                  {specifications.length}
                </span>
              )}
            </div>
            <svg 
              className={`w-4 h-4 text-neutral-400 transition-transform ${expandedSection === 'specs' ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {expandedSection === 'specs' && (
            <div className="px-3 pb-3 space-y-2">
              {specifications.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-neutral-400 mb-2">No specifications yet</p>
                  {onNewSpecification && (
                    <button
                      onClick={onNewSpecification}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      + Create Specification
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {specifications.map((spec) => (
                    <SpecOfferCard
                      key={spec.id}
                      specification={spec}
                      onSpecClick={onSpecClick}
                      onOfferClick={onOfferClick}
                      onInvoiceClick={onInvoiceClick}
                    />
                  ))}
                  {onNewSpecification && (
                    <button
                      onClick={onNewSpecification}
                      className="w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors font-medium"
                    >
                      + New Specification
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// Internal component for Spec + Offer combined card
function SpecOfferCard({ specification, onSpecClick, onOfferClick, onInvoiceClick }) {
  const [invoicesExpanded, setInvoicesExpanded] = useState(false);
  const hasOffer = specification.offer;
  const isFinalized = specification.status === 'finalized';
  const invoices = specification.offer?.invoices || [];
  const hasInvoices = invoices.length > 0;

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
      {/* Spec info */}
      <button
        onClick={() => onSpecClick?.(specification)}
        className="w-full p-3 text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-neutral-800">
            v{specification.version_number || specification.version || 1}
            {specification.is_addon && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                Add-on
              </span>
            )}
          </span>
          <span className={`px-1.5 py-0.5 text-xs rounded ${
            isFinalized 
              ? 'bg-emerald-100 text-emerald-700' 
              : 'bg-neutral-100 text-neutral-600'
          }`}>
            {isFinalized ? 'Final' : 'Draft'}
          </span>
        </div>
        <div className="text-sm font-semibold text-neutral-900">
          {formatCurrency(specification.totals_json?.grandTotal || 0)}
        </div>
        <div className="text-xs text-neutral-400 mt-0.5">
          {formatDate(specification.updated_at || specification.created_at)}
        </div>
      </button>

      {/* Offer link if exists */}
      {hasOffer && (
        <button
          onClick={() => onOfferClick?.(specification.offer)}
          className="w-full px-3 py-2 border-t border-neutral-100 flex items-center justify-between hover:bg-emerald-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>View Offer</span>
          </div>
          <span className={`px-1.5 py-0.5 text-xs rounded ${
            specification.offer.status === 'accepted' 
              ? 'bg-emerald-100 text-emerald-700'
              : specification.offer.status === 'sent'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-neutral-100 text-neutral-600'
          }`}>
            {specification.offer.status}
          </span>
        </button>
      )}

      {/* Invoices list if exists */}
      {hasInvoices && (
        <div className="border-t border-neutral-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setInvoicesExpanded(!invoicesExpanded);
            }}
            className="w-full px-3 py-2 flex items-center justify-between hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium text-neutral-500">
                Invoices ({invoices.length})
              </span>
            </div>
            <svg 
              className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${invoicesExpanded ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {invoicesExpanded && (
            <div className="px-3 pb-2 space-y-1.5">
              {invoices.map((invoice) => {
            const statusColors = {
              pending: 'bg-amber-100 text-amber-700',
              paid: 'bg-emerald-100 text-emerald-700',
              overdue: 'bg-red-100 text-red-700',
              awaiting_confirmation: 'bg-blue-100 text-blue-700',
              cancelled: 'bg-neutral-100 text-neutral-600',
            };
            const statusColor = statusColors[invoice.status] || 'bg-neutral-100 text-neutral-600';

            return (
              <button
                key={invoice.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onInvoiceClick?.(invoice.id);
                }}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-neutral-50 transition-colors group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <svg className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-xs text-neutral-700 truncate group-hover:text-neutral-900">
                    {invoice.milestone_name || invoice.number}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-neutral-900">
                    {formatCurrency(invoice.amount_usd, invoice.currency || 'USD')}
                  </span>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${statusColor}`}>
                    {invoice.status === 'awaiting_confirmation' ? 'confirming' : invoice.status}
                  </span>
                </div>
              </button>
            );
          })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectSidebar;
