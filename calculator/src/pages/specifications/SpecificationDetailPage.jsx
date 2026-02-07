import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSpecification } from '../../hooks/useSpecifications';
import { useOfferBySpecification, useCreateOffer } from '../../hooks/useOffers';
import { formatDate } from '../../lib/utils';
import { FinalizeConfirmModal } from '../../components/specifications';
import { SpecificationView } from '../../components';
import { prepareSpecificationForView } from '../../lib/specificationHelpers';
import { useAuth } from '../../contexts/AuthContext';
import useCalculatorStore from '../../stores/calculatorStore';
// Get base path based on current location
function useBasePath() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return '/admin';
  if (location.pathname.startsWith('/am')) return '/am';
  return '';
}

export function SpecificationDetailPage() {
  const { id: specId } = useParams();
  const navigate = useNavigate();
  const basePath = useBasePath();
  const { isAdmin } = useAuth();
  const { data: specification, isLoading, error } = useSpecification(specId);
  const { data: existingOffer, isLoading: offerLoading } = useOfferBySpecification(specId);
  const { mutate: createOffer, isPending: isCreatingOffer } = useCreateOffer();
  const { setProject, setSpecification } = useCalculatorStore();
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);

  const isDraft = specification?.status === 'draft';
  const isFinalized = specification?.status === 'finalized';
  const hasOffer = !!existingOffer;
  
  // Подготавливаем данные для SpecificationView
  const specData = prepareSpecificationForView(specification);

  const handleCreateOffer = () => {
    createOffer(specId, {
      onSuccess: (offer) => {
        navigate(`${basePath}/offers/${offer.id}`);
      },
      onError: (err) => {
        alert('Failed to create offer: ' + err.message);
      },
    });
  };

  const handleEdit = () => {
    if (!specification || !isDraft) return;

    // Set context
    setProject(specification.project_id, specification.project?.name);
    setSpecification(specification.id, specification.number || specification.version, true);

    // Navigate to calculator with spec parameter
    navigate(`/calculator?spec=${specification.id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
          <p className="text-sm text-neutral-500">Loading specification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-6">
        <p className="text-red-800">
          Failed to load specification: {error.message}
        </p>
        <Link
          to={`${basePath}/projects`}
          className="mt-4 inline-flex items-center text-red-700 hover:text-red-800"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (!specification) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
        <p className="text-neutral-600">Specification not found</p>
        <Link
          to={`${basePath}/projects`}
          className="mt-4 inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (!specData) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-md p-6 text-center">
        <p className="text-neutral-600">Specification data is incomplete</p>
        <Link
          to={`${basePath}/projects`}
          className="mt-4 inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Header with actions */}
        <div className="border-b border-neutral-200 pb-6 mb-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-4">
            <Link
              to={`${basePath}/projects`}
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              Projects
            </Link>
            <svg
              className="w-4 h-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <Link
              to={`${basePath}/projects/${specification.project_id}`}
              className="text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              {specification.project?.name || 'Project'}
            </Link>
            <svg
              className="w-4 h-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="text-neutral-900 font-medium">
              {specification.number || specification.version}
            </span>
          </nav>

          {/* Client Info (Admin only) */}
          {isAdmin && specification.project?.client && (
            <div className="mb-4 p-3 bg-neutral-50 rounded-md border border-neutral-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">
                    Client
                  </div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {specification.project.client.company_name || specification.project.client.user?.full_name || 'Unknown'}
                  </div>
                  {specification.project.client.user && (
                    <div className="text-xs text-neutral-600 mt-1">
                      {specification.project.client.user.full_name && (
                        <span>{specification.project.client.user.full_name}</span>
                      )}
                      {specification.project.client.user.email && (
                        <span className={specification.project.client.user.full_name ? ' • ' : ''}>
                          {specification.project.client.user.email}
                        </span>
                      )}
                    </div>
                  )}
                  {specification.project.client.contact_name && (
                    <div className="text-xs text-neutral-500 mt-1">
                      Contact: {specification.project.client.contact_name}
                      {specification.project.client.contact_phone && (
                        <span> • {specification.project.client.contact_phone}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-neutral-900">
                Specification {specification.number || specification.version}
              </h1>
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

            <div className="flex items-center gap-2">
              {isDraft && (
                <>
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 px-4 py-2.5 rounded border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors"
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
                  <button
                    onClick={() => setShowFinalizeModal(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded transition-colors"
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Finalize
                  </button>
                </>
              )}
              {isFinalized && !hasOffer && (
                <button
                  onClick={handleCreateOffer}
                  disabled={isCreatingOffer || offerLoading}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded transition-colors disabled:opacity-50"
                >
                  {isCreatingOffer ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Creating...
                    </>
                  ) : (
                    <>
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Create Offer
                    </>
                  )}
                </button>
              )}
              {isFinalized && hasOffer && (
                <Link
                  to={`${basePath}/offers/${existingOffer.id}`}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-4 py-2.5 rounded transition-colors"
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
                  View Offer
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Specification View */}
        <SpecificationView
          totals={specData.totals}
          globalStyle={specData.globalStyle}
          usageRights={specData.usageRights}
          paymentModel={specData.paymentModel}
          specNumber={specData.specNumber}
          specDate={specData.specDate}
          onBack={() => navigate(`${basePath}/projects/${specification.project_id}`)}
          noWrapper={true}
        />

        {/* Finalize Modal */}
        <FinalizeConfirmModal
          isOpen={showFinalizeModal}
          onClose={() => setShowFinalizeModal(false)}
          specification={specification}
          onSuccess={() => {
            // Refresh will happen via react-query
          }}
        />
      </div>
    </div>
  );
}

export default SpecificationDetailPage;
