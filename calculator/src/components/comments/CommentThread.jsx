import { useState } from 'react';
import { useComments, useAddComment } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';

export function CommentThread({ entityType, entityId }) {
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  const { data: comments, isLoading } = useComments(entityType, entityId);
  const { mutate: addComment, isPending } = useAddComment();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment(
      {
        entityType,
        entityId,
        content: newComment.trim(),
        parentCommentId: replyingTo?.id || null,
      },
      {
        onSuccess: () => {
          setNewComment('');
          setReplyingTo(null);
        },
      }
    );
  };

  const handleReply = (comment) => {
    setReplyingTo(comment);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-4 text-neutral-400 text-sm">
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments list */}
      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              entityType={entityType}
              entityId={entityId}
              onReply={handleReply}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-neutral-400 text-sm">
          No comments yet
        </div>
      )}

      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded text-sm">
          <span className="text-neutral-600">
            Replying to <span className="font-medium">{replyingTo.author?.full_name}</span>
          </span>
          <button
            onClick={cancelReply}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
          className="flex-1 px-3 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isPending}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-medium text-sm disabled:opacity-50"
        >
          {isPending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default CommentThread;
