import { Icon } from './Icon';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';

export function InvoiceView({
  totals,
  globalStyle,
  usageRights,
  paymentModel,
  onBack,
}) {
  const { t } = useTranslation('specs');
  const { getLocalized, isRussian } = useLanguage();
  const invoiceNumber = Math.floor(Math.random() * 10000);
  const currentDate = new Date().toLocaleDateString(isRussian ? 'ru-RU' : 'en-US');

  return (
    <div
      id="invoice-view"
      className="min-h-screen bg-white text-neutral-900 p-4 md:p-8 font-sans"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 no-print gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors duration-150"
          >
            <Icon name="arrowLeft" /> {t('view.back')}
          </button>
          <button
            onClick={() => window.print()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-md flex items-center gap-2 cursor-pointer transition-colors duration-150 font-medium"
          >
            <Icon name="printer" /> {t('view.print')}
          </button>
        </div>

        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between border-b-2 border-neutral-900 pb-6 mb-8 gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">
              ReSkin Lab.
            </h1>
            <p className="text-neutral-500 font-medium text-sm sm:text-base">
              Boutique iGaming Production
            </p>
          </div>
          <div className="text-left sm:text-right">
            <h2 className="text-xl font-bold text-neutral-300 uppercase">
              Estimate
            </h2>
            <p className="font-mono text-neutral-500">#{invoiceNumber}</p>
            <p className="font-mono text-neutral-500">{currentDate}</p>
          </div>
        </div>

        {/* Style & Rights Info */}
        <div className="bg-neutral-50 p-4 sm:p-6 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
          <div>
            <h3 className="text-xs font-medium text-neutral-400 uppercase mb-1">
              {t('view.visualStyle')}
            </h3>
            <div className="text-base sm:text-lg font-bold">
              {getLocalized(globalStyle, 'name')}
            </div>
            <div className="text-xs sm:text-sm text-neutral-500 font-mono">
              {t('view.multiplier')}: x{globalStyle.coeff}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-neutral-400 uppercase mb-1">
              {t('view.usageRights')}
            </h3>
            <div className="text-base sm:text-lg font-bold">
              {getLocalized(usageRights, 'name')}
            </div>
            <div className="text-xs sm:text-sm text-neutral-500 font-mono">
              {t('view.multiplier')}: x{usageRights.coeff}
            </div>
          </div>
        </div>

        {/* Table Scroll Hint (Mobile) */}
        <div className="sm:hidden text-xs text-neutral-400 mb-2 flex items-center justify-center gap-2 italic">
          <Icon name="arrowLeft" size={14} /> <span>{t('view.scrollTable')}</span>{' '}
          <Icon name="arrowRight" size={14} />
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="border-b border-neutral-300">
                <th className="text-left py-2 text-xs uppercase text-neutral-500 w-5/12">
                  {t('view.tableItem')}
                </th>
                <th className="text-center py-2 text-xs uppercase text-neutral-500 w-3/12">
                  {t('view.tableAnim')}
                </th>
                <th className="text-center py-2 text-xs uppercase text-neutral-500 w-1/12">
                  {t('view.tableQty')}
                </th>
                <th className="text-right py-2 text-xs uppercase text-neutral-500 w-3/12">
                  {t('view.tableTotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              {totals.lineItems.map((item, index) => (
                <tr key={index} className="border-b border-neutral-100">
                  <td className="py-4 align-top">
                    <div className="font-bold text-sm">{item.name}</div>
                    {item.details && (item.details.desc || item.details.descEn) && (
                      <div className="text-[10px] text-neutral-500 mt-1 leading-relaxed opacity-80 max-w-prose">
                        {getLocalized(item.details, 'desc')}{' '}
                        <span className="italic text-neutral-400">
                          {t('view.ex')}: {getLocalized(item.details, 'examples')}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-neutral-400 font-mono mt-1">
                      {t('view.base')}: ${item.base}
                    </div>
                  </td>
                  <td className="py-4 text-center text-sm align-top">
                    <span
                      className={`px-2 py-1 rounded text-xs inline-block ${
                        item.anim.id !== 'none'
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'text-neutral-400'
                      }`}
                    >
                      {item.anim.short}{' '}
                      {item.anim.id !== 'none' && `(x${item.anim.coeff})`}
                    </span>
                  </td>
                  <td className="py-4 text-center text-sm font-mono align-top">
                    {item.qty}
                  </td>
                  <td className="py-4 text-right text-sm font-bold font-mono align-top">
                    ${Math.round(item.total).toLocaleString()}
                  </td>
                </tr>
              ))}
              {totals.revisionRounds > 0 && (
                <tr className="border-b border-neutral-100 bg-neutral-50/50">
                  <td className="py-4 pl-2 font-bold text-sm text-emerald-900">
                    {t('view.extraRevisions')}
                  </td>
                  <td className="py-4 text-center text-sm">-</td>
                  <td className="py-4 text-center text-sm font-bold text-emerald-700">
                    +{totals.revisionRounds}
                  </td>
                  <td className="py-4 text-right text-sm font-bold text-emerald-700">
                    +${Math.round(totals.revisionCost).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-1/2 space-y-2">
            <div className="flex justify-between text-neutral-500 text-sm">
              <span>{t('view.production')}:</span>
              <span className="font-mono">
                ${Math.round(totals.productionSum).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-neutral-500 text-sm">
              <span>{t('view.rights')} ({usageRights.id}):</span>
              <span className="font-mono">x{usageRights.coeff}</span>
            </div>
            <div className="flex justify-between text-neutral-900 font-bold border-t border-neutral-200 pt-2">
              <span>{t('view.subtotal')}:</span>
              <span className="font-mono">
                ${Math.round(totals.withRights).toLocaleString()}
              </span>
            </div>
            <div
              className={`flex justify-between p-2 rounded ${
                paymentModel.coeff < 1
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <span className="text-sm font-medium">{getLocalized(paymentModel, 'name')}:</span>
              <span className="font-mono font-bold">
                {paymentModel.coeff < 1 ? '-' : '+'}
                {Math.abs(
                  Math.round(totals.withRights - totals.finalTotal)
                ).toLocaleString()}
              </span>
            </div>
            {totals.appliedPromo && (
              <div className="flex justify-between p-2 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="text-sm font-bold">
                  {t('view.promo')} ({totals.appliedPromo.code})
                </span>
                <span className="font-mono font-bold">
                  -{Math.round(totals.discountAmount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-3xl font-bold text-neutral-900 pt-4 border-t-2 border-neutral-900">
              <span>{t('view.total')}:</span>
              <span>${Math.round(totals.grandTotal).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceView;
