import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Популярные эмодзи для быстрого выбора
export const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

/**
 * Fetch reactions for a comment
 */
export function useCommentReactions(commentId) {
  return useQuery({
    queryKey: ['reactions', commentId],
    queryFn: async () => {
      if (!commentId) return [];

      const { data, error } = await supabase
        .from('comment_reactions')
        .select('emoji, user_id')
        .eq('comment_id', commentId);

      if (error) throw error;

      // Группируем по эмодзи
      const grouped = {};
      data.forEach((r) => {
        if (!grouped[r.emoji]) {
          grouped[r.emoji] = [];
        }
        grouped[r.emoji].push(r.user_id);
      });

      return grouped;
    },
    enabled: !!commentId,
  });
}

/**
 * Toggle reaction on a comment
 */
export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, emoji, userId }) => {
      // Проверяем, есть ли уже такая реакция
      const { data: existing } = await supabase
        .from('comment_reactions')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .eq('emoji', emoji)
        .single();

      if (existing) {
        // Удаляем реакцию
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' };
      } else {
        // Добавляем реакцию
        const { error } = await supabase
          .from('comment_reactions')
          .insert({ comment_id: commentId, user_id: userId, emoji });
        if (error) throw error;
        return { action: 'added' };
      }
    },
    onSuccess: (_, { commentId }) => {
      queryClient.invalidateQueries({ queryKey: ['reactions', commentId] });
    },
  });
}
