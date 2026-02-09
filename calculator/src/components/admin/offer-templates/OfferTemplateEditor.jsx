import { useState, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { useTranslation } from 'react-i18next';
import { VariableMention } from './VariableMention';
import { SlashCommandMenu } from './SlashCommandMenu';

/**
 * Unified single-editor for offer template content.
 * Floating BubbleMenu on text selection, slash commands for variables.
 */
export function OfferTemplateEditor({ content, onChange, variables, contentLang = 'en' }) {
  const [slashState, setSlashState] = useState(null);
  const slashStateRef = useRef(null);
  const contentLoadedRef = useRef(false);

  useEffect(() => {
    slashStateRef.current = slashState;
  }, [slashState]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: '', // Set dynamically via CSS or keep empty
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      VariableMention,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = extractTextWithVariables(json);
      onChange({ text, tiptap_json: json });
      checkSlashTrigger(editor);
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[400px] prose prose-sm max-w-none prose-neutral prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed',
      },
    },
  });

  // Load content into editor when data arrives from server
  useEffect(() => {
    if (!editor) return;
    const hasText = content?.text && content.text.trim().length > 0;
    const hasTiptap = content?.tiptap_json;

    if ((hasText || hasTiptap) && !contentLoadedRef.current) {
      const parsed = parseContent(content);
      if (parsed) {
        editor.commands.setContent(parsed);
        contentLoadedRef.current = true;
      }
    }
  }, [editor, content]);

  // ── Slash command detection ───────────────────

  const checkSlashTrigger = useCallback((ed) => {
    if (!ed) return;

    const { from } = ed.state.selection;
    const textBefore = ed.state.doc.textBetween(
      Math.max(0, from - 50),
      from,
      '\0'
    );

    const slashIdx = textBefore.lastIndexOf('/');

    if (slashIdx === -1) {
      if (slashStateRef.current) setSlashState(null);
      return;
    }

    const query = textBefore.slice(slashIdx + 1);
    const charBefore = slashIdx > 0 ? textBefore[slashIdx - 1] : '';
    const isWordStart = !charBefore || charBefore === ' ' || charBefore === '\n' || charBefore === '\0';

    if (!isWordStart || query.length > 30) {
      if (slashStateRef.current) setSlashState(null);
      return;
    }

    try {
      const coords = ed.view.coordsAtPos(from);
      const absoluteFrom = from - textBefore.length + slashIdx;
      setSlashState({
        from: absoluteFrom,
        to: from,
        query,
        coords: { top: coords.bottom, left: coords.left },
      });
    } catch {
      // coords might fail in edge cases
    }
  }, []);

  // ── Slash variable insertion ──────────────────

  const handleSlashSelect = useCallback((item) => {
    if (!editor || !slashState) return;

    if (item.type === 'variable') {
      const { from, to } = slashState;
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent({
          type: 'variableMention',
          attrs: { variableKey: item.key, variableLabel: item.label },
        })
        .run();
    }

    setSlashState(null);
  }, [editor, slashState]);

  const handleSlashClose = useCallback(() => {
    setSlashState(null);
    editor?.commands.focus();
  }, [editor]);

  return (
    <div className="flex flex-col h-full">
      {/* Editor body — BubbleMenu must be inside the same scroll container */}
      <div className="flex-1 overflow-y-auto bg-white" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        <div className="max-w-5xl mx-auto py-10 px-12 relative">
          <EditorContent editor={editor} />

          {/* Floating BubbleMenu — inside scroll container so it scrolls with text */}
          {editor && (
            <BubbleMenu
              editor={editor}
              options={{ placement: 'top', offset: 8 }}
            >
              <div className="flex items-center gap-0.5 px-1.5 py-1 bg-neutral-900 rounded-lg shadow-xl border border-neutral-700/50">
                <BubbleBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
                  <span className="font-bold">B</span>
                </BubbleBtn>
                <BubbleBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
                  <span className="italic">I</span>
                </BubbleBtn>
                <BubbleBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
                  <span className="underline">U</span>
                </BubbleBtn>
                <BubbleSep />
                <BubbleBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">
                  <span className="font-bold">H2</span>
                </BubbleBtn>
                <BubbleBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">
                  <span className="font-bold">H3</span>
                </BubbleBtn>
                <BubbleSep />
                <BubbleBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="List">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
                </BubbleBtn>
                <BubbleSep />
                <BubbleBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Left">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" /></svg>
                </BubbleBtn>
                <BubbleBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" /></svg>
                </BubbleBtn>
              </div>
            </BubbleMenu>
          )}
        </div>
      </div>

      {/* Slash command menu */}
      <SlashCommandMenu
        isOpen={!!slashState}
        coords={slashState?.coords}
        query={slashState?.query || ''}
        variables={variables || []}
        contentLang={contentLang}
        onSelect={handleSlashSelect}
        onClose={handleSlashClose}
      />

      {/* Formatting hints */}
      <FormatHints />
    </div>
  );
}

