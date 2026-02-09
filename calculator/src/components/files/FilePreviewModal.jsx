import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useFileUrl, getFileCategory, formatFileSize, downloadFile } from '../../hooks/useFiles';
import { formatDate } from '../../lib/utils';

export function FilePreviewModal({ file, url: initialUrl, onClose }) {
  const { t } = useTranslation('files');
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get signed URL if not provided
  const { data: signedUrl } = useFileUrl(file.bucket, file.path, 3600);
  const url = initialUrl || signedUrl;
  
  const category = getFileCategory(file.mime_type);
  const isImage = category === 'image';
  const isPdf = category === 'pdf';
  const isVideo = category === 'video';

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
      if (e.key === '0') setZoom(1);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDownload = async () => {
    try {
      await downloadFile(file.bucket, file.path, file.filename);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 text-white">
          <h3 className="font-medium truncate max-w-md">{file.filename}</h3>
          <span className="text-sm text-white/60">{formatFileSize(file.size_bytes)}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom controls for images */}
          {isImage && (
            <div className="flex items-center gap-1 mr-4">
              <button
                onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
                className="p-2 text-white/60 hover:text-white"
                title="Zoom out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-white/60 text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
                className="p-2 text-white/60 hover:text-white"
                title="Zoom in"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-2 text-white/60 hover:text-white text-sm"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>
          )}
          
          <button
            onClick={handleDownload}
            className="p-2 text-white/60 hover:text-white"
            title="Download"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white"
            title={t('preview.close')}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div 
        className="flex-1 flex items-center justify-center overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {!url ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-white border-t-transparent" />
          </div>
        ) : isImage ? (
          <div 
            className="transition-transform duration-200 overflow-auto max-h-full"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={url}
              alt={file.filename}
              className="max-w-none"
              onLoad={() => setIsLoading(false)}
              style={{ 
                maxHeight: zoom === 1 ? '80vh' : 'none',
                width: zoom === 1 ? 'auto' : 'auto',
              }}
            />
          </div>
        ) : isPdf ? (
          <iframe
            src={url}
            className="w-full h-full max-w-4xl bg-white rounded"
            title={file.filename}
          />
        ) : isVideo ? (
          <video
            src={url}
            controls
            className="max-w-full max-h-[80vh]"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="bg-white/10 rounded-md p-8 text-center">
            <div className="text-6xl mb-4">📎</div>
            <h3 className="text-white text-lg font-medium mb-2">{file.filename}</h3>
            <p className="text-white/60 mb-4">{t('preview.previewNotAvailable')}</p>
            <button
              onClick={handleDownload}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-6 py-2 rounded"
            >
              {t('preview.download')}
            </button>
          </div>
        )}
      </div>

      {/* File Info Footer */}
      <div 
        className="px-4 py-2 bg-black/50 text-white/60 text-sm flex items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span>{file.mime_type || t('common:unknown')}</span>
        <span>{formatFileSize(file.size_bytes)}</span>
        <span>{t('card.uploaded')}: {formatDate(file.created_at)}</span>
        {file.uploader && (
          <span>{t('card.by')}: {file.uploader.full_name || file.uploader.email}</span>
        )}
      </div>
    </div>
  );
}

export default FilePreviewModal;
