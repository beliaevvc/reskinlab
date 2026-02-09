import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useComments } from '../../hooks/useComments';
import { CommentItem } from './CommentItem';

export function CommentThread({ entityType, entityId, onReply, onUserClick, highlightCommentId }) {
  const { t } = useTranslation('comments');
  const { data: comments, isLoading } = useComments(entityType, entityId);
  const highlightRef = useRef(null);

  // Scroll to the highlighted comment once comments are loaded
  useEffect(() => {
    if (highlightCommentId && highlightRef.current && !isLoading) {
      // Small delay to let the DOM settle after render
      const timer = setTimeout(() => {
        highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlightCommentId, isLoading, comments]);

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
        <p className="text-sm text-neutral-500">{t('thread.noMessages')}</p>
        <p className="text-xs text-neutral-400 mt-1">{t('thread.beFirst')}</p>
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
          onUserClick={onUserClick}
          isHighlighted={comment.id === highlightCommentId}
          highlightRef={comment.id === highlightCommentId ? highlightRef : undefined}
        />
      ))}
    </div>
  );
}

export default CommentThread;
