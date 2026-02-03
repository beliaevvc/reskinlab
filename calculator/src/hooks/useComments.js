import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Fetch comments for an entity
 * @param entityType - 'task', 'approval', 'asset', 'project'
 * @param entityId - UUID of the entity
 */
export function useComments(entityType, entityId) {
  return useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return [];

      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch replies for each comment
      if (data && data.length > 0) {
        const commentIds = data.map((c) => c.id);
        
        const { data: replies, error: repliesError } = await supabase
          .from('comments')
          .select(`
            *,
            author:profiles (
              id,
              full_name,
              avatar_url
            )
          `)
          .in('parent_comment_id', commentIds)
          .order('created_at', { ascending: true });

        if (!repliesError && replies) {
          // Group replies by parent
          const repliesByParent = replies.reduce((acc, reply) => {
            if (!acc[reply.parent_comment_id]) {
              acc[reply.parent_comment_id] = [];
            }
            acc[reply.parent_comment_id].push(reply);
            return acc;
          }, {});

          // Attach replies to comments
          data.forEach((comment) => {
            comment.replies = repliesByParent[comment.id] || [];
          });
        }
      }

      return data || [];
    },
    enabled: !!entityType && !!entityId,
  });
}

/**
 * Get comment count for an entity
 */
export function useCommentCount(entityType, entityId) {
  return useQuery({
    queryKey: ['comments', 'count', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return 0;

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!entityType && !!entityId,
  });
}

/**
 * Add a new comment
 */
export function useAddComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ entityType, entityId, content, parentCommentId }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          entity_type: entityType,
          entity_id: entityId,
          content,
          author_id: user.id,
          parent_comment_id: parentCommentId || null,
        })
        .select(`
          *,
          author:profiles (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', data.entity_type, data.entity_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['comments', 'count', data.entity_type, data.entity_id],
      });
      // Refresh tasks list to update comments counter
      if (data.entity_type === 'task') {
        // Invalidate all tasks queries (any projectId)
        queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] === 'tasks',
        });
      }
    },
  });
}

/**
 * Update a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, content }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', data.entity_type, data.entity_id],
      });
    },
  });
}

/**
 * Delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, entityType, entityId }) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      return { commentId, entityType, entityId };
    },
    onSuccess: ({ entityType, entityId }) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', entityType, entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comments', 'count', entityType, entityId],
      });
    },
  });
}
