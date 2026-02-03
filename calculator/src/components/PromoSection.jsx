import { useState } from 'react';
import { Icon } from './Icon';
import { validatePromoCode } from '../data';

export function PromoSection({ appliedPromo, onApplyPromo }) {
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const handleApply = () => {
    const code = promoInput.trim();
    if (!code) return;

    const result = validatePromoCode(code);
    if (result.valid) {
      onApplyPromo({ code: result.code, discount: result.discount });
      setPromoError('');
    } else {
      onApplyPromo(null);
      setPromoError('Invalid code');
    }
  };

  return (
    <div className="border-t border-neutral-200 pt-8 mt-8 mb-8">
      <h2 className="text-lg font-semibold text-neutral-900 mb-5 flex items-center gap-2">
        <Icon name="tag" className="text-emerald-500" /> Promo
      </h2>
      <div className="bg-white border border-neutral-200 p-4 rounded-md flex gap-3">
        <input
          type="text"
          placeholder="Enter code"
          className="bg-neutral-50 border border-neutral-200 rounded p-3 text-neutral-900 w-full uppercase outline-none focus:border-emerald-500 transition-colors duration-150 placeholder-neutral-400"
          value={promoInput}
          onChange={(e) => setPromoInput(e.target.value)}
        />
        <button
          onClick={handleApply}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-5 rounded cursor-pointer transition-colors duration-150"
        >
          Apply
        </button>
      </div>
      {promoError && (
        <p className="text-red-500 text-xs mt-2">{promoError}</p>
      )}
      {appliedPromo && (
        <p className="text-emerald-600 text-xs mt-2 flex items-center gap-1">
          <Icon name="check" size={14} /> Applied: {appliedPromo.code}
        </p>
      )}
    </div>
  );
}

export default PromoSection;
