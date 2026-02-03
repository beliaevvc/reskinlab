import { useTaskFiles, useFileUrl, useDeleteFile, getFileIcon, formatFileSize } from '../../hooks/useFiles';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

function FileItem({ file, projectId }) {
  const { isAdmin, user } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const { data: signedUrl } = useFileUrl(file.bucket, file.path);
  const { mutate: deleteFile, isPending: isDeleting } = useDeleteFile();

  const canDelete = isAdmin || file.uploaded_by === user?.id;
  const isImage = file.mime_type?.startsWith('image/');

  const handleDelete = () => {
    deleteFile({
      fileId: file.id,
      bucket: file.bucket,
      path: file.path,
      projectId,
    });
    setShowDelete(false);
  };

  return (
    <div className="group relative">
      {isImage && signedUrl ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <img
            src={signedUrl}
            alt={file.filename}
            className="w-full h-24 object-cover rounded-lg border border-neutral-200 hover:border-emerald-300 transition-colors"
          />
        </a>
      ) : (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-emerald-300 transition-colors"
        >
          <span className="text-lg">{getFileIcon(file.mime_type)}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-700 truncate">{file.filename}</p>
            <p className="text-[10px] text-neutral-400">{formatFileSize(file.size_bytes)}</p>
          </div>
        </a>
      )}

      {/* Delete button */}
      {canDelete && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {showDelete ? (
            <div className="flex items-center gap-1 bg-white rounded shadow-lg border border-neutral-200 px-1.5 py-0.5">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-[10px] text-red-500 font-medium"
              >
                {isDeleting ? '...' : 'Delete'}
              </button>
              <button
                onClick={() => setShowDelete(false)}
                className="text-[10px] text-neutral-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDelete(true)}
              className="p-1 bg-white/90 rounded-full shadow hover:bg-red-50 transition-colors"
            >
              <svg className="w-3 h-3 text-neutral-400 hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskFiles({ taskId, projectId }) {
  const { data: files, isLoading } = useTaskFiles(taskId);

  if (isLoading) {
    return (
      <div className="text-xs text-neutral-400">Loading files...</div>
    );
  }

  if (!files || files.length === 0) {
    return null;
  }

  const images = files.filter(f => f.mime_type?.startsWith('image/'));
  const otherFiles = files.filter(f => !f.mime_type?.startsWith('image/'));

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-medium text-neutral-500 flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        Attachments ({files.length})
      </h5>

      {/* Images grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((file) => (
            <FileItem key={file.id} file={file} projectId={projectId} />
          ))}
        </div>
      )}

      {/* Other files list */}
      {otherFiles.length > 0 && (
        <div className="space-y-1">
          {otherFiles.map((file) => (
            <FileItem key={file.id} file={file} projectId={projectId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskFiles;
