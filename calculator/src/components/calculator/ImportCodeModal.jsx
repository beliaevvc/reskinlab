import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClaimSharedSession } from '../../hooks/useSharedSessions';
import useCalculatorStore from '../../stores/calculatorStore';

/**
 * Modal for importing a shared calculator selection code.
 * Used by existing authenticated users to claim a shared session.
 */
export function ImportCodeModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const claimSession = useClaimSharedSession();
  const { setProject, setSpecification } = useCalculatorStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  const handleImport = useCallback(async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    setError(null);

    try {
      const result = await claimSession.mutateAsync(code.trim());

      // Update calculator store
      setProject(result.project_id, 'Imported Project');
      setSpecification(result.specification_id, result.spec_number, true);

      // Close modal and navigate to calculator
      onClose();
      navigate(`/calculator?spec=${result.specification_id}`);
    } catch (err) {
      setError(err.message);
    }
  }, [code, claimSession, setProject, setSpecification, onClose, navigate]);

  const handleClose = useCallback(() => {
    setCode('');
    setError(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-neutral-600"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Import Selection</h3>
        <p className="text-sm text-neutral-500 mb-4">
          Enter the code from a shared calculator to import the selection into a new project.
        </p>

        {/* Code input */}
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Enter 8-character code"
          maxLength={8}
          autoFocus
          className="w-full px-4 py-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-neutral-900 placeholder-neutral-400 font-mono text-center text-lg tracking-widest"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleImport();
          }}
        />

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handleImport}
            disabled={claimSession.isPending || !code.trim()}
            className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {claimSession.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2.5 text-neutral-600 hover:text-neutral-800 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImportCodeModal;
