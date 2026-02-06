import { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { VariableMention } from './VariableMention';
import { SlashCommandMenu } from './SlashCommandMenu';

/**
 * Minimal block editor — no toolbar, just content.
 * Supports slash commands (/) to insert variables.
 */
export function OfferBlockEditor({ content, onChange, placeholder, onFocus, onBlur, editorRef, variables }) {
  const initialContent = parseContent(content);
  const [slashState, setSlashState] = useState(null); // { from, query, coords }
  const slashStateRef = useRef(null);

  // Keep ref in sync
  useEffect(() => {
    slashStateRef.current = slashState;
  }, [slashState]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Type / to insert variable...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      VariableMention,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      const text = extractTextWithVariables(json);
      onChange({ text, tiptap_json: json });

      // Check for slash command trigger
      checkSlashTrigger(editor);
    },
    onFocus: () => onFocus?.(editor),
    onBlur: () => {
      // Delay to allow menu clicks
      setTimeout(() => {
        if (!slashStateRef.current) {
          onBlur?.();
        }
      }, 200);
    },
    editorProps: {
      attributes: {
        class: 'outline-none min-h-[1.5em]',
      },
      handleKeyDown: (view, event) => {
        // Let the slash menu handle arrow keys, enter, escape
        if (slashStateRef.current) {
          if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) {
            // These are handled by the SlashCommandMenu via document listener
            return false;
          }
        }
        return false;
      },
    },
  });

  // Expose editor to parent via ref callback
  useEffect(() => {
    if (editorRef) editorRef.current = editor;
  }, [editor, editorRef]);

  // ── Slash command detection ───────────────────

  const checkSlashTrigger = useCallback((ed) => {
    if (!ed) return;

    const { from } = ed.state.selection;
    const textBefore = ed.state.doc.textBetween(
      Math.max(0, from - 50),
      from,
      '\0'
    );

    // Find the last "/" that could be a trigger
    const slashIdx = textBefore.lastIndexOf('/');

    if (slashIdx === -1) {
      if (slashStateRef.current) setSlashState(null);
      return;
    }

    const query = textBefore.slice(slashIdx + 1);

    // Slash should be at the start of a word (preceded by space, newline, or start)
    const charBefore = slashIdx > 0 ? textBefore[slashIdx - 1] : '';
    const isWordStart = !charBefore || charBefore === ' ' || charBefore === '\n' || charBefore === '\0';

    if (!isWordStart) {
      if (slashStateRef.current) setSlashState(null);
      return;
    }

    // Don't open menu if query is too long (user probably isn't looking for a command)
    if (query.length > 30) {
      if (slashStateRef.current) setSlashState(null);
      return;
    }

    // Get coords for positioning
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

  // ── Handle variable selection from slash menu ─

  const handleSlashSelect = useCallback((item) => {
    if (!editor || !slashState) return;

    if (item.type === 'variable') {
      // Delete the "/" + query text, then insert variable mention
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
    <>
      <EditorContent editor={editor} />

      {/* Slash command menu */}
      <SlashCommandMenu
        isOpen={!!slashState}
        coords={slashState?.coords}
        query={slashState?.query || ''}
        variables={variables || []}
        onSelect={handleSlashSelect}
        onClose={handleSlashClose}
      />
    </>
  );
}

// ── Helpers ──────────────────────────────────────

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
    const parts = para.split(/(\{\{\w+\}\})/);
    for (const part of parts) {
      const varMatch = part.match(/^\{\{(\w+)\}\}$/);
      if (varMatch) {
        inlineContent.push({
          type: 'variableMention',
          attrs: { variableKey: varMatch[1], variableLabel: varMatch[1] },
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
    }
  }
  return lines.join('\n');
}

function extractNodeText(node) {
  if (!node.content) return '';
  return node.content
    .map((c) => {
      if (c.type === 'text') return c.text || '';
      if (c.type === 'variableMention') return `{{${c.attrs?.variableKey || ''}}}`;
      return '';
    })
    .join('');
}

export default OfferBlockEditor;
