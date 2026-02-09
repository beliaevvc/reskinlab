import { useLanguageContext } from '../contexts/LanguageContext';

/**
 * Globe icon component
 */
function GlobeIcon({ className = '' }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/**
 * Language switcher component for the header
 * Toggles between English and Russian
 */
export function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, isRussian } = useLanguageContext();
  
  const currentLangCode = isRussian ? 'RU' : 'EN';

  const handleToggle = () => {
    setLanguage(isRussian ? 'en' : 'ru');
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        flex items-center gap-1.5 px-2 py-1.5 
        text-sm font-medium text-neutral-600 
        hover:text-emerald-600 hover:bg-emerald-50 
        rounded-md transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        ${className}
      `}
      title={isRussian ? 'Switch to English' : 'Переключить на русский'}
      aria-label={isRussian ? 'Switch to English' : 'Переключить на русский'}
    >
      <GlobeIcon className="w-4 h-4 text-emerald-500" />
      <span className="hidden sm:inline">
        {currentLangCode}
      </span>
    </button>
  );
}

/**
 * Alternative dropdown-style language switcher
 */
export function LanguageDropdown({ className = '' }) {
  const { language, setLanguage } = useLanguageContext();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ];

  const currentLang = languages.find(l => 
    language?.startsWith(l.code)
  ) || languages[0];

  return (
    <div className={`relative group ${className}`}>
      <button
        className="
          flex items-center gap-1.5 px-2 py-1.5 
          text-sm font-medium text-neutral-600 
          hover:text-emerald-600 hover:bg-emerald-50 
          rounded-md transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        "
        aria-haspopup="listbox"
        aria-expanded="false"
      >
        <GlobeIcon className="w-4 h-4 text-emerald-500" />
        <span>{currentLang.code.toUpperCase()}</span>
        <svg 
          className="w-4 h-4 text-neutral-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <div className="
        absolute right-0 mt-1 w-36
        bg-white rounded-md shadow-lg border border-neutral-200
        opacity-0 invisible group-hover:opacity-100 group-hover:visible
        transition-all duration-150 z-50
      ">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 text-sm
              hover:bg-emerald-50 transition-colors
              ${language?.startsWith(lang.code) 
                ? 'text-emerald-600 font-medium bg-emerald-50' 
                : 'text-neutral-700'
              }
              first:rounded-t-md last:rounded-b-md
            `}
            role="option"
            aria-selected={language?.startsWith(lang.code)}
          >
            <GlobeIcon className={`w-4 h-4 ${language?.startsWith(lang.code) ? 'text-emerald-500' : 'text-neutral-400'}`} />
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
