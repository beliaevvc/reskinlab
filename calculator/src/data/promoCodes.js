export const PROMO_CODES = {
  'PR10': 0.10,
  'PR20': 0.20,
  'PR30': 0.30,
  'PR50': 0.50,
};

export const validatePromoCode = (code) => {
  const normalizedCode = code.toUpperCase().trim();
  if (PROMO_CODES[normalizedCode]) {
    return {
      valid: true,
      code: normalizedCode,
      discount: PROMO_CODES[normalizedCode]
    };
  }
  return { valid: false, code: normalizedCode, discount: 0 };
};
