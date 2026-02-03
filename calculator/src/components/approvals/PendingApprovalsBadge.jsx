import { usePendingApprovals } from '../../hooks/useApprovals';

export function PendingApprovalsBadge({ projectId }) {
  const { data: pendingApprovals } = usePendingApprovals(projectId);
  const count = pendingApprovals?.length || 0;

  if (count === 0) return null;

  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {count} pending
    </span>
  );
}

export default PendingApprovalsBadge;
