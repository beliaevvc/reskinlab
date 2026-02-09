import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { logCommentEvent } from '../lib/auditLog';

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
            avatar_url,
            role
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .is('parent_comment_id', null) // Only top-level comments
        .order('created_at', { ascending: false }); // Newest first

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
              avatar_url,
              role
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
    mutationFn: async ({ entityType, entityId, content, parentCommentId, attachments = [] }) => {
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
          attachments: attachments,
        })
        .select(`
          *,
          author:profiles (
            id,
            full_name,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) throw error;
      
      // Update files with comment_id if attachments provided
      if (attachments.length > 0 && data.id) {
        await supabase
          .from('project_files')
          .update({ comment_id: data.id })
          .in('id', attachments);
      }
      
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
      logCommentEvent('add_comment', data.id, { entity_type: data.entity_type, entity_id: data.entity_id });
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
      logCommentEvent('update_comment', data.id, { entity_type: data.entity_type, entity_id: data.entity_id });
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
      // First, get files attached to this comment
      const { data: files } = await supabase
        .from('project_files')
        .select('id, bucket, path, project_id')
        .eq('comment_id', commentId);

      // Delete files from storage and metadata
      if (files && files.length > 0) {
        for (const file of files) {
          // Delete from storage
          await supabase.storage.from(file.bucket).remove([file.path]);
          // Delete metadata
          await supabase.from('project_files').delete().eq('id', file.id);
        }
      }

      // Delete the comment
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      
      const projectId = files?.[0]?.project_id;
      return { commentId, entityType, entityId, projectId };
    },
    onSuccess: ({ commentId, entityType, entityId, projectId }) => {
      queryClient.invalidateQueries({
        queryKey: ['comments', entityType, entityId],
      });
      queryClient.invalidateQueries({
        queryKey: ['comments', 'count', entityType, entityId],
      });
      // Also invalidate project files
      if (projectId) {
        queryClient.invalidateQueries({
          queryKey: ['project-files', projectId],
        });
      }
      queryClient.invalidateQueries({
        queryKey: ['task-files'],
      });
      logCommentEvent('delete_comment', commentId, { entity_type: entityType, entity_id: entityId });
    },
  });
}
