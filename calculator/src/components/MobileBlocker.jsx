import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // If not mobile, show children
  if (!isMobile) {
    return children;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FAFAFA] flex items-center justify-center p-6">
      {/* Language switcher in corner */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="max-w-sm w-full text-center">
        {/* Icon illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            {/* Desktop icon (main) */}
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-neutral-200">
              <Icon name="monitor" size={40} className="text-neutral-700" />
            </div>
            {/* Mobile icon (crossed out, smaller) */}
            <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-white rounded-xl flex items-center justify-center border border-neutral-200 shadow-sm">
              <Icon name="smartphone" size={18} className="text-neutral-400" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-0.5 bg-red-400 rotate-45 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">
          {t('mobileBlocker.title')}
        </h1>

        {/* Description */}
        <p className="text-neutral-500 text-sm leading-relaxed">
          {t('mobileBlocker.description')}
        </p>
      </div>
    </div>
  );
}
