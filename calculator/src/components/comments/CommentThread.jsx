import { useComments } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';

export function CommentThread({ entityType, entityId, onReply }) {
  const { data: comments, isLoading } = useComments(entityType, entityId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-sm text-neutral-500">No messages yet</p>
        <p className="text-xs text-neutral-400 mt-1">Be the first to comment</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
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
