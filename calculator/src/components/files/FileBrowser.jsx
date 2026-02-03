import { useState } from 'react';
import { useProjectFiles, BUCKETS } from '../../hooks/useFiles';
import { FileCard } from './FileCard';
import { FilePreviewModal } from './FilePreviewModal';

const BUCKET_LABELS = {
  [BUCKETS.REFERENCES]: 'References',
  [BUCKETS.DELIVERABLES]: 'Deliverables',
  [BUCKETS.SOURCES]: 'Sources',
  [BUCKETS.PROOFS]: 'Payment Proofs',
};

export function FileBrowser({ projectId, defaultBucket = null }) {
  const [selectedBucket, setSelectedBucket] = useState(defaultBucket);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { data: files, isLoading, error } = useProjectFiles(projectId, selectedBucket);

  const handlePreview = (file, url) => {
    setPreviewFile(file);
    setPreviewUrl(url);
  };

  const closePreview = () => {
    setPreviewFile(null);
    setPreviewUrl(null);
  };

  // Group files by bucket if no filter
  const groupedFiles = selectedBucket 
    ? { [selectedBucket]: files || [] }
    : (files || []).reduce((acc, file) => {
        if (!acc[file.bucket]) acc[file.bucket] = [];
        acc[file.bucket].push(file);
        return acc;
      }, {});

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Bucket Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedBucket(null)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              !selectedBucket
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            All Files
          </button>
          {Object.entries(BUCKET_LABELS).map(([bucket, label]) => (
            <button
              key={bucket}
              onClick={() => setSelectedBucket(bucket)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedBucket === bucket
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-neutral-100 rounded p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${
              viewMode === 'grid' ? 'bg-white shadow-sm' : ''
            }`}
            title="Grid view"
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded ${
              viewMode === 'list' ? 'bg-white shadow-sm' : ''
            }`}
            title="List view"
          >
            <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          Failed to load files: {error.message}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!files || files.length === 0) && (
        <div className="text-center py-12 bg-neutral-50 rounded">
          <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-900">No files yet</h3>
          <p className="text-neutral-500 mt-1">Upload files to get started</p>
        </div>
      )}

      {/* Files grouped by bucket */}
      {!isLoading && !error && Object.entries(groupedFiles).map(([bucket, bucketFiles]) => (
        bucketFiles.length > 0 && (
          <div key={bucket}>
            {!selectedBucket && (
              <h3 className="text-lg font-medium text-neutral-900 mb-3 flex items-center gap-2">
                {BUCKET_LABELS[bucket] || bucket}
                <span className="text-sm font-normal text-neutral-500">
                  ({bucketFiles.length})
                </span>
              </h3>
            )}
            
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {bucketFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded border border-neutral-200 divide-y divide-neutral-200">
                {bucketFiles.map((file) => (
                  <FileListItem
                    key={file.id}
                    file={file}
                    onPreview={handlePreview}
                  />
                ))}
              </div>
            )}
          </div>
        )
      ))}

      {/* Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          url={previewUrl}
          onClose={closePreview}
        />
      )}
    </div>
  );
}

// List view item
function FileListItem({ file, onPreview }) {
  const { getFileIcon, formatFileSize, downloadFile } = require('../../hooks/useFiles');
  const { formatDate } = require('../../lib/utils');

  return (
    <div className="flex items-center gap-4 p-3 hover:bg-neutral-50">
      <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">{file.filename}</p>
        <p className="text-xs text-neutral-500">{formatFileSize(file.size_bytes)}</p>
      </div>
      <span className="text-xs text-neutral-400 hidden sm:block">
        {formatDate(file.created_at)}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPreview(file, null)}
          className="p-1.5 text-neutral-400 hover:text-neutral-600"
          title="Preview"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
        <button
          onClick={() => downloadFile(file.bucket, file.path, file.filename)}
          className="p-1.5 text-neutral-400 hover:text-neutral-600"
          title="Download"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default FileBrowser;
