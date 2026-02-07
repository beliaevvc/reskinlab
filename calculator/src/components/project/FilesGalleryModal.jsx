import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import { getFileIcon, formatFileSize, useDeleteFile } from '../../hooks/useFiles';
import { useAuth } from '../../contexts/AuthContext';
import { Select } from '../Select';

// Get signed URL for file
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
    staleTime: 3000 * 1000,
  });
}

// File type detection
function getFileType(filename, mimeType) {
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'document';
  
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'document';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'spreadsheet';
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
  if (['psd', 'ai', 'sketch', 'fig', 'xd'].includes(ext)) return 'design';
  return 'other';
}

// Grid view file card
function FileCardGrid({ file, onTaskClick, canDelete, onDelete }) {
  const { data: signedUrl } = useSignedUrl(file.bucket, file.path);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileType = getFileType(file.filename, file.mime_type);
  const isImage = fileType === 'image';
  
  const handleDownload = (e) => {
    e.stopPropagation();
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const handleTaskClick = (e) => {
    e.stopPropagation();
    if (file.task_id && onTaskClick) {
      onTaskClick(file.task_id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(file);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden hover:border-neutral-300 hover:shadow-sm transition-all group relative">
      {/* Delete button */}
      {canDelete && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border border-neutral-200 px-2 py-1">
              <button
                onClick={handleDelete}
                className="text-xs text-red-500 font-medium"
              >
                Delete
              </button>
              <span className="text-neutral-300">|</span>
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="text-xs text-neutral-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className="p-1.5 bg-white/90 rounded-full shadow hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4 text-neutral-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Preview area */}
      {isImage && signedUrl ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-video bg-neutral-100 overflow-hidden"
        >
          <img
            src={signedUrl}
            alt={file.filename}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </a>
      ) : (
        <a
          href={signedUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center aspect-video bg-neutral-50"
        >
          <span className="text-4xl">{getFileIcon(file.mime_type)}</span>
        </a>
      )}

      {/* Info */}
      <div className="p-3">
        <div className="font-medium text-sm text-neutral-900 truncate" title={file.filename}>
          {file.filename || 'Unnamed file'}
        </div>
        <div className="text-xs text-neutral-500 mt-0.5">
          {formatFileSize(file.size_bytes)} • {formatDate(file.created_at)}
        </div>
        <div className="text-xs text-neutral-400 mt-0.5">
          by {file.uploader?.full_name || 'Unknown'}
        </div>

        {/* Task link */}
        {file.task_id && file.task && (
          <button
            onClick={handleTaskClick}
            className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 truncate max-w-full"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="truncate">{file.task.title}</span>
          </button>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-100">
          <button
            onClick={handleDownload}
            className="flex-1 text-xs text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-1 py-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

// List view file row
function FileCardList({ file, onTaskClick, canDelete, onDelete }) {
  const { data: signedUrl } = useSignedUrl(file.bucket, file.path);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileType = getFileType(file.filename, file.mime_type);
  const isImage = fileType === 'image';
  
  const handleDownload = (e) => {
    e.stopPropagation();
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const handleTaskClick = (e) => {
    e.stopPropagation();
    if (file.task_id && onTaskClick) {
      onTaskClick(file.task_id);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(file);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors group">
      {/* Thumbnail */}
      <div className="shrink-0">
        {isImage && signedUrl ? (
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={signedUrl}
              alt={file.filename}
              className="w-12 h-12 object-cover rounded"
            />
          </a>
        ) : (
          <div className="w-12 h-12 bg-neutral-100 rounded flex items-center justify-center">
            <span className="text-2xl">{getFileIcon(file.mime_type)}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <a 
          href={signedUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="font-medium text-sm text-neutral-900 hover:text-emerald-600 truncate block"
        >
          {file.filename || 'Unnamed file'}
        </a>
        <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
          <span>{formatFileSize(file.size_bytes)}</span>
          <span>•</span>
          <span>{formatDate(file.created_at)}</span>
          <span>•</span>
          <span>by {file.uploader?.full_name || 'Unknown'}</span>
        </div>
        {file.task_id && file.task && (
          <button
            onClick={handleTaskClick}
            className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {file.task.title}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleDownload}
          className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
          title="Download"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
        {canDelete && (
          <>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-1 bg-white rounded-lg border border-neutral-200 px-2 py-1">
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-500 font-medium"
                >
                  Delete
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                  className="text-xs text-neutral-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const FILES_VIEW_MODE_KEY = 'reskin-files-view-mode';

export function FilesGalleryModal({ isOpen, onClose, files = [], projectName, onTaskClick }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem(FILES_VIEW_MODE_KEY);
    return saved === 'list' ? 'list' : 'grid';
  });
  
  const { isAdmin, user } = useAuth();
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem(FILES_VIEW_MODE_KEY, mode);
  };

  // Process and filter files
  const processedFiles = useMemo(() => {
    let filtered = [...files];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.filename?.toLowerCase().includes(query) ||
        f.task?.title?.toLowerCase().includes(query) ||
        f.uploader?.full_name?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(f => getFileType(f.filename, f.mime_type) === filter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'name') {
        return (a.filename || '').localeCompare(b.filename || '');
      }
      if (sortBy === 'size') {
        return (b.size_bytes || 0) - (a.size_bytes || 0);
      }
      return 0;
    });

    return filtered;
  }, [files, filter, sortBy, searchQuery]);

  // Group by task
  const groupedFiles = useMemo(() => {
    const grouped = {};
    processedFiles.forEach(file => {
      const taskKey = file.task_id || 'unassigned';
      const taskTitle = file.task?.title || 'Project Files';
      if (!grouped[taskKey]) {
        grouped[taskKey] = { title: taskTitle, taskId: file.task_id, files: [] };
      }
      grouped[taskKey].files.push(file);
    });
    return grouped;
  }, [processedFiles]);

  const totalFiles = files.length;
  const filteredCount = processedFiles.length;

  const handleDeleteFile = (file) => {
    deleteFile({
      fileId: file.id,
      bucket: file.bucket,
      path: file.path,
      projectId: file.project_id,
    });
  };

  const canDeleteFile = (file) => {
    return isAdmin || file.uploaded_by === user?.id;
  };

  if (!isOpen) return null;

  const FileCard = viewMode === 'grid' ? FileCardGrid : FileCardList;

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 z-[100] flex items-start justify-center overflow-y-auto py-8"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-5xl mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 rounded-t-lg z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Project Files</h2>
              <p className="text-sm text-neutral-500">
                {totalFiles} files total • {filteredCount} shown
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded text-neutral-500"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Type filter */}
            <Select
              value={filter}
              onChange={(val) => setFilter(val)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'image', label: 'Images' },
                { value: 'document', label: 'Documents' },
                { value: 'design', label: 'Design Files' },
                { value: 'archive', label: 'Archives' },
                { value: 'video', label: 'Videos' },
              ]}
              className="min-w-[130px]"
            />

            {/* Sort */}
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val)}
              options={[
                { value: 'date', label: 'Newest First' },
                { value: 'name', label: 'Name A-Z' },
                { value: 'size', label: 'Largest First' },
              ]}
              className="min-w-[130px]"
            />

            {/* View toggle */}
            <div className="flex items-center border border-neutral-200 rounded overflow-hidden">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                title="Grid view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600'}`}
                title="List view"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
          {Object.keys(groupedFiles).length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-1">No files found</h3>
              <p className="text-neutral-500">
                {searchQuery || filter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Files uploaded to tasks will appear here'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedFiles).map(([taskId, group]) => (
                <div key={taskId}>
                  {/* Task header */}
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {group.taskId ? (
                      <button
                        onClick={() => onTaskClick?.(group.taskId)}
                        className="text-sm font-medium text-neutral-700 hover:text-emerald-600"
                      >
                        {group.title}
                      </button>
                    ) : (
                      <span className="text-sm font-medium text-neutral-700">{group.title}</span>
                    )}
                    <span className="text-neutral-400 text-sm">({group.files.length})</span>
                  </div>

                  {/* Files */}
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.files.map((file) => (
                        <FileCardGrid 
                          key={file.id} 
                          file={file} 
                          onTaskClick={onTaskClick}
                          canDelete={canDeleteFile(file)}
                          onDelete={handleDeleteFile}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.files.map((file) => (
                        <FileCardList 
                          key={file.id} 
                          file={file} 
                          onTaskClick={onTaskClick}
                          canDelete={canDeleteFile(file)}
                          onDelete={handleDeleteFile}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilesGalleryModal;
