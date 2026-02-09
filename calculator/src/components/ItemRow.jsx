import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { Icon } from './Icon';
import { Select } from './Select';
import { ANIMATIONS as LOCAL_ANIMATIONS } from '../data';

export function ItemRow({ item, state, onUpdate, onToggleDetails, animations = LOCAL_ANIMATIONS }) {
  const { t } = useTranslation('calculator');
  const { isRussian, getLocalized } = useLanguage();
  
  const ORDER_TYPES = [
    { id: 'art_only', label: t('orderTypes.artOnly'), title: t('orderTypes.artOnlyDesc', { defaultValue: 'Art Only — no animation' }) },
    { id: 'anim_only', label: t('orderTypes.animOnly'), title: t('orderTypes.animOnlyDesc', { defaultValue: 'Animation Only — client provides art' }) },
    { id: 'art_and_anim', label: t('orderTypes.artAndAnim'), title: t('orderTypes.artAndAnimDesc', { defaultValue: 'Art + Animation' }) },
  ];
  const active = state.qty > 0;
  const orderType = state.orderType || 'art_and_anim';
  const isAnimDisabled = !active || orderType === 'art_only';

  // Special flags
  const hideOrderType = !!item.noOrderType;
  const hideAnimation = !!item.noAnimation;
  const maxQty = item.maxQty || Infinity;
  const isRecommended = !!item.recommended;
  const hasSurcharge = !!item.surchargePercent;

  const animOptions = animations
    .filter(anim => orderType === 'art_only' || anim.id !== 'none')
    .map(anim => ({
      value: anim.id,
      label: `${anim.short} (x${anim.coeff})`
    }));

  const handleOrderTypeChange = (newType) => {
    onUpdate(item.id, 'orderType', newType);
    // Auto-adjust animation when switching types
    if (newType === 'art_only') {
      onUpdate(item.id, 'anim', 'none');
    } else if (state.anim === 'none') {
      // Art+Anim and Anim Only both require animation — set to Light by default
      onUpdate(item.id, 'anim', 'AN-L');
    }
  };

  return (
    <div
      className={`p-3 rounded-md border transition-all duration-150 ${
        active
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-neutral-200 hover:border-neutral-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <div className={`font-medium truncate ${active ? 'text-neutral-900' : 'text-neutral-600'}`}>
              {item.name}
            </div>
            {isRecommended && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 rounded">
                {t('item.recommended', { defaultValue: 'Recommended' })}
              </span>
            )}
            {item.details && (
              <button
                onClick={() => onToggleDetails(item.id)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 cursor-pointer transition-colors duration-150 shrink-0"
              >
                <Icon name="info" size={16} />
              </button>
            )}
          </div>
          <div className="text-xs text-neutral-400 font-mono mt-0.5 flex gap-3">
            <span>{t('item.base', { defaultValue: 'Base' })}: ${item.base.toLocaleString()}</span>
            {hasSurcharge && (
              <span className="text-amber-600">+ {item.surchargePercent * 100}% {t('item.ofSpec', { defaultValue: 'of spec' })}</span>
            )}
            {!hideAnimation && (
              <span className="text-emerald-600">{t('item.animComplexity', { defaultValue: 'Anim Cplx' })}: x{item.complexity}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-between sm:justify-end w-full sm:w-auto shrink-0">
          {/* Order Type Selector — hidden for noOrderType items */}
          {!hideOrderType && (
            <>
              <div className="sm:hidden">
                <label className="text-[10px] text-neutral-400">{t('options.orderType')}</label>
              </div>
              <div className={`flex rounded border overflow-hidden h-8 text-[11px] font-medium ${!active ? 'opacity-40 pointer-events-none' : ''}`}>
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    title={type.title}
                    onClick={() => handleOrderTypeChange(type.id)}
                    className={`px-2 transition-colors duration-100 cursor-pointer border-r last:border-r-0 border-neutral-200 ${
                      orderType === type.id
                        ? type.id === 'anim_only'
                          ? 'bg-violet-500 text-white'
                          : type.id === 'art_only'
                          ? 'bg-blue-500 text-white'
                          : 'bg-emerald-500 text-white'
                        : 'bg-white text-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Animation Selector — hidden for noAnimation items */}
          {!hideAnimation && (
            <>
              <div className="sm:hidden">
                <label className="text-[10px] text-neutral-400">{t('options.animation')}</label>
              </div>
              <Select
                value={state.anim}
                options={animOptions}
                onChange={(value) => onUpdate(item.id, 'anim', value)}
                disabled={isAnimDisabled}
                className="w-36"
              />
            </>
          )}
          {/* Quantity Controls */}
          <div className="sm:hidden">
            <label className="text-[10px] text-neutral-400">{t('item.quantity')}</label>
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
              className={`px-3 h-full cursor-pointer transition-all duration-150 font-medium ${
                state.qty >= maxQty
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-500 hover:text-white hover:bg-emerald-500'
              }`}
              onClick={() => {
                if (state.qty < maxQty) {
                  onUpdate(item.id, 'qty', state.qty + 1);
                }
              }}
              disabled={state.qty >= maxQty}
            >
              +
            </button>
          </div>
        </div>
      </div>
      {state.expanded && item.details && (
        <div className="mt-4 pt-4 border-t border-neutral-200 text-sm text-neutral-600">
          <p className="mb-2">{getLocalized(item.details, 'desc')}</p>
          {(item.details.examples || item.details.examplesEn) && (
            <p className="mb-3 text-xs italic text-neutral-400">
              {t('item.examples')}: {getLocalized(item.details, 'examples')}
            </p>
          )}
          {(item.details.tech || item.details.techEn) && (
            <ul className="space-y-1 bg-neutral-50 p-3 rounded border border-neutral-200">
              {(getLocalized(item.details, 'tech') || []).map((techItem, index) => (
                <li key={index} className="flex gap-2 text-xs text-neutral-600">
                  <span className="text-emerald-500">•</span>
                  {techItem}
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
