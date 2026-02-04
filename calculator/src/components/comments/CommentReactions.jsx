import { useState, useRef, useEffect } from 'react';
import { useCommentReactions, useToggleReaction, QUICK_REACTIONS } from '../../hooks/useReactions';
import { useAuth } from '../../contexts/AuthContext';

export function CommentReactions({ commentId }) {
  const { user } = useAuth();
  const { data: reactions = {}, isLoading } = useCommentReactions(commentId);
  const { mutate: toggleReaction } = useToggleReaction();
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  // Закрытие picker при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const handleReaction = (emoji) => {
    if (!user) return;
    toggleReaction({ commentId, emoji, userId: user.id });
    setShowPicker(false);
  };

  const reactionEntries = Object.entries(reactions);
  const hasReactions = reactionEntries.length > 0;

  if (isLoading) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Existing reactions */}
      {reactionEntries.map(([emoji, userIds]) => {
        const isOwn = user && userIds.includes(user.id);
        return (
          <button
            key={emoji}
            onClick={() => handleReaction(emoji)}
            className={`
              inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium
              border transition-colors
              ${isOwn 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <span className="text-sm">{emoji}</span>
            <span>{userIds.length}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <div className="relative" ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`
            inline-flex items-center justify-center w-7 h-6 rounded-md text-xs
            border border-dashed transition-colors
            ${hasReactions 
              ? 'border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 hover:bg-neutral-50' 
              : 'border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-500 hover:bg-neutral-50'
            }
          `}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Emoji picker */}
        {showPicker && (
          <div className="absolute left-0 bottom-full mb-1 z-20 bg-white rounded-lg shadow-lg border border-neutral-200 p-1.5 flex gap-1">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-neutral-100 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CommentReactions;
