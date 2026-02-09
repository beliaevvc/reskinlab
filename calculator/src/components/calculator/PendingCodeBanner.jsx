import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useClaimSharedSession } from '../../hooks/useSharedSessions';
import useCalculatorStore from '../../stores/calculatorStore';

const PENDING_CODE_KEY = 'pending_shared_code';

/**
 * Banner that appears on Dashboard when user has a pending shared code.
 * Auto-claims the shared session and redirects to calculator.
 */
export function PendingCodeBanner() {
  const { t } = useTranslation('calculator');
  const navigate = useNavigate();
  const claimSession = useClaimSharedSession();
  const { setProject, setSpecification } = useCalculatorStore();
  const [pendingCode, setPendingCode] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState(null);

  // Check for pending code on mount
  useEffect(() => {
    try {
      const code = localStorage.getItem(PENDING_CODE_KEY);
      if (code) {
        setPendingCode(code);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Handle claim
  const handleClaim = useCallback(async () => {
    if (!pendingCode || claiming) return;
    setClaiming(true);
    setClaimError(null);

    try {
      const result = await claimSession.mutateAsync(pendingCode);

      // Clear pending code
      try {
        localStorage.removeItem(PENDING_CODE_KEY);
      } catch { /* ignore */ }

      // Update calculator store
      setProject(result.project_id, 'Imported Project');
      setSpecification(result.specification_id, result.spec_number, true);

      // Navigate to calculator with the new spec
      navigate(`/calculator?spec=${result.specification_id}`, { replace: true });
    } catch (error) {
      setClaimError(error.message);
      setClaiming(false);
    }
  }, [pendingCode, claiming, claimSession, setProject, setSpecification, navigate]);

  // Dismiss
  const handleDismiss = useCallback(() => {
    try {
      localStorage.removeItem(PENDING_CODE_KEY);
    } catch { /* ignore */ }
    setPendingCode(null);
  }, []);

  if (!pendingCode) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900">
            {t('pendingCode.title')}
          </h3>
          <p className="text-sm text-blue-700 mt-1">
            {t('pendingCode.description', { code: pendingCode })}
          </p>
          {claimError && (
            <p className="text-sm text-red-600 mt-2">{claimError}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-medium rounded-md transition-colors flex items-center gap-2"
            >
              {claiming ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {t('pendingCode.importing')}
                </>
              ) : (
                t('pendingCode.import')
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              {t('pendingCode.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PendingCodeBanner;
