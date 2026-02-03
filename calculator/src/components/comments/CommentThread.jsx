import { useComments } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';

export function CommentThread({ entityType, entityId, onReply }) {
  const { data: comments, isLoading } = useComments(entityType, entityId);

  if (isLoading) {
    return (
      <div className="text-center py-8 text-neutral-400 text-sm">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-neutral-300 border-t-emerald-500 mx-auto mb-2" />
        Loading comments...
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-400 text-sm">
        <svg className="w-12 h-12 mx-auto mb-2 text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          entityType={entityType}
          entityId={entityId}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

export default CommentThread;
