import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * File type icons mapping
 */
export const FILE_ICONS = {
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  pdf: '📄',
  archive: '📦',
  document: '📝',
  spreadsheet: '📊',
  code: '💻',
  default: '📎',
};

/**
 * Get file type category from MIME type
 */
export function getFileCategory(mimeType) {
  if (!mimeType) return 'default';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return 'archive';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('html')) return 'code';
  return 'default';
}

/**
 * Get icon for file type
 */
export function getFileIcon(mimeType) {
  const category = getFileCategory(mimeType);
  return FILE_ICONS[category] || FILE_ICONS.default;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Bucket types
 */
export const BUCKETS = {
  REFERENCES: 'references',
  DELIVERABLES: 'deliverables',
  SOURCES: 'sources',
  PROOFS: 'proofs',
  INVOICES: 'invoices',
};

/**
 * Fetch files for a project from metadata table
 */
export function useProjectFiles(projectId, bucket = null) {
  return useQuery({
    queryKey: ['project-files', projectId, bucket],
    queryFn: async () => {
      let query = supabase
        .from('project_files')
        .select(`
          *,
          uploader:profiles!uploaded_by(id, full_name, email),
          task:tasks!task_id(id, title)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (bucket) {
        query = query.eq('bucket', bucket);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

/**
 * Fetch files for a specific task
 */
export function useTaskFiles(taskId) {
  return useQuery({
    queryKey: ['task-files', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_files')
        .select(`
          *,
          uploader:profiles!uploaded_by(id, full_name, email)
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

/**
 * Get signed URL for a file
 */
export function useFileUrl(bucket, path, expiresIn = 3600) {
  return useQuery({
    queryKey: ['file-url', bucket, path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!bucket && !!path,
    staleTime: (expiresIn - 60) * 1000, // Refresh 1 minute before expiry
  });
}

/**
 * Upload a file
 */
export function useUploadFile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ file, projectId, taskId = null, bucket }) => {
      // Generate unique path: projectId/timestamp-filename
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const path = `${projectId}/${timestamp}-${safeName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Create metadata record
      const { data, error } = await supabase
        .from('project_files')
        .insert({
          project_id: projectId,
          task_id: taskId,
          bucket,
          path: uploadData.path,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) {
        // Cleanup uploaded file if metadata insert fails
        await supabase.storage.from(bucket).remove([uploadData.path]);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-files', data.project_id] });
      if (data.task_id) {
        queryClient.invalidateQueries({ queryKey: ['task-files', data.task_id] });
      }
    },
  });
}

/**
 * Upload multiple files
 */
export function useUploadFiles() {
  const uploadFile = useUploadFile();

  return useMutation({
    mutationFn: async ({ files, projectId, taskId = null, bucket }) => {
      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const result = await uploadFile.mutateAsync({ file, projectId, taskId, bucket });
          results.push(result);
        } catch (err) {
          errors.push({ file: file.name, error: err.message });
        }
      }

      if (errors.length > 0) {
        console.warn('Some files failed to upload:', errors);
      }

      return { results, errors };
    },
  });
}

/**
 * Delete a file
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ fileId, bucket, path, projectId }) => {
      // First, get the file to check if it's attached to a comment
      const { data: fileData } = await supabase
        .from('project_files')
        .select('comment_id')
        .eq('id', fileId)
        .single();

      // If file is attached to a comment, remove it from attachments array
      if (fileData?.comment_id) {
        const { data: comment } = await supabase
          .from('comments')
          .select('attachments, entity_type, entity_id')
          .eq('id', fileData.comment_id)
          .single();

        if (comment?.attachments) {
          const newAttachments = comment.attachments.filter(id => id !== fileId);
          await supabase
            .from('comments')
            .update({ attachments: newAttachments })
            .eq('id', fileData.comment_id);
        }
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (storageError) {
        console.warn('Storage delete error:', storageError);
        // Continue to delete metadata even if storage fails
      }

      // Delete metadata
      const { error } = await supabase
        .from('project_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      return { fileId, projectId, commentId: fileData?.comment_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-files', data.projectId] });
      queryClient.invalidateQueries({ queryKey: ['task-files'] });
      queryClient.invalidateQueries({ queryKey: ['comment-files'] });
      // Also invalidate comments to refresh attachments display
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}

/**
 * Download a file
 */
export async function downloadFile(bucket, path, filename) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);

  if (error) throw error;

  // Create download link
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get public URL for a file (only works for public buckets)
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
