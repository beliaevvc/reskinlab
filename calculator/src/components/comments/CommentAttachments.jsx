import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { getFileIcon, formatFileSize } from '../../hooks/useFiles';

function useCommentFiles(commentId, attachmentIds) {
  return useQuery({
    queryKey: ['comment-files', commentId],
    queryFn: async () => {
      if (!attachmentIds || attachmentIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .in('id', attachmentIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!commentId && !!attachmentIds && attachmentIds.length > 0,
  });
}

function useSignedUrl(bucket, path) {
  return useQuery({
    queryKey: ['file-url', bucket, path],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);
      if (error) throw error;
      return data.signedUrl;
    },
    enabled: !!bucket && !!path,
    staleTime: 3000 * 1000, // 50 minutes
  });
}

function ImageAttachment({ file }) {
  const { data: url } = useSignedUrl(file.bucket, file.path);
  
  if (!url) return <div className="w-48 h-32 bg-neutral-100 rounded animate-pulse" />;
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <img
        src={url}
        alt={file.filename}
        className="max-w-[240px] max-h-[180px] rounded-lg border border-neutral-200 hover:border-emerald-300 transition-colors object-cover"
      />
    </a>
  );
}

function FileAttachment({ file }) {
  const { data: url } = useSignedUrl(file.bucket, file.path);
  
  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-emerald-300 transition-colors"
    >
      <span className="text-base">{getFileIcon(file.mime_type)}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-neutral-700 truncate max-w-[150px]">{file.filename}</p>
        <p className="text-[10px] text-neutral-400">{formatFileSize(file.size_bytes)}</p>
      </div>
    </a>
  );
}

export function CommentAttachments({ commentId, attachments }) {
  const { data: files, isLoading } = useCommentFiles(commentId, attachments);
  
  if (!attachments || attachments.length === 0) return null;
  if (isLoading) return <div className="text-[10px] text-neutral-400">Loading...</div>;
  if (!files || files.length === 0) return null;
  
  const images = files.filter(f => f.mime_type?.startsWith('image/'));
  const otherFiles = files.filter(f => !f.mime_type?.startsWith('image/'));
  
  return (
    <div className="mt-1.5 space-y-1.5">
      {/* Images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {images.map((file) => (
            <ImageAttachment key={file.id} file={file} />
          ))}
        </div>
      )}
      
      {/* Other files */}
      {otherFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {otherFiles.map((file) => (
            <FileAttachment key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentAttachments;
