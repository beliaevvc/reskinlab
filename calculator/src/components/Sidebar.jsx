import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

export function Sidebar({ totals, usageRights, paymentModel, minimumOrder, onViewSpecification }) {
  const { t, i18n } = useTranslation('calculator');
  const currentLang = i18n.language?.startsWith('ru') ? 'ru' : 'en';

  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-[10rem]">
        <div className="bg-white border border-neutral-200 p-6 rounded-md shadow-sm">
          <div className="mb-6">
            <div className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-1">
              {t('sidebar.total')}
            </div>
            {totals.appliedPromo && totals.discountAmount > 0 ? (
              <>
                <div className="text-base font-medium text-neutral-400 font-mono line-through">
                  ${Math.round(totals.finalTotal).toLocaleString()}
                </div>
                <div className="text-4xl font-bold text-emerald-600 font-mono">
                  ${Math.round(totals.grandTotal).toLocaleString()}
                </div>
              </>
            ) : (
              <div className="text-4xl font-bold text-neutral-900 font-mono">
                ${Math.round(totals.grandTotal).toLocaleString()}
              </div>
            )}
            {minimumOrder?.isMinimumActive && minimumOrder.isBelowMinimum(totals.grandTotal) && (
              <p className="text-xs text-amber-600 mt-1.5">
                {minimumOrder.getMessage?.(currentLang) || minimumOrder.message || t('sidebar.minOrderMessage', { amount: minimumOrder.amount.toLocaleString() })}
              </p>
            )}
            {totals.minimumApplied && (
              <p className="text-xs text-amber-600 mt-1">
                {t('sidebar.promoCapped')}
              </p>
            )}
          </div>
          <div className="space-y-3 border-t border-neutral-100 pt-5 mb-6 text-sm">
            {totals.revisionRounds > 0 && (
              <div className="flex justify-between text-neutral-500">
                <span>{t('sidebar.revisions')}:</span>
                <span className="text-neutral-900 font-medium">
                  +${Math.round(totals.revisionCost).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-neutral-500">
              <span>{t('sidebar.rights')}:</span>
              <span className="text-neutral-900 font-medium">x{usageRights.coeff}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>{t('sidebar.model')}:</span>
              <span className="text-neutral-900 font-medium">x{paymentModel.coeff}</span>
            </div>
            {totals.appliedPromo && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>{t('sidebar.promo')}:</span>
                <span>-${Math.round(totals.discountAmount).toLocaleString()}</span>
              </div>
            )}
          </div>
          <button
            onClick={onViewSpecification}
            disabled={totals.grandTotal === 0}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-md flex items-center justify-center gap-2 transition-colors duration-150 cursor-pointer"
          >
            {t('sidebar.viewSpecification')} <Icon name="chevronRight" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
