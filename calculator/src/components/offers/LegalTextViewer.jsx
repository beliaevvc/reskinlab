import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function LegalTextViewer({ text, onScrolledToBottom }) {
  const { t } = useTranslation('offers');
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const containerRef = useRef(null);

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      onScrolledToBottom?.();
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasScrolledToBottom]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="max-h-[400px] overflow-y-auto bg-neutral-50 rounded border border-neutral-200 p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap"
      >
        {text}
      </div>

      {!hasScrolledToBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-neutral-100 to-transparent pointer-events-none flex items-end justify-center pb-2">
          <div className="flex items-center gap-2 text-sm text-neutral-500 animate-bounce">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            {t('accept.scrollToRead', { defaultValue: 'Scroll to read all terms' })}
          </div>
        </div>
      )}
    </div>
  );
}

export default LegalTextViewer;
