import { useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { printLegalText } from '../../lib/printUtils';

/**
 * Parse plain legal text into structured sections for styled rendering.
 * Recognizes: title, separator lines (━), numbered sections, bullet points, sub-items.
 */
function parseLegalText(text) {
  if (!text) return { title: '', sections: [], footer: [] };

  const lines = text.split('\n');
  const title = lines[0]?.trim() || '';
  const sections = [];
  const footer = [];
  let current = null;
  let inFooter = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip separator lines
    if (/^[━─═─]{3,}$/.test(trimmed)) continue;

    // Empty line
    if (!trimmed) continue;

    // Detect footer (after last section, starts with "Версия" or "©")
    if (/^(Версия|©|Дата публикации)/.test(trimmed)) {
      inFooter = true;
    }

    if (inFooter) {
      footer.push(trimmed);
      continue;
    }

    // Detect section header: "1. ПРЕДМЕТ ОФЕРТЫ" pattern
    const sectionMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (sectionMatch && trimmed === trimmed.toUpperCase()) {
      current = {
        number: sectionMatch[1],
        title: sectionMatch[2],
        items: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      // Text before first section — treat as intro
      if (!sections.length) {
        current = { number: null, title: null, items: [] };
        sections.push(current);
      } else {
        continue;
      }
    }

    // Bullet point: "• Text"
    if (trimmed.startsWith('•')) {
      current.items.push({ type: 'bullet', text: trimmed.slice(1).trim() });
      continue;
    }

    // Sub-item: "5.1. Text" or "1. Text" inside section
    const subMatch = trimmed.match(/^(\d+\.\d+)\.\s+(.+)$/);
    if (subMatch) {
      current.items.push({ type: 'sub', number: subMatch[1], text: subMatch[2] });
      continue;
    }

    // Numbered list inside section: "1. Text" (but only single digit, not section header)
    const numListMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numListMatch && trimmed !== trimmed.toUpperCase()) {
      current.items.push({ type: 'numlist', number: numListMatch[1], text: numListMatch[2] });
      continue;
    }

    // Label: "Something:" pattern (like "График платежей:")
    if (trimmed.endsWith(':')) {
      current.items.push({ type: 'label', text: trimmed });
      continue;
    }

    // Regular paragraph — merge with previous paragraph if exists
    const last = current.items[current.items.length - 1];
    if (last && last.type === 'paragraph') {
      last.text += ' ' + trimmed;
    } else {
      current.items.push({ type: 'paragraph', text: trimmed });
    }
  }

  return { title, sections, footer };
}

/**
 * Renders text with **bold** and *italic* markdown markers as styled spans.
 */
function FormattedText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function LegalDocument({ text }) {
  const { title, sections, footer } = useMemo(() => parseLegalText(text), [text]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Document title */}
      {title && (
        <div className="text-center mb-8 pb-6 border-b-2 border-neutral-900">
          <h1 className="text-base font-bold tracking-widest text-neutral-900 uppercase">
            <FormattedText text={title} />
          </h1>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {/* Section header */}
            {section.title && (
              <div className="flex items-baseline gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                  {section.number}
                </span>
                <h2 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                  <FormattedText text={section.title} />
                </h2>
              </div>
            )}

            {/* Section items */}
            <div className={`space-y-3 ${section.title ? 'pl-10' : ''}`}>
              {section.items.map((item, iIdx) => {
                switch (item.type) {
                  case 'paragraph':
                    return (
                      <p key={iIdx} className="text-sm leading-relaxed text-neutral-600">
                        <FormattedText text={item.text} />
                      </p>
                    );

                  case 'bullet':
                    return (
                      <div key={iIdx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                        <p className="text-sm leading-relaxed text-neutral-600"><FormattedText text={item.text} /></p>
                      </div>
                    );

                  case 'numlist':
                    return (
                      <div key={iIdx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium flex items-center justify-center mt-0.5">
                          {item.number}
                        </span>
                        <p className="text-sm leading-relaxed text-neutral-600"><FormattedText text={item.text} /></p>
                      </div>
                    );

                  case 'sub':
                    return (
                      <div key={iIdx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-xs font-mono text-neutral-400 mt-0.5 w-8 text-right">
                          {item.number}
                        </span>
                        <p className="text-sm leading-relaxed text-neutral-600"><FormattedText text={item.text} /></p>
                      </div>
                    );

                  case 'label':
                    return (
                      <p key={iIdx} className="text-sm font-semibold text-neutral-700 pt-1">
                        <FormattedText text={item.text} />
                      </p>
                    );

                  default:
                    return null;
                }
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {footer.length > 0 && (
        <div className="mt-10 pt-6 border-t border-neutral-200 space-y-1">
          {footer.map((line, i) => (
            <p
              key={i}
              className={`text-xs ${
                line.startsWith('©')
                  ? 'font-semibold text-neutral-700 mt-2'
                  : 'text-neutral-400'
              }`}
            >
              <FormattedText text={line} />
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function LegalTextModal({ isOpen, onClose, text }) {
  const { t } = useTranslation('offers');
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !text) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 100000 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                {t('legal.title')}
              </h2>
              <p className="text-xs text-neutral-400">
                {t('legal.subtitle', { defaultValue: 'Official offer agreement' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={printLegalText}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              {t('common:print', { defaultValue: 'Print' })}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 bg-neutral-50/50">
          <div id="legal-text-view" className="bg-white rounded-lg border border-neutral-200 p-8 shadow-sm">
            <LegalDocument text={text} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t('legal.close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export { LegalDocument, parseLegalText };
export default LegalTextModal;
