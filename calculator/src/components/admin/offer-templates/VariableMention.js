import { Node, mergeAttributes } from '@tiptap/core';

/**
 * Custom TipTap node for rendering variable placeholders as inline chips.
 * Usage in editor: renders as a styled chip like [Общая стоимость]
 * Output: {{variable_key}} in text
 */
export const VariableMention = Node.create({
  name: 'variableMention',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      variableKey: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-variable-key'),
        renderHTML: (attributes) => ({
          'data-variable-key': attributes.variableKey,
        }),
      },
      variableLabel: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-variable-label'),
        renderHTML: (attributes) => ({
          'data-variable-label': attributes.variableLabel,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'variable-mention',
        contenteditable: 'false',
        style:
          'display: inline-flex; align-items: center; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 1px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 500; cursor: default; user-select: none;',
      }),
      `{{${node.attrs.variableKey}}}`,
    ];
  },

  addNodeView() {
    return ({ node }) => {
      const dom = document.createElement('span');
      dom.className = 'variable-mention';
      dom.contentEditable = 'false';
      dom.style.cssText =
        'display: inline-flex; align-items: center; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 1px 8px; border-radius: 4px; font-size: 0.85em; font-weight: 500; cursor: default; user-select: none;';
      dom.textContent = node.attrs.variableLabel || `{{${node.attrs.variableKey}}}`;
      return { dom };
    };
  },
});

export default VariableMention;
