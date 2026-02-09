import { useTranslation } from 'react-i18next';
import { STYLES as LOCAL_STYLES } from '../data';
import { Select } from './Select';
import { useLanguage } from '../hooks/useLanguage';

export function StyleSelector({ globalStyle, onStyleChange, disabled = false, styles = LOCAL_STYLES }) {
  const { t } = useTranslation('calculator');
  const { getLocalized } = useLanguage();
  
  const options = styles.map(style => ({
    value: style.id,
    label: `${style.name} (x${style.coeff})`
  }));

  const handleChange = (value) => {
    const style = styles.find((s) => s.id === value);
    if (style) onStyleChange(style);
  };

  return (
    <div className={`bg-white border border-neutral-200 p-5 rounded-md ${disabled ? 'opacity-75' : ''}`}>
      <label className="text-sm font-medium text-neutral-900 mb-2 flex items-center gap-2">
        {t('options.style')}
        {disabled && (
          <span className="text-xs font-normal text-neutral-400" title={t('settings.lockedTooltip', { defaultValue: 'Inherited from the first paid specification in this project' })}>
            ({t('settings.locked', { defaultValue: 'locked' })})
          </span>
        )}
      </label>
      <Select
        value={globalStyle.id}
        options={options}
        onChange={handleChange}
        disabled={disabled}
      />
      <p className="mt-3 text-sm text-neutral-500 border-l-2 border-emerald-500 pl-3">
        {getLocalized(globalStyle, 'desc')}
      </p>
    </div>
  );
}

export default StyleSelector;
