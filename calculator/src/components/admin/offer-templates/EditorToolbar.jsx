import { useRef } from 'react';
import { VariablePickerDropdown } from './VariablePickerDropdown';

/**
 * Shared sticky toolbar for the currently focused block editor.
 * Controls formatting of whichever TipTap editor instance is active.
 */
export function EditorToolbar({ activeEditor, variables, onInsertVariable }) {
  const variableBtnRef = useRef(null);
  const disabled = !activeEditor;

  const run = (fn) => {
    if (!activeEditor) return;
    fn(activeEditor.chain().focus());
  };

  const isActive = (name, attrs) => activeEditor?.isActive(name, attrs) ?? false;

  const btn = (active) =>
    `w-8 h-8 flex items-center justify-center rounded transition-colors text-sm ${
      disabled
        ? 'text-neutral-300 cursor-default'
        : active
        ? 'bg-neutral-800 text-white'
        : 'text-neutral-600 hover:bg-neutral-100'
    }`;

  const sep = <div className="w-px h-5 bg-neutral-200 mx-0.5" />;

  return (
    <div className="flex items-center gap-0.5 px-4 py-1.5 bg-neutral-50 border-b border-neutral-200 sticky top-0 z-20">
      {/* Bold */}
      <button type="button" onClick={() => run((c) => c.toggleBold().run())} className={btn(isActive('bold'))} title="Bold">
        <span className="font-bold text-xs">B</span>
      </button>
      {/* Italic */}
      <button type="button" onClick={() => run((c) => c.toggleItalic().run())} className={btn(isActive('italic'))} title="Italic">
        <span className="italic text-xs">I</span>
      </button>
      {/* Underline */}
      <button type="button" onClick={() => run((c) => c.toggleUnderline().run())} className={btn(isActive('underline'))} title="Underline">
        <span className="underline text-xs">U</span>
      </button>

      {sep}

      {/* H2 */}
      <button
        type="button"
        onClick={() => run((c) => c.toggleHeading({ level: 2 }).run())}
        className={btn(isActive('heading', { level: 2 }))}
        title="Heading"
      >
        <span className="text-xs font-bold">H2</span>
      </button>
      {/* H3 */}
      <button
        type="button"
        onClick={() => run((c) => c.toggleHeading({ level: 3 }).run())}
        className={btn(isActive('heading', { level: 3 }))}
        title="Subheading"
      >
        <span className="text-xs font-bold">H3</span>
      </button>

      {sep}

      {/* Bullet list */}
      <button type="button" onClick={() => run((c) => c.toggleBulletList().run())} className={btn(isActive('bulletList'))} title="Bullet list">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      </button>
      {/* Ordered list */}
      <button type="button" onClick={() => run((c) => c.toggleOrderedList().run())} className={btn(isActive('orderedList'))} title="Numbered list">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8" />
        </svg>
      </button>

      {sep}

      {/* Align */}
      <button type="button" onClick={() => run((c) => c.setTextAlign('left').run())} className={btn(isActive({ textAlign: 'left' }))} title="Left">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" /></svg>
      </button>
      <button type="button" onClick={() => run((c) => c.setTextAlign('center').run())} className={btn(isActive({ textAlign: 'center' }))} title="Center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" /></svg>
      </button>

      <div className="flex-1" />

      {/* Variable picker */}
      {variables?.length > 0 && (
        <VariablePickerDropdown
          variables={variables}
          onSelect={(v) => onInsertVariable?.(v)}
          triggerRef={variableBtnRef}
        />
      )}
    </div>
  );
}

export default EditorToolbar;
