import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Monitor, Smartphone } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';

const MOBILE_BREAKPOINT = 768;

// Check mobile on initial load (before React hydration)
const getInitialIsMobile = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }
  return false;
};

export function MobileBlocker({ children }) {
  const { t } = useTranslation('common');
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If not mobile or user dismissed, show children
  if (!isMobile || dismissed) {
    return children;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-6">
      {/* Language switcher in corner */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher className="text-white hover:bg-white/10 [&_svg]:text-white/80" />
      </div>

      <div className="max-w-sm w-full text-center">
        {/* Icon illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Desktop icon (main) */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
              <Monitor className="w-12 h-12 text-white" />
            </div>
            {/* Mobile icon (crossed out, smaller) */}
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-neutral-700 rounded-xl flex items-center justify-center border-2 border-neutral-900">
              <Smartphone className="w-5 h-5 text-neutral-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-0.5 bg-red-500 rotate-45 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-3">
          {t('mobileBlocker.title')}
        </h1>

        {/* Description */}
        <p className="text-neutral-400 mb-8 leading-relaxed">
          {t('mobileBlocker.description')}
        </p>

        {/* Features list */}
        <div className="bg-white/5 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm text-neutral-300 mb-3">{t('mobileBlocker.features.title')}</p>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {t('mobileBlocker.features.charts')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {t('mobileBlocker.features.kanban')}
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              {t('mobileBlocker.features.files')}
            </li>
          </ul>
        </div>

        {/* Continue anyway button */}
        <button
          onClick={() => setDismissed(true)}
          className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors underline underline-offset-4"
        >
          {t('mobileBlocker.continueAnyway')}
        </button>
      </div>
    </div>
  );
}
