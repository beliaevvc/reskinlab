import { useState } from 'react';
import { Icon } from './Icon';
import { useValidatePromoCode } from '../hooks/usePromoCodes';

export function PromoSection({ appliedPromo, onApplyPromo }) {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const validatePromo = useValidatePromoCode();

  const handleApply = async () => {
    const code = promoInput.trim();
    if (!code) return;

    setIsValidating(true);
    setPromoError('');

    try {
      const result = await validatePromo.mutateAsync({ code, orderTotal: 0 });

      // For percentage: discount as fraction (e.g. 10% → 0.10)
      // For fixed: store value and type for calculator to handle
      const discount = result.type === 'percentage'
        ? result.value / 100
        : result.value;

      onApplyPromo({
        code: result.code,
        discount,
        type: result.type,
        value: result.value,
      });
    } catch (err) {
      onApplyPromo(null);
      setPromoError(err.message || 'Invalid code');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="border-t border-neutral-200 pt-8 mt-8 mb-8">
      <h2 className="text-lg font-semibold text-neutral-900 mb-5 flex items-center gap-2">
        <Icon name="tag" className="text-emerald-500" /> Promo
      </h2>
      <div className={`bg-white border p-4 rounded-md flex gap-3 ${appliedPromo ? 'border-emerald-200 bg-emerald-50/30' : 'border-neutral-200'}`}>
        {appliedPromo ? (
          <>
            <div className="flex items-center gap-2 w-full bg-emerald-50 border border-emerald-200 rounded p-3">
              <Icon name="check" size={16} className="text-emerald-500 shrink-0" />
              <span className="text-emerald-700 font-mono font-medium text-sm uppercase">{appliedPromo.code}</span>
              <span className="text-emerald-600 text-xs ml-auto">
                {appliedPromo.type === 'percentage' ? `-${appliedPromo.value}%` : `-$${appliedPromo.value}`}
              </span>
            </div>
            <button
              onClick={() => { onApplyPromo(null); setPromoInput(''); setPromoError(''); }}
              className="border border-neutral-300 hover:bg-neutral-50 text-neutral-500 hover:text-neutral-700 font-medium px-4 rounded transition-colors duration-150 shrink-0"
            >
              Clear
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter code"
              className="bg-neutral-50 border border-neutral-200 rounded p-3 text-neutral-900 w-full uppercase outline-none focus:border-emerald-500 transition-colors duration-150 placeholder-neutral-400 font-mono text-sm"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            />
            <button
              onClick={handleApply}
              disabled={isValidating || !promoInput.trim()}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-medium px-5 rounded cursor-pointer transition-colors duration-150 disabled:cursor-not-allowed shrink-0"
            >
              {isValidating ? '...' : 'Apply'}
            </button>
          </>
        )}
      </div>
      {promoError && (
        <p className="text-red-500 text-xs mt-2">{promoError}</p>
      )}
    </div>
  );
}

export default PromoSection;
