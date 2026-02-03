import { useState } from 'react';
import { useRespondToApproval, getApprovalTypeLabel } from '../../hooks/useApprovals';

export function ApprovalResponseModal({ isOpen, onClose, approval }) {
  const [response, setResponse] = useState('');
  const [comment, setComment] = useState('');
  const { mutate: respond, isPending, error } = useRespondToApproval();

  if (!isOpen || !approval) return null;

  const isOverMaxRounds = approval.revision_round >= approval.max_free_rounds;

  const handleSubmit = () => {
    if (!response) return;
    if ((response === 'needs_revision' || response === 'rejected') && !comment.trim()) {
      alert('Please provide a comment explaining your feedback');
      return;
    }

    respond(
      {
        approvalId: approval.id,
        response,
        comment: comment.trim(),
      },
      {
        onSuccess: () => {
          setResponse('');
          setComment('');
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            Respond to Approval Request
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            {getApprovalTypeLabel(approval.approval_type)}
            {approval.stage && ` — ${approval.stage.name}`}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Revision warning */}
          {isOverMaxRounds && response === 'needs_revision' && (
            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-amber-800">Additional Revision</p>
                  <p className="text-sm text-amber-700 mt-1">
                    You've used all {approval.max_free_rounds} free revision rounds. 
                    This additional revision may incur extra charges.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Response options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-700">
              Your Response
            </label>
            
            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                name="response"
                value="approved"
                checked={response === 'approved'}
                onChange={(e) => setResponse(e.target.value)}
                className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
              />
              <div>
                <span className="font-medium text-emerald-700">Approve</span>
                <p className="text-sm text-neutral-500">
                  Work looks good, proceed to next stage
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                name="response"
                value="needs_revision"
                checked={response === 'needs_revision'}
                onChange={(e) => setResponse(e.target.value)}
                className="w-4 h-4 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <span className="font-medium text-amber-700">Request Revision</span>
                <p className="text-sm text-neutral-500">
                  Some changes needed before approval
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-neutral-50 transition-colors">
              <input
                type="radio"
                name="response"
                value="rejected"
                checked={response === 'rejected'}
                onChange={(e) => setResponse(e.target.value)}
                className="w-4 h-4 text-red-500 focus:ring-red-500"
              />
              <div>
                <span className="font-medium text-red-700">Reject</span>
                <p className="text-sm text-neutral-500">
                  Work doesn't meet requirements
                </p>
              </div>
            </label>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Comment
              {(response === 'needs_revision' || response === 'rejected') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder={
                response === 'approved'
                  ? 'Optional feedback...'
                  : 'Please explain what changes are needed...'
              }
              className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!response || isPending}
            className={`px-6 py-2 rounded font-medium disabled:opacity-50 ${
              response === 'approved'
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                : response === 'needs_revision'
                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                  : response === 'rejected'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-neutral-200 text-neutral-500'
            }`}
          >
            {isPending ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApprovalResponseModal;
