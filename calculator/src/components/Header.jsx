import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Header() {
  const { t } = useTranslation('calculator');

  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-50">
      <div className="w-9 h-9 bg-emerald-500 rounded-md flex items-center justify-center font-bold text-white text-base">
        R
      </div>
      <h1 className="font-semibold text-lg hidden sm:block text-neutral-900 flex-1">
        ReSkin Lab{" "}
        <span className="text-neutral-400 font-normal text-sm">{t('title')} v2.1</span>
      </h1>
      <LanguageSwitcher />
    </header>
  );
}

export default Header;