function FormatHints() {
  const { t } = useTranslation('admin');
  return (
    <div className="shrink-0 sticky bottom-0 border-t border-neutral-100 bg-neutral-50/95 backdrop-blur-sm px-4 py-2">
      <div className="flex items-center gap-4 text-[11px] flex-wrap">
        <span className="text-neutral-400 font-medium shrink-0">{t('offerTemplates.editor.formatHints.format')}</span>
        <div className="flex items-center gap-1.5">
          <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-neutral-600 font-mono">1. UPPERCASE</code>
          <span className="text-neutral-400">{t('offerTemplates.editor.formatHints.section')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-neutral-600 font-mono">•</code>
          <span className="text-neutral-400">{t('offerTemplates.editor.formatHints.bullet')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-neutral-600 font-mono">1.1.</code>
          <span className="text-neutral-400">{t('offerTemplates.editor.formatHints.subitem')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-neutral-600 font-mono">Text:</code>
          <span className="text-neutral-400">{t('offerTemplates.editor.formatHints.label')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <code className="px-1 py-0.5 bg-neutral-200/70 rounded text-neutral-600 font-mono">/</code>
          <span className="text-neutral-400">{t('offerTemplates.editor.formatHints.variable')}</span>
        </div>
      </div>
    </div>
  );
}

// ── Bubble menu helpers ─────────────────────────

function BubbleBtn({ active, onClick, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded text-[11px] transition-colors ${
        active
          ? 'bg-white/20 text-white'
          : 'text-neutral-400 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}

function BubbleSep() {
  return <div className="w-px h-4 bg-neutral-700 mx-0.5" />;
}

// ── Content helpers ─────────────────────────────

function parseContent(content) {
  if (!content) return '';
  if (content.tiptap_json) return content.tiptap_json;

  const text = content.text || '';
  if (!text) return '';

  const paragraphs = text.split('\n');
  const doc = { type: 'doc', content: [] };

  for (const para of paragraphs) {
    if (para.trim() === '') {
      doc.content.push({ type: 'paragraph' });
      continue;
    }
    const inlineContent = [];
    // Split by variables AND bold/italic markers
    const parts = para.split(/(\{\{\w+\}\}|\*\*[^*]+\*\*|\*[^*]+\*)/);
    for (const part of parts) {
      const varMatch = part.match(/^\{\{(\w+)\}\}$/);
      if (varMatch) {
        inlineContent.push({
          type: 'variableMention',
          attrs: { variableKey: varMatch[1], variableLabel: varMatch[1] },
        });
      } else if (part.startsWith('**') && part.endsWith('**')) {
        inlineContent.push({
          type: 'text',
          text: part.slice(2, -2),
          marks: [{ type: 'bold' }],
        });
      } else if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        inlineContent.push({
          type: 'text',
          text: part.slice(1, -1),
          marks: [{ type: 'italic' }],
        });
      } else if (part) {
        inlineContent.push({ type: 'text', text: part });
      }
    }
    doc.content.push({
      type: 'paragraph',
      content: inlineContent.length > 0 ? inlineContent : undefined,
    });
  }
  return doc;
}

function extractTextWithVariables(json) {
  if (!json?.content) return '';
  const lines = [];
  for (const node of json.content) {
    if (node.type === 'paragraph' || node.type === 'heading') {
      lines.push(extractNodeText(node));
    } else if (node.type === 'bulletList' || node.type === 'orderedList') {
      for (const item of node.content || []) {
        for (const para of item.content || []) {
          lines.push(`• ${extractNodeText(para)}`);
        }
      }
    } else if (node.type === 'horizontalRule') {
      lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
  }
  return lines.join('\n');
}

function extractNodeText(node) {
  if (!node.content) return '';
  return node.content
    .map((c) => {
      if (c.type === 'text') {
        let text = c.text || '';
        const marks = c.marks || [];
        if (marks.some((m) => m.type === 'bold')) text = `**${text}**`;
        if (marks.some((m) => m.type === 'italic')) text = `*${text}*`;
        return text;
      }
      if (c.type === 'variableMention') return `{{${c.attrs?.variableKey || ''}}}`;
      return '';
    })
    .join('');
}

export default OfferTemplateEditor;
