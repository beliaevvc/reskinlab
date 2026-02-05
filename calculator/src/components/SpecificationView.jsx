import { useState } from 'react';
import { Icon } from './Icon';

// Payment schedule component - разбивка по этапам
function PaymentSchedule({ paymentModel, grandTotal, activeStages }) {
  // Этапы для milestone-платежей (исключаем Briefing и Revisions)
  const payableStages = activeStages.filter(
    (s) => !['briefing', 'revisions'].includes(s.id)
  );
  
  // Расчёт сумм в зависимости от модели
  const getPaymentBreakdown = () => {
    const stageCount = payableStages.length;
    
    switch (paymentModel.id) {
      case 'Standard': {
        // 15% upfront + 85% равномерно по этапам
        const upfront = grandTotal * 0.15;
        const milestoneTotal = grandTotal * 0.85;
        const perStage = milestoneTotal / stageCount;
        return { upfront, upfrontPercent: 15, perStage, stagePercent: Math.round(85 / stageCount) };
      }
      case 'Pre50': {
        // 50% upfront + 50% равномерно по этапам
        const upfront = grandTotal * 0.5;
        const milestoneTotal = grandTotal * 0.5;
        const perStage = milestoneTotal / stageCount;
        return { upfront, upfrontPercent: 50, perStage, stagePercent: Math.round(50 / stageCount) };
      }
      case 'FullPre': {
        // 100% upfront
        return { upfront: grandTotal, upfrontPercent: 100, perStage: 0, stagePercent: 0 };
      }
      case 'Zero': {
        // 0% upfront + 100% равномерно по этапам
        const perStage = grandTotal / stageCount;
        return { upfront: 0, upfrontPercent: 0, perStage, stagePercent: Math.round(100 / stageCount) };
      }
      default:
        return { upfront: 0, upfrontPercent: 0, perStage: 0, stagePercent: 0 };
    }
  };
  
  const breakdown = getPaymentBreakdown();
  let paymentIndex = 1;
  
  return (
    <div className="space-y-2">
      {/* Upfront payment (if any) */}
      {breakdown.upfrontPercent > 0 && (
        <div className="flex justify-between items-center py-2 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
              {paymentIndex++}
            </span>
            <div>
              <div className="font-medium text-sm">
                {paymentModel.id === 'FullPre' ? 'Full Prepayment' : 'Upfront Payment'}
              </div>
              <div className="text-xs text-neutral-500">Before project start</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold font-mono ${paymentModel.id === 'FullPre' ? 'text-emerald-600' : ''}`}>
              ${Math.round(breakdown.upfront).toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500">{breakdown.upfrontPercent}%</div>
          </div>
        </div>
      )}
      
      {/* Zero prepay indicator */}
      {paymentModel.id === 'Zero' && (
        <div className="flex justify-between items-center py-2 border-b border-neutral-200 opacity-60">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 bg-neutral-300 text-white rounded-full flex items-center justify-center text-xs font-bold">
              ✓
            </span>
            <div>
              <div className="font-medium text-sm">Project Start</div>
              <div className="text-xs text-neutral-500">No upfront payment required</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold font-mono text-neutral-400">$0</div>
            <div className="text-xs text-neutral-500">0%</div>
          </div>
        </div>
      )}
      
      {/* Milestone payments by stage */}
      {breakdown.perStage > 0 && payableStages.map((stage) => (
        <div key={stage.id} className="flex justify-between items-center py-2 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              paymentModel.id === 'Zero' 
                ? 'bg-amber-500 text-white' 
                : 'bg-neutral-200 text-neutral-600'
            }`}>
              {paymentIndex++}
            </span>
            <div>
              <div className="font-medium text-sm">{stage.name}</div>
              <div className="text-xs text-neutral-500">After stage approval</div>
            </div>
          </div>
          <div className="text-right">
            <div className={`font-bold font-mono ${paymentModel.id === 'Zero' ? 'text-amber-600' : ''}`}>
              ${Math.round(breakdown.perStage).toLocaleString()}
            </div>
            <div className="text-xs text-neutral-500">~{breakdown.stagePercent}%</div>
          </div>
        </div>
      ))}
      
      {/* Total verification */}
      <div className="flex justify-between items-center pt-3 mt-2 border-t border-neutral-300">
        <div className="font-bold text-sm">Total</div>
        <div className="font-bold font-mono">${Math.round(grandTotal).toLocaleString()}</div>
      </div>
    </div>
  );
}

