export const PAYMENT_MODELS = [
  { 
    id: 'Standard', 
    name: 'Standard (Milestones)', 
    desc: '15% предоплата + оплата по вехам', 
    coeff: 1.0 
  },
  { 
    id: 'Pre50', 
    name: 'Pre-50%', 
    desc: '50% аванс + 50% поэтапно', 
    coeff: 0.9 
  },
  { 
    id: 'FullPre', 
    name: 'Full Prepay', 
    desc: '100% предоплата до старта', 
    coeff: 0.7 
  },
  { 
    id: 'Zero', 
    name: 'Zero-Prepay Model', 
    desc: 'Начало работы без предоплаты + оплата по вехам', 
    coeff: 1.2 
  },
];

export const DEFAULT_PAYMENT_MODEL = PAYMENT_MODELS[0];
