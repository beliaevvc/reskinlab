import { Link, useNavigate, useLocation } from 'react-router-dom';
import { formatDate, formatCurrency } from '../../lib/utils';
import useCalculatorStore from '../../stores/calculatorStore';

// Get base path based on current location
function useBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin';
  if (location.pathname.startsWith('/am')) return '/am';
  return '';
}

export function SpecificationCard({ specification, projectId, projectName }) {
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { setProject, setSpecification } = useCalculatorStore();

  const isDraft = specification.status === 'draft';
  const total = specification.totals_json?.grandTotal || 0;

  const handleEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Set context in store
    setProject(projectId, projectName);
    setSpecification(specification.id, specification.version, isDraft);

    // Navigate to calculator with spec parameter
    navigate(`/calculator?spec=${specification.id}`);
  };

  return (
    <div className="bg-white rounded border border-neutral-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        {/* Left side: Version and status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-neutral-900">
              {specification.version}
            </span>
            {specification.is_addon && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                Add-on
              </span>
            )}
          </div>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              isDraft
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isDraft ? 'Draft' : 'Finalized'}
          </span>
        </div>

        {/* Right side: Total and date */}
        <div className="flex items-center gap-4">
          {total > 0 && (
            <span className="text-lg font-semibold text-neutral-900">
              {formatCurrency(total)}
            </span>
          )}
          <span className="text-sm text-neutral-500">
            {formatDate(specification.updated_at || specification.created_at)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
        <Link
          to={`${basePath}/specifications/${specification.id}`}
          className="flex items-center gap-1.5 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View
        </Link>

        {isDraft && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit
          </button>
        )}

        {!isDraft && (
          <span className="flex items-center gap-1.5 text-sm text-neutral-400">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Locked
          </span>
        )}

        {specification.finalized_at && (
          <span className="ml-auto text-xs text-neutral-400">
            Finalized {formatDate(specification.finalized_at)}
          </span>
        )}
      </div>
    </div>
  );
}

export default SpecificationCard;