// Production workflow stages
const WORKFLOW_STAGES = [
  {
    id: 'briefing',
    name: 'Briefing',
    nameRu: 'Брифинг',
    duration: '1-2 days',
    description: 'Requirements gathering, references, source game analysis',
    always: true,
  },
  {
    id: 'moodboard',
    name: 'Moodboard & Concept',
    nameRu: 'Мудборд и концепция',
    duration: '2-3 days',
    description: 'Visual direction, color palette, overall concept',
    always: true,
  },
  {
    id: 'symbols',
    name: 'Symbol Design',
    nameRu: 'Разработка символов',
    duration: '3-5 days',
    description: 'Game symbols production (low, high, special)',
    condition: 'hasSymbols',
  },
  {
    id: 'ui',
    name: 'UI & Layout',
    nameRu: 'UI и интерфейс',
    duration: '2-4 days',
    description: 'Interface elements, buttons, panels, backgrounds',
    always: true,
  },
  {
    id: 'animation',
    name: 'Animation Production',
    nameRu: 'Анимация',
    duration: '3-5 days',
    description: 'Symbol and UI animation',
    condition: 'hasAnimation',
  },
  {
    id: 'revisions',
    name: 'Revisions',
    nameRu: 'Корректировки',
    duration: 'TBD',
    description: 'Feedback implementation and adjustments',
    always: true,
  },
  {
    id: 'delivery',
    name: 'Final Delivery',
    nameRu: 'Сдача проекта',
    duration: '1 day',
    description: 'Source files and final assets handover',
    always: true,
  },
];

