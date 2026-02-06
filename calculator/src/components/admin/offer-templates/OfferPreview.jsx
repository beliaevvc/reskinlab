import { useState, useMemo } from 'react';
import { parseLegalText } from '../../offers/LegalTextModal';

// Special delimiters to mark variable values in rendered text
const VAR_START = '\u0000';
const VAR_END = '\u0001';

/**
 * Renders template text, wrapping variable values in special markers.
 */
function renderWithMarkers(text, resolvedVars) {
  if (!text) return '';
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (resolvedVars[key] !== undefined) {
      return `${VAR_START}${resolvedVars[key]}${VAR_END}`;
    }
    return match;
  });
}

/**
 * Renders plain text with **bold** and *italic* as styled elements.
 */
function renderFormatted(str) {
  if (!str) return [str];
  const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`f${i}`} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={`f${i}`}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

/**
 * Renders a text string, highlighting variable markers as green chips
 * and **bold** / *italic* as styled text.
 */
function HighlightText({ text }) {
  if (!text) return null;

  const parts = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    const startIdx = remaining.indexOf(VAR_START);
    if (startIdx === -1) {
      parts.push(<span key={idx}>{renderFormatted(remaining)}</span>);
      break;
    }

    // Text before marker
    if (startIdx > 0) {
      parts.push(<span key={idx}>{renderFormatted(remaining.slice(0, startIdx))}</span>);
      idx++;
    }

    const endIdx = remaining.indexOf(VAR_END, startIdx + 1);
    if (endIdx === -1) {
      parts.push(<span key={idx}>{renderFormatted(remaining.slice(startIdx + 1))}</span>);
      break;
    }

    // Variable value — highlighted
    const value = remaining.slice(startIdx + 1, endIdx);
    parts.push(
      <span
        key={idx}
        className="inline-block bg-emerald-100 text-emerald-800 px-1 rounded font-medium"
      >
        {value}
      </span>
    );
    idx++;
    remaining = remaining.slice(endIdx + 1);
  }

  return <>{parts}</>;
}

/**
 * Legal document renderer with variable highlighting.
 * Same structure as LegalDocument but renders text through HighlightText.
 */
function PreviewDocument({ text }) {
  const { title, sections, footer } = useMemo(() => parseLegalText(text), [text]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Title */}
      {title && (
        <div className="text-center mb-8 pb-6 border-b-2 border-neutral-900">
          <h1 className="text-base font-bold tracking-widest text-neutral-900 uppercase">
            <HighlightText text={title} />
          </h1>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-8">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            {section.title && (
              <div className="flex items-baseline gap-3 mb-4">
                <span className="flex-shrink-0 w-7 h-7 rounded bg-neutral-900 text-white text-xs font-bold flex items-center justify-center">
                  {section.number}
                </span>
                <h2 className="text-sm font-bold tracking-wide text-neutral-900 uppercase">
                  <HighlightText text={section.title} />
                </h2>
              </div>
            )}

            <div className={`space-y-3 ${section.title ? 'pl-10' : ''}`}>
              {section.items.map((item, iIdx) => {
                switch (item.type) {
                  case 'paragraph':
                    return (
                      <p key={iIdx} className="text-sm leading-relaxed text-neutral-600">
                        <HighlightText text={item.text} />
                      </p>
                    );
                  case 'bullet':
                    return (
                      <div key={iIdx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                        <p className="text-sm leading-relaxed text-neutral-600">
                          <HighlightText text={item.text} />
                        </p>
                      </div>
                    );
                  case 'numlist':
                    return (
                      <div key={iIdx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-100 text-neutral-500 text-xs font-medium flex items-center justify-center mt-0.5">
                          {item.number}
                        </span>
                        <p className="text-sm leading-relaxed text-neutral-600">
                          <HighlightText text={item.text} />
                        </p>
                      </div>
                    );
                  case 'sub':
                    return (
                      <div key={iIdx} className="flex items-start gap-3">
                        <span className="flex-shrink-0 text-xs font-mono text-neutral-400 mt-0.5 w-8 text-right">
                          {item.number}
                        </span>
                        <p className="text-sm leading-relaxed text-neutral-600">
                          <HighlightText text={item.text} />
                        </p>
                      </div>
                    );
                  case 'label':
                    return (
                      <p key={iIdx} className="text-sm font-semibold text-neutral-700 pt-1">
                        <HighlightText text={item.text} />
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
              <HighlightText text={line} />
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * OfferPreview — renders a live preview of the offer template
 * with variable highlighting in green.
 */
export function OfferPreview({ content, variables, onPrint }) {
  const [previewMode, setPreviewMode] = useState('placeholder');

  const resolvedVars = useMemo(() => {
    if (previewMode === 'sample') {
      return getSampleVariables(variables);
    }
    const placeholders = {};
    for (const v of variables || []) {
      placeholders[v.key] = `${v.label}`;
    }
    return placeholders;
  }, [variables, previewMode]);

  const renderedText = useMemo(() => {
    const text = content?.text || '';
    if (!text) return '';
    return renderWithMarkers(text, resolvedVars);
  }, [content, resolvedVars]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex bg-neutral-200/70 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setPreviewMode('placeholder')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                previewMode === 'placeholder'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Переменные
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('sample')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                previewMode === 'sample'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              Пример данных
            </button>
          </div>
          <span className="text-[11px] text-neutral-400">Так увидит клиент</span>
        </div>

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-white hover:border-neutral-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Печать
          </button>
        )}
      </div>

      {/* Document preview */}
      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {renderedText ? (
          <div id="offer-preview-content" className="bg-white rounded-lg border border-neutral-200 shadow-sm p-10 max-w-4xl mx-auto">
            <PreviewDocument text={renderedText} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <svg className="w-10 h-10 mb-3 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium">Нет содержимого для превью</p>
            <p className="text-xs mt-1">Введите текст в режиме Edit</p>
          </div>
        )}
      </div>
    </div>
  );
}

function getSampleVariables(variables) {
  const sampleDate = new Date();
  sampleDate.setDate(sampleDate.getDate() + 30);

  const samples = {
    client_name: 'ООО «Пример»',
    client_contact: 'Иван Иванов',
    project_name: 'Mobile Game UI Redesign',
    grand_total: '4,500.00 USD',
    currency: 'USDT',
    valid_until: sampleDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    spec_items: '• Symbols: 15 шт.\n• Backgrounds: 5 шт.\n• UI Elements: 10 шт.',
    payment_schedule: 'See invoices for detailed payment schedule',
    terms_version: '1.0',
    publish_date: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    prepayment_amount: '2,250.00 USD',
    production_payment: '1,125.00 USD',
    final_payment: '1,125.00 USD',
  };

  const result = { ...samples };
  for (const v of variables || []) {
    if (!result[v.key]) {
      result[v.key] = `[${v.label}]`;
    }
  }
  return result;
}

export default OfferPreview;
