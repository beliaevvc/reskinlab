import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUploadFiles, BUCKETS, formatFileSize } from '../../hooks/useFiles';
import { useAuth } from '../../contexts/AuthContext';

export function FileUploader({ 
  projectId, 
  taskId = null, 
  bucket = BUCKETS.REFERENCES,
  onUploadComplete,
  maxFiles = 10,
  maxSizeBytes = 50 * 1024 * 1024, // 50MB default
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const { isStaff } = useAuth();
  const { t } = useTranslation('files');
  
  const uploadFiles = useUploadFiles();

  // Determine which bucket based on role
  const effectiveBucket = bucket || (isStaff ? BUCKETS.DELIVERABLES : BUCKETS.REFERENCES);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFilesSelected(files);
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFilesSelected(files);
  }, []);

  const handleFilesSelected = (files) => {
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxSizeBytes) {
        alert(`File "${file.name}" is too large. Max size is ${formatFileSize(maxSizeBytes)}`);
        return false;
      }
      return true;
    }).slice(0, maxFiles);

    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const { results, errors } = await uploadFiles.mutateAsync({
        files: selectedFiles,
        projectId,
        taskId,
        bucket: effectiveBucket,
      });

      if (errors.length > 0) {
        alert(`Some files failed to upload:\n${errors.map(e => `${e.file}: ${e.error}`).join('\n')}`);
      }

      setSelectedFiles([]);
      onUploadComplete?.(results);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload files: ' + err.message);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-md p-8 text-center transition-colors
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-50' 
            : 'border-neutral-300 hover:border-neutral-400'
          }
        `}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        
        <div className="space-y-3">
          <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <div>
            <label
              htmlFor="file-upload"
              className="text-emerald-600 hover:text-emerald-700 cursor-pointer font-medium"
            >
              {t('upload.clickToUpload')}
            </label>
            <span className="text-neutral-500"> {t('upload.orDragDrop')}</span>
          </div>
          
          <p className="text-sm text-neutral-400">
            Max {maxFiles} files, up to {formatFileSize(maxSizeBytes)} each
          </p>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="bg-neutral-50 rounded p-4 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-neutral-700">
              {t('upload.filesSelected', { count: selectedFiles.length })}
            </span>
            <button
              onClick={() => setSelectedFiles([])}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              {t('upload.clearAll')}
            </button>
          </div>
          
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded px-3 py-2 border border-neutral-200"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">
                  {file.type.startsWith('image/') ? '🖼️' : '📎'}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-neutral-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          <button
            onClick={handleUpload}
            disabled={uploadFiles.isPending}
            className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-300 text-white font-medium py-2.5 rounded transition-colors flex items-center justify-center gap-2"
          >
            {uploadFiles.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {t('upload.uploading')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {t('upload.uploadFiles', { count: selectedFiles.length })}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
