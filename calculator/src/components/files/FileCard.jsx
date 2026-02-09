import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFileIcon, getFileCategory, formatFileSize, downloadFile } from '../../hooks/useFiles';
import { useFileUrl, useDeleteFile } from '../../hooks/useFiles';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../lib/utils';

export function FileCard({ file, onPreview, showActions = true }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { user, isAdmin } = useAuth();
  const deleteFile = useDeleteFile();
  
  const { data: signedUrl } = useFileUrl(file.bucket, file.path);
  
  const category = getFileCategory(file.mime_type);
  const isImage = category === 'image';
  const canDelete = isAdmin || file.uploaded_by === user?.id;

  const handleDownload = async () => {
    try {
      await downloadFile(file.bucket, file.path, file.filename);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('preview.deleteConfirm'))) return;
    
    setIsDeleting(true);
    try {
      await deleteFile.mutateAsync({
        fileId: file.id,
        bucket: file.bucket,
        path: file.path,
        projectId: file.project_id,
      });
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete file: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(file, signedUrl);
    }
  };

  return (
    <div className="bg-white rounded border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow group">
      {/* Thumbnail / Icon */}
      <div 
        onClick={handlePreview}
        className="aspect-square bg-neutral-100 flex items-center justify-center cursor-pointer relative overflow-hidden"
      >
        {isImage && signedUrl ? (
          <img
            src={signedUrl}
            alt={file.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl">{getFileIcon(file.mime_type)}</span>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={handlePreview}
            className="p-2 bg-white rounded-full text-neutral-700 hover:bg-neutral-100"
            title={t('browser.preview')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            className="p-2 bg-white rounded-full text-neutral-700 hover:bg-neutral-100"
            title="Download"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-neutral-900 truncate" title={file.filename}>
          {file.filename}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-neutral-500">
            {formatFileSize(file.size_bytes)}
          </span>
          <span className="text-xs text-neutral-400">
            {formatDate(file.created_at)}
          </span>
        </div>
        
        {/* Actions */}
        {showActions && canDelete && (
          <div className="mt-2 pt-2 border-t border-neutral-100">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs text-red-500 hover:text-red-700 disabled:text-neutral-400"
            >
              {isDeleting ? t('preview.deleting') : t('preview.delete')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileCard;
