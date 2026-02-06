import { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  useOfferBlockLibrary,
  useCreateLibraryBlock,
  useUpdateLibraryBlock,
  useDeleteLibraryBlock,
} from '../../../hooks/useOfferTemplates';

const CATEGORY_LABELS = {
  legal: 'Legal',
  financial: 'Financial',
  general: 'General',
};

const CATEGORY_COLORS = {
  legal: 'bg-purple-100 text-purple-700',
  financial: 'bg-emerald-100 text-emerald-700',
  general: 'bg-neutral-100 text-neutral-700',
};

// ============================================
// Block Library Modal (Create/Edit)
// ============================================
function LibraryBlockModal({ block, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    name: block?.name || '',
    category: block?.category || 'general',
    block_type: block?.block_type || 'paragraph',
    text: block?.content?.text || '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Name is required');
      return;
    }
    onSave({
      name: formData.name,
      category: formData.category,
      block_type: formData.block_type,
      content: { text: formData.text },
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded shadow-2xl w-full max-w-lg mx-4">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">
            {block ? 'Edit Library Block' : 'Add to Library'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Block name..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="general">General</option>
                <option value="legal">Legal</option>
                <option value="financial">Financial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Block Type</label>
              <select
                value={formData.block_type}
                onChange={(e) => setFormData((p) => ({ ...p, block_type: e.target.value }))}
                className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="paragraph">Paragraph</option>
                <option value="heading">Heading</option>
                <option value="variable_block">Variable Block</option>
                <option value="list">List</option>
                <option value="separator">Separator</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Content</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData((p) => ({ ...p, text: e.target.value }))}
              rows={8}
              className="w-full px-4 py-2 border border-neutral-300 rounded focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm resize-none"
              placeholder="Block content... Use {{variable_key}} for variables"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

// ============================================
// Block Library Panel (sidebar)
// ============================================
export function BlockLibraryPanel({ onInsertBlock }) {
  const { data: libraryBlocks, isLoading } = useOfferBlockLibrary();
  const createBlock = useCreateLibraryBlock();
  const updateBlock = useUpdateLibraryBlock();
  const deleteBlock = useDeleteLibraryBlock();
  const [showModal, setShowModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSave = async (data) => {
    try {
      if (editingBlock) {
        await updateBlock.mutateAsync({ id: editingBlock.id, updates: data });
      } else {
        await createBlock.mutateAsync(data);
      }
      setShowModal(false);
      setEditingBlock(null);
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this library block?')) return;
    try {
      await deleteBlock.mutateAsync(id);
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const filtered = libraryBlocks?.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by category
  const grouped = {};
  for (const b of filtered || []) {
    if (!grouped[b.category]) grouped[b.category] = [];
    grouped[b.category].push(b);
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-700">Block Library</h3>
        <button
          type="button"
          onClick={() => { setEditingBlock(null); setShowModal(true); }}
          className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100"
        >
          + Add
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-neutral-100">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search blocks..."
          className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-8 text-sm text-neutral-400">No blocks in library</div>
        ) : (
          Object.entries(grouped).map(([category, blocks]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-xs font-semibold text-neutral-400 uppercase bg-neutral-50 sticky top-0">
                {CATEGORY_LABELS[category] || category}
              </div>
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="px-4 py-2 hover:bg-neutral-50 border-b border-neutral-50 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-800">{block.name}</span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        CATEGORY_COLORS[block.category] || 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      {block.block_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onInsertBlock?.(block)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingBlock(block); setShowModal(true); }}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(block.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <LibraryBlockModal
        block={editingBlock}
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingBlock(null); }}
        onSave={handleSave}
        isSaving={createBlock.isPending || updateBlock.isPending}
      />
    </div>
  );
}

export default BlockLibraryPanel;
