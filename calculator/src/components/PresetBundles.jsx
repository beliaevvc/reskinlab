import { Icon } from './Icon';
import { PRESETS } from '../data';

export function PresetBundles({ onApplyPreset }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
        <Icon name="bundle" className="text-emerald-500" /> Quick Bundles
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApplyPreset(preset)}
            className="text-left bg-white border border-neutral-200 hover:border-emerald-300 hover:shadow-sm p-4 rounded-md transition-all duration-150 group cursor-pointer"
          >
            <div className="font-medium text-neutral-900 group-hover:text-emerald-600 mb-1">
              {preset.name}
            </div>
            <div className="text-xs text-neutral-500">{preset.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PresetBundles;
