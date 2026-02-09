import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

export function MobileFooter({ totals, usageRights, paymentModel, minimumOrder, onViewSpecification }) {
  const { t, i18n } = useTranslation('calculator');
  const currentLang = i18n.language?.startsWith('ru') ? 'ru' : 'en';

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-neutral-200 p-4 pb-8 z-40">
      <div className="flex justify-between mb-3 text-xs font-mono text-neutral-500">
        <div>{usageRights.id}</div>
        <div>{paymentModel.id}</div>
      </div>
      <div className="flex gap-4 items-center">
        <div className="flex-grow">
          <div className="text-[10px] text-neutral-500 uppercase font-medium">{t('sidebar.total')}</div>
          {totals.appliedPromo && totals.discountAmount > 0 ? (
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-emerald-600 font-mono">
                ${Math.round(totals.grandTotal).toLocaleString()}
              </div>
              <div className="text-sm font-medium text-neutral-400 font-mono line-through">
                ${Math.round(totals.finalTotal).toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-neutral-900 font-mono">
              ${Math.round(totals.grandTotal).toLocaleString()}
            </div>
          )}
          {minimumOrder?.isMinimumActive && minimumOrder.isBelowMinimum(totals.grandTotal) && (
            <p className="text-[10px] text-amber-600 mt-0.5">
              {minimumOrder.getMessage?.(currentLang) || minimumOrder.message || t('sidebar.minOrderMessage', { amount: minimumOrder.amount.toLocaleString() })}
            </p>
          )}
          {totals.minimumApplied && (
            <p className="text-[10px] text-amber-600 mt-0.5">
              {t('sidebar.promoCapped')}
            </p>
          )}
        </div>
        <button
          onClick={onViewSpecification}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-md font-medium flex items-center gap-2 cursor-pointer transition-colors duration-150"
        >
          {t('sidebar.viewSpecification').split(' ')[0]} <Icon name="chevronRight" size={18} />
        </button>
      </div>
    </div>
  );
}

export default MobileFooter;
