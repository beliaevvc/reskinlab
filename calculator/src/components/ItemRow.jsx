import { Icon } from './Icon';
import { Select } from './Select';
import { ANIMATIONS } from '../data';

export function ItemRow({ item, state, onUpdate, onToggleDetails }) {
  const active = state.qty > 0;

  const animOptions = ANIMATIONS.map(anim => ({
    value: anim.id,
    label: `${anim.short} (x${anim.coeff})`
  }));

  return (
    <div
      className={`p-3 rounded-md border transition-all duration-150 ${
        active
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-grow">
          <div className="flex items-center gap-2">
            <div className={`font-medium ${active ? 'text-neutral-900' : 'text-neutral-600'}`}>
              {item.name}
            </div>
            {item.details && (
              <button
                onClick={() => onToggleDetails(item.id)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 cursor-pointer transition-colors duration-150"
              >
                <Icon name="info" size={16} />
              </button>
            )}
          </div>
          <div className="text-xs text-neutral-400 font-mono mt-0.5 flex gap-3">
            <span>Base: ${item.base}</span>
            <span className="text-emerald-600">Anim Cplx: x{item.complexity}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-between sm:justify-end w-full sm:w-auto">
          <div className="sm:hidden">
            <label className="text-[10px] text-neutral-400">Anim</label>
          </div>
          <Select
            value={state.anim}
            options={animOptions}
            onChange={(value) => onUpdate(item.id, 'anim', value)}
            disabled={!active}
            className="w-36"
          />
          <div className="sm:hidden">
            <label className="text-[10px] text-neutral-400">Qty</label>
          </div>
          <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded h-9 overflow-hidden">
            <button
              className="px-3 text-neutral-500 hover:text-white hover:bg-emerald-500 h-full cursor-pointer transition-all duration-150 font-medium"
              onClick={() => onUpdate(item.id, 'qty', Math.max(0, state.qty - 1))}
            >
              -
            </button>
            <div className="w-8 text-center font-mono text-sm text-neutral-900 font-medium">{state.qty}</div>
            <button
              className="px-3 text-neutral-500 hover:text-white hover:bg-emerald-500 h-full cursor-pointer transition-all duration-150 font-medium"
              onClick={() => onUpdate(item.id, 'qty', state.qty + 1)}
            >
              +
            </button>
          </div>
        </div>
      </div>
      {state.expanded && item.details && (
        <div className="mt-4 pt-4 border-t border-neutral-200 text-sm text-neutral-600">
          <p className="mb-2">{item.details.desc}</p>
          {item.details.examples && (
            <p className="mb-3 text-xs italic text-neutral-400">
              Ex: {item.details.examples}
            </p>
          )}
          {item.details.tech && (
            <ul className="space-y-1 bg-neutral-50 p-3 rounded border border-neutral-200">
              {item.details.tech.map((tech, index) => (
                <li key={index} className="flex gap-2 text-xs text-neutral-600">
                  <span className="text-emerald-500">•</span>
                  {tech}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ItemRow;