export function SpecificationView({
  totals,
  globalStyle,
  usageRights,
  paymentModel,
  onBack,
  noWrapper = false,
  specNumber,
  specDate,
}) {
  const [workflowExpanded, setWorkflowExpanded] = useState(false);
  
  // Use provided specNumber or fallback to empty
  const displayNumber = specNumber || '—';
  const displayDate = specDate || new Date().toLocaleDateString();

  // Determine which conditional stages to show
  const hasSymbols = totals.lineItems.some((item) =>
    item.id?.startsWith('sym_')
  );
  const hasAnimation = totals.lineItems.some(
    (item) => item.anim?.id !== 'none'
  );

  const activeStages = WORKFLOW_STAGES.filter((stage) => {
    if (stage.always) return true;
    if (stage.condition === 'hasSymbols') return hasSymbols;
    if (stage.condition === 'hasAnimation') return hasAnimation;
    return false;
  });

  const content = (
    <>
      {/* Header Actions */}
      {!noWrapper && (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 sm:mb-12 no-print gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 cursor-pointer transition-colors duration-150"
          >
            <Icon name="arrowLeft" /> Back
          </button>
          <button
            onClick={() => window.print()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-md flex items-center gap-2 cursor-pointer transition-colors duration-150 font-medium"
          >
            <Icon name="printer" /> Print / Export
          </button>
        </div>
      )}

        {/* Specification Header */}
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
            <h2 className="text-xl font-bold text-emerald-600 uppercase">
              Specification
            </h2>
            <p className="font-mono text-neutral-500">#{displayNumber}</p>
            <p className="font-mono text-neutral-500">{displayDate}</p>
          </div>
        </div>

        {/* Style & Rights Info */}
        <div className="bg-neutral-50 p-4 sm:p-6 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
          <div>
            <h3 className="text-xs font-medium text-neutral-400 uppercase mb-1">
              Visual Style
            </h3>
            <div className="text-base sm:text-lg font-bold">
              {globalStyle.name}
            </div>
            <div className="text-xs sm:text-sm text-neutral-500 font-mono">
              Multiplier: x{globalStyle.coeff}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-medium text-neutral-400 uppercase mb-1">
              Usage Rights
            </h3>
            <div className="text-base sm:text-lg font-bold">
              {usageRights.name}
            </div>
            <div className="text-xs sm:text-sm text-neutral-500 font-mono">
              Multiplier: x{usageRights.coeff}
            </div>
          </div>
        </div>

        {/* Production Workflow */}
        <div className="mb-10">
          <button
            onClick={() => setWorkflowExpanded(!workflowExpanded)}
            className="w-full text-lg font-bold text-neutral-900 mb-4 flex items-center justify-between gap-2 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center text-xs font-bold">
                ⟳
              </span>
              Production Workflow
              <span className="text-sm font-normal text-neutral-500">
                ({activeStages.length} stages)
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-neutral-400 transition-transform ${workflowExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {workflowExpanded && (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-neutral-200" />

              <div className="space-y-0">
                {activeStages.map((stage, index) => (
                  <div key={stage.id} className="relative flex gap-4 pb-6">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0 w-8 h-8 bg-white border-2 border-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-emerald-600">
                        {index + 1}
                      </span>
                    </div>
                    {/* Stage content */}
                    <div className="flex-1 bg-neutral-50 rounded-md p-4 -mt-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                        <div>
                          <h3 className="font-bold text-neutral-900">
                            {stage.name}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {stage.description}
                          </p>
                        </div>
                        <div className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded whitespace-nowrap self-start sm:self-auto">
                          {stage.duration}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Table Scroll Hint (Mobile) */}
        <div className="sm:hidden text-xs text-neutral-400 mb-2 flex items-center justify-center gap-2 italic">
          <Icon name="arrowLeft" size={14} /> <span>Scroll table</span>{' '}
          <Icon name="arrowRight" size={14} />
        </div>

        {/* Assets & Services Table */}
        <div className="mb-2">
          <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center text-xs font-bold">
              ✦
            </span>
            Assets & Services
          </h2>
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="border-b border-neutral-300">
                <th className="text-left py-2 text-xs uppercase text-neutral-500 w-5/12">
                  Item
                </th>
                <th className="text-center py-2 text-xs uppercase text-neutral-500 w-3/12">
                  Anim
                </th>
                <th className="text-center py-2 text-xs uppercase text-neutral-500 w-1/12">
                  Qty
                </th>
                <th className="text-right py-2 text-xs uppercase text-neutral-500 w-3/12">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {totals.lineItems.map((item, index) => (
                <tr key={index} className="border-b border-neutral-100">
                  <td className="py-4 align-top">
                    <div className="font-bold text-sm">{item.name}</div>
                    {item.details && item.details.descEn && (
                      <div className="text-[10px] text-neutral-500 mt-1 leading-relaxed opacity-80 max-w-prose">
                        {item.details.descEn}{' '}
                        <span className="italic text-neutral-400">
                          Ex: {item.details.examplesEn}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-neutral-400 font-mono mt-1">
                      Base: ${item.base}
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
                    Extra Revisions (+2.5%/round)
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
              <span>Production:</span>
              <span className="font-mono">
                ${Math.round(totals.productionSum).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-neutral-500 text-sm">
              <span>Rights ({usageRights.id}):</span>
              <span className="font-mono">x{usageRights.coeff}</span>
            </div>
            <div className="flex justify-between text-neutral-900 font-bold border-t border-neutral-200 pt-2">
              <span>Subtotal:</span>
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
              <span className="text-sm font-medium">{paymentModel.name}:</span>
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
                  PROMO ({totals.appliedPromo.code})
                </span>
                <span className="font-mono font-bold">
                  -{Math.round(totals.discountAmount).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-3xl font-bold text-neutral-900 pt-4 border-t-2 border-neutral-900">
              <span>Total:</span>
              <span>${Math.round(totals.grandTotal).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        <div className="mt-10 mb-8">
          <h2 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center text-xs font-bold">
              $
            </span>
            Payment Terms
          </h2>
          <div className="bg-neutral-50 rounded-md p-5">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                paymentModel.coeff < 1 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : paymentModel.coeff > 1 
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-neutral-200 text-neutral-700'
              }`}>
                {paymentModel.name}
              </span>
              {paymentModel.coeff < 1 && (
                <span className="text-xs text-emerald-600 font-medium">
                  {Math.round((1 - paymentModel.coeff) * 100)}% discount applied
                </span>
              )}
              {paymentModel.coeff > 1 && (
                <span className="text-xs text-amber-600 font-medium">
                  +{Math.round((paymentModel.coeff - 1) * 100)}% flexibility fee
                </span>
              )}
            </div>
            
            {/* Payment Schedule */}
            <PaymentSchedule 
              paymentModel={paymentModel}
              grandTotal={totals.grandTotal}
              activeStages={activeStages}
            />
            
            <div className="mt-4 pt-3 border-t border-neutral-200 text-xs text-neutral-500">
              Payment methods: Bank transfer, PayPal, Crypto (USDT/USDC)
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-12 pt-6 border-t border-neutral-200 text-center text-xs text-neutral-400">
          <p>
            This specification is valid for 30 days. Prices may vary based on
            final requirements.
          </p>
          <p className="mt-1">ReSkin Lab. — Boutique iGaming Production</p>
        </div>
    </>
  );

  if (noWrapper) {
    return content;
  }

  return (
    <div
      id="specification-view"
      className="min-h-screen bg-white text-neutral-900 p-4 md:p-8 font-sans"
    >
      <div className="max-w-4xl mx-auto">
        {content}
      </div>
    </div>
  );
}

export default SpecificationView;
