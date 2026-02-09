import { useTranslation } from 'react-i18next';

/**
 * AuditLogsPagination — classic pagination with page numbers
 */
export function AuditLogsPagination({ currentPage, totalPages, totalCount, offset, limit, onPageChange }) {
  const { t } = useTranslation('admin');

  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="px-4 py-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-neutral-500">
        {t('auditLog.pagination.showing')} <span className="font-medium text-neutral-700">{offset + 1}</span> {t('auditLog.pagination.to')}{' '}
        <span className="font-medium text-neutral-700">{Math.min(offset + limit, totalCount)}</span> {t('auditLog.pagination.of')}{' '}
        <span className="font-medium text-neutral-700">{totalCount.toLocaleString()}</span> {t('auditLog.pagination.logs')}
      </p>

      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 border border-neutral-300 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, i) => {
          if (page === '...') {
            return (
              <span key={`dots-${i}`} className="px-2 py-1.5 text-sm text-neutral-400">
                ...
              </span>
            );
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-emerald-500 text-white'
                  : 'border border-neutral-300 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {page}
            </button>
          );
        })}

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 border border-neutral-300 rounded text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default AuditLogsPagination;
