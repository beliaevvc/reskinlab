import { useState } from 'react';
import { useFinalizeProject, useDeliveryChecklist } from '../../hooks/useDelivery';

export function FinalApprovalModal({ project, isOpen, onClose, onSuccess }) {
  const [accepted, setAccepted] = useState(false);
  const [feedback, setFeedback] = useState('');
  
  const { data: checklist } = useDeliveryChecklist(project?.id);
  const finalizeProject = useFinalizeProject();

  if (!isOpen || !project) return null;

  const handleFinalize = async () => {
    if (!accepted) {
      alert('Please accept the terms to finalize the project');
      return;
    }

    try {
      await finalizeProject.mutateAsync({
        projectId: project.id,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Finalize error:', err);
      alert('Failed to finalize project: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-md shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200">
          <h2 className="text-xl font-bold text-neutral-900">Finalize Project</h2>
          <p className="text-neutral-500 mt-1">Complete and close "{project.name}"</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Checklist Summary */}
          <div className="bg-neutral-50 rounded p-4">
            <h3 className="font-medium text-neutral-900 mb-3">Completion Status</h3>
            <div className="space-y-2">
              {checklist?.checklist?.filter(item => !item.optional).map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  {item.completed ? (
                    <span className="text-emerald-500">✓</span>
                  ) : (
                    <span className="text-red-500">✗</span>
                  )}
                  <span className={item.completed ? 'text-neutral-700' : 'text-red-600'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning if not ready */}
          {!checklist?.readyForDelivery && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <div className="flex items-start gap-3">
                <span className="text-amber-500 text-xl">⚠️</span>
                <div>
                  <p className="font-medium text-amber-800">Not all items are complete</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You can still finalize, but some items are incomplete.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Terms */}
          <div className="space-y-3">
            <h3 className="font-medium text-neutral-900">Final Approval</h3>
            <p className="text-sm text-neutral-600">
              By finalizing this project, you confirm that:
            </p>
            <ul className="text-sm text-neutral-600 space-y-1 list-disc list-inside">
              <li>All deliverables have been reviewed</li>
              <li>The work meets the agreed specifications</li>
              <li>You accept the final results</li>
            </ul>
          </div>

          {/* Feedback (optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Any final comments or feedback..."
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={3}
            />
          </div>

          {/* Acceptance checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-500 border-neutral-300 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-neutral-700">
              I confirm that I have reviewed all deliverables and accept the final results. 
              I understand that this action cannot be undone.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-neutral-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-600 hover:text-neutral-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleFinalize}
            disabled={!accepted || finalizeProject.isPending}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-300 text-white font-medium rounded transition-colors flex items-center gap-2"
          >
            {finalizeProject.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Finalizing...
              </>
            ) : (
              <>
                ✓ Finalize Project
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FinalApprovalModal;
