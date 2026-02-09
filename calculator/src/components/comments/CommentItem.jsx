import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useDeleteComment } from '../../hooks/useComments';
import { CommentAttachments } from './CommentAttachments';
import { CommentReactions } from './CommentReactions';
import UserAvatar from '../UserAvatar';

// Generate consistent color from name (kept for backward compat, no longer used for avatars)
const getAvatarColor = (name) => {
  const colors = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-slate-500',
  ];
  const hash = (name || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Parse text and convert URLs to clickable links
const parseTextWithLinks = (text) => {
  if (!text) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      urlRegex.lastIndex = 0;
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-600 hover:text-emerald-700 hover:underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export function CommentItem({ comment, entityType, entityId, onReply, onUserClick, isReply = false, isHighlighted = false, highlightRef }) {
  const { t } = useTranslation('comments');
  const { user, isAdmin } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);

  // Brief flash highlight then fade out
  useEffect(() => {
    if (isHighlighted) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted]);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();

  const isOwn = user?.id === comment.author_id;
  const canDelete = isOwn || isAdmin;
  const hasReplies = comment.replies?.length > 0;

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
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return formatDate(dateString);
  };

  const avatarColor = getAvatarColor(comment.author?.full_name);

  return (
    <div ref={highlightRef} className={`group transition-all duration-700 ease-out ${showHighlight ? 'bg-emerald-50/60 rounded-lg' : ''}`}>
      <div className="flex gap-3">
        {/* Avatar column with thread line */}
        <div className="flex flex-col items-center">
          <UserAvatar
            name={comment.author?.full_name}
            email={comment.author?.email}
            avatarUrl={comment.author?.avatar_url}
            role={comment.author?.role}
            size={isReply ? 'sm' : 'md'}
            className="shadow-sm"
          />
          {/* Thread line */}
          {hasReplies && (
            <div className="w-0.5 flex-1 bg-neutral-200 mt-2 rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pb-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            {onUserClick ? (
              <button
                onClick={() => onUserClick(comment.author_id)}
                className={`font-semibold text-neutral-900 hover:text-emerald-600 transition-colors ${isReply ? 'text-[13px]' : 'text-sm'}`}
              >
                {comment.author?.full_name || t('common:unknown')}
              </button>
            ) : (
              <span className={`font-semibold text-neutral-900 ${isReply ? 'text-[13px]' : 'text-sm'}`}>
                {comment.author?.full_name || t('common:unknown')}
              </span>
            )}
            <span className="text-neutral-400">·</span>
            <span className="text-xs text-neutral-400">
              {formatTime(comment.created_at)}
            </span>
            
            {/* Delete button - far right on hover */}
            {canDelete && (
              <div className="flex-1 flex justify-end">
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-0.5 rounded hover:bg-red-50"
                    >
                      {isDeleting ? '...' : 'Delete'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-0.5 rounded hover:bg-neutral-100"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Message content */}
          {comment.content && comment.content.trim() && (
            <div className={`text-neutral-800 mt-0.5 leading-snug break-words ${isReply ? 'text-[13px]' : 'text-sm'}`}>
              {parseTextWithLinks(comment.content)}
            </div>
          )}

          {/* Attachments */}
          <CommentAttachments commentId={comment.id} attachments={comment.attachments} />

          {/* Reactions + Reply */}
          <div className="flex items-center gap-3 mt-2">
            <CommentReactions commentId={comment.id} />
            {onReply && (
              <button
                onClick={() => onReply(comment)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                {t('item.reply')}
              </button>
            )}
          </div>

          {/* Replies */}
          {hasReplies && (
            <div className="mt-3 space-y-0">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  entityType={entityType}
                  entityId={entityId}
                  onReply={onReply}
                  onUserClick={onUserClick}
                  isReply={true}
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
