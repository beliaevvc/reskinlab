import { useState } from 'react';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useDeleteComment } from '../../hooks/useComments';
import { CommentAttachments } from './CommentAttachments';

export function CommentItem({ comment, entityType, entityId, onReply, isReply = false }) {
  const { user, isAdmin } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();

  const isOwn = user?.id === comment.author_id;
  const canDelete = isOwn || isAdmin;

  const handleDelete = () => {
    deleteComment({
      commentId: comment.id,
      entityType,
      entityId,
    });
    setShowDeleteConfirm(false);
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return formatDate(dateString);
  };

  return (
    <div className={`group ${isReply ? 'ml-8' : ''}`}>
      <div className="flex gap-2 py-0.5 px-1 -mx-1 rounded hover:bg-neutral-50 transition-colors">
        {/* Avatar */}
        <div className="shrink-0">
          <div className={`
            ${isReply ? 'w-5 h-5 text-[10px]' : 'w-7 h-7 text-xs'}
            rounded-full bg-emerald-500 
            flex items-center justify-center font-medium text-white
          `}>
            {comment.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header: Name + Time + Content inline for short messages */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`font-medium text-neutral-900 ${isReply ? 'text-xs' : 'text-sm'}`}>
              {comment.author?.full_name || 'Unknown'}
            </span>
            <span className="text-[10px] text-neutral-400">
              {formatTime(comment.created_at)}
            </span>
          </div>

          {/* Message content */}
          {comment.content && comment.content.trim() && (
            <div className={`text-neutral-700 whitespace-pre-wrap break-words ${isReply ? 'text-xs' : 'text-sm'}`}>
              {comment.content}
            </div>
          )}

          {/* Attachments */}
          <CommentAttachments commentId={comment.id} attachments={comment.attachments} />

          {/* Actions - appear on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity h-4">
            {onReply && (
              <button
                onClick={() => onReply(comment)}
                className="text-[10px] text-neutral-400 hover:text-emerald-600 font-medium"
              >
                Reply
              </button>
            )}
            {canDelete && onReply && <span className="text-neutral-300 text-[10px]">·</span>}
            {canDelete && (
              <>
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-[10px] text-red-500 hover:text-red-600 font-medium"
                    >
                      {isDeleting ? '...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-[10px] text-neutral-400 hover:text-neutral-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-[10px] text-neutral-400 hover:text-red-500 font-medium"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-0.5 space-y-0.5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              entityType={entityType}
              entityId={entityId}
              onReply={onReply}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
