import { useState } from 'react';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useDeleteComment } from '../../hooks/useComments';

export function CommentItem({ comment, entityType, entityId, onReply }) {
  const { user, isAdmin } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();

  const isAuthor = user?.id === comment.author_id;
  const canDelete = isAuthor || isAdmin;

  const handleDelete = () => {
    deleteComment({
      commentId: comment.id,
      entityType,
      entityId,
    });
    setShowDeleteConfirm(false);
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-medium text-emerald-700">
            {comment.author?.full_name?.charAt(0) || '?'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-neutral-900 text-sm">
              {comment.author?.full_name || 'Unknown'}
            </span>
            <span className="text-xs text-neutral-400">
              {formatDate(comment.created_at)}
            </span>
          </div>

          <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onReply?.(comment)}
              className="text-xs text-neutral-500 hover:text-neutral-700"
            >
              Reply
            </button>
            {canDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-500">
                      {isAdmin && !isAuthor ? 'Delete this comment?' : 'Delete?'}
                    </span>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      {isDeleting ? '...' : 'Yes'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-neutral-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-neutral-100">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  entityType={entityType}
                  entityId={entityId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommentItem;
