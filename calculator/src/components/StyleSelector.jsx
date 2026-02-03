import { STYLES } from '../data';
import { Select } from './Select';

export function StyleSelector({ globalStyle, onStyleChange }) {
  const options = STYLES.map(style => ({
    value: style.id,
    label: `${style.name} (x${style.coeff})`
  }));

  const handleChange = (value) => {
    const style = STYLES.find((s) => s.id === value);
    if (style) onStyleChange(style);
  };

  return (
    <div className="bg-white border border-neutral-200 p-5 rounded-md">
      <label className="text-sm font-medium text-neutral-900 mb-2 block">
        Visual Style
      </label>
      <Select
        value={globalStyle.id}
        options={options}
        onChange={handleChange}
      />
      <p className="mt-3 text-sm text-neutral-500 border-l-2 border-emerald-500 pl-3">
        {globalStyle.desc}
      </p>
    </div>
  );
}

export default StyleSelector;
