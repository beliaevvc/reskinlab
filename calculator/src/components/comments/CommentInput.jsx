import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddComment } from '../../hooks/useComments';
import { useUploadFiles, BUCKETS, getFileIcon, formatFileSize } from '../../hooks/useFiles';
import { useAuth } from '../../contexts/AuthContext';

export function CommentInput({ 
  entityType, 
  entityId, 
  projectId,
  taskId,
  replyingTo,
  onCancelReply,
  onCommentAdded 
}) {
  const { t } = useTranslation('comments');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  const { isClient } = useAuth();
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();
  const uploadFiles = useUploadFiles();

  const isUploading = uploadFiles.isPending;
  const isPending = isAddingComment || isUploading;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" is too large. Max size is 50MB`);
        return false;
      }
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
    e.target.value = ''; // Reset input
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const hasContent = content.trim();
    const hasFiles = selectedFiles.length > 0;
    
    if (!hasContent && !hasFiles) return;

    try {
      let uploadedFileIds = [];
      
      // Upload files first if any
      if (hasFiles && projectId) {
        const bucket = isClient ? BUCKETS.REFERENCES : BUCKETS.DELIVERABLES;
        
        const { results } = await uploadFiles.mutateAsync({
          files: selectedFiles,
          projectId,
          taskId,
          bucket,
        });
        
        // Get IDs of uploaded files
        uploadedFileIds = results.map(f => f.id);
      }

      // Create comment with attachments (even if no text, send files as message)
      const messageContent = hasContent ? content.trim() : (hasFiles ? '' : '');
      
      if (hasContent || hasFiles) {
        addComment(
          {
            entityType,
            entityId,
            content: messageContent || ' ', // Space if only files (content is required)
            parentCommentId: replyingTo?.id || null,
            attachments: uploadedFileIds,
          },
          {
            onSuccess: () => {
              setContent('');
              setSelectedFiles([]);
              onCancelReply?.();
              onCommentAdded?.();
            },
          }
        );
      }
    } catch (err) {
      console.error('Failed to send:', err);
      alert('Failed to send message: ' + err.message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="space-y-2">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 rounded-lg text-sm">
          <div className="w-1 h-8 bg-emerald-500 rounded-full" />
          <div className="flex-1 min-w-0">
            <span className="text-neutral-500">{t('input.replyTo', { name: '' })}</span>
            <span className="font-medium text-neutral-700">{replyingTo.author?.full_name}</span>
            <p className="text-neutral-500 truncate text-xs">{replyingTo.content}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-neutral-50 rounded-lg">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-neutral-200 text-sm"
            >
              <span>{getFileIcon(file.type)}</span>
              <div className="min-w-0 max-w-[120px]">
                <p className="truncate text-neutral-700 text-xs font-medium">{file.name}</p>
                <p className="text-neutral-400 text-xs">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="p-0.5 text-neutral-400 hover:text-red-500 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        {/* File attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors disabled:opacity-50"
          title="Attach files"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

        {/* Text input */}
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('input.placeholder')}
            rows={1}
            disabled={isPending}
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-2xl resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm disabled:opacity-50 disabled:bg-neutral-50 block"
            style={{ maxHeight: '120px', minHeight: '42px' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={(!content.trim() && selectedFiles.length === 0) || isPending}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}

export default CommentInput;
