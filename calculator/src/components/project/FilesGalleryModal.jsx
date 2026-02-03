import { useState, useMemo } from 'react';
import { formatDate } from '../../lib/utils';

// File type icons and colors
const FILE_TYPE_CONFIG = {
  image: { 
    icon: '🖼️', 
    color: 'bg-purple-100 text-purple-700',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  },
  document: { 
    icon: '📄', 
    color: 'bg-blue-100 text-blue-700',
    extensions: ['pdf', 'doc', 'docx', 'txt', 'rtf']
  },
  spreadsheet: { 
    icon: '📊', 
    color: 'bg-green-100 text-green-700',
    extensions: ['xls', 'xlsx', 'csv']
  },
  archive: { 
    icon: '📦', 
    color: 'bg-amber-100 text-amber-700',
    extensions: ['zip', 'rar', '7z', 'tar', 'gz']
  },
  video: { 
    icon: '🎬', 
    color: 'bg-red-100 text-red-700',
    extensions: ['mp4', 'mov', 'avi', 'webm']
  },
  design: { 
    icon: '🎨', 
    color: 'bg-pink-100 text-pink-700',
    extensions: ['psd', 'ai', 'sketch', 'fig', 'xd']
  },
  other: { 
    icon: '📎', 
    color: 'bg-neutral-100 text-neutral-700',
    extensions: []
  },
};

function getFileType(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase() || '';
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(ext)) {
      return { type, ...config };
    }
  }
  return { type: 'other', ...FILE_TYPE_CONFIG.other };
}

function formatFileSize(bytes) {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FilesGalleryModal({ isOpen, onClose, files = [], projectName }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');

  // Group files by task
  const groupedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.name?.toLowerCase().includes(query) ||
        f.task?.title?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(f => getFileType(f.name).type === filter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      }
      if (sortBy === 'size') {
        return (b.file_size || 0) - (a.file_size || 0);
      }
      return 0;
    });

    // Group by task
    const grouped = {};
    filtered.forEach(file => {
      const taskKey = file.task_id || 'unassigned';
      const taskTitle = file.task?.title || 'Project Files';
      if (!grouped[taskKey]) {
        grouped[taskKey] = { title: taskTitle, files: [] };
      }
      grouped[taskKey].files.push(file);
    });

    return grouped;
  }, [files, filter, sortBy, searchQuery]);

  const totalFiles = files.length;
  const filteredCount = Object.values(groupedFiles).reduce((sum, g) => sum + g.files.length, 0);

  if (!isOpen) return null;

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
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="document">Documents</option>
              <option value="design">Design Files</option>
              <option value="archive">Archives</option>
              <option value="video">Videos</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-neutral-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="date">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="size">Largest First</option>
            </select>
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
                  <h3 className="text-sm font-medium text-neutral-700 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {group.title}
                    <span className="text-neutral-400 font-normal">({group.files.length})</span>
                  </h3>

                  {/* Files grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.files.map((file) => {
                      const fileType = getFileType(file.name);
                      return (
                        <div
                          key={file.id}
                          className="border border-neutral-200 rounded-lg p-3 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded flex items-center justify-center text-lg ${fileType.color}`}>
                              {fileType.icon}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-neutral-900 truncate" title={file.name}>
                                {file.name}
                              </div>
                              <div className="text-xs text-neutral-500 mt-0.5">
                                {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                              </div>
                              {file.uploaded_by && (
                                <div className="text-xs text-neutral-400 mt-0.5">
                                  by {file.uploaded_by.full_name || 'Unknown'}
                                </div>
                              )}
                            </div>

                            {/* Download button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement download
                                console.log('Download:', file);
                              }}
                              className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-neutral-100 rounded transition-opacity"
                              title="Download"
                            >
                              <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
