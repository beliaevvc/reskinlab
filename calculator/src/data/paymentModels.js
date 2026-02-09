export const PAYMENT_MODELS = [
  { 
    id: 'Standard', 
    name: 'Standard (Milestones)', 
    nameRu: 'Стандарт (по вехам)',
    desc: '15% предоплата + оплата по вехам',
    descEn: '15% prepayment + milestone payments',
    coeff: 1.0 
  },
  { 
    id: 'Pre50', 
    name: 'Pre-50%', 
    nameRu: 'Аванс 50%',
    desc: '50% аванс + 50% поэтапно',
    descEn: '50% advance + 50% staged',
    coeff: 0.9 
  },
  { 
    id: 'FullPre', 
    name: 'Full Prepay', 
    nameRu: 'Полная предоплата',
    desc: '100% предоплата до старта',
    descEn: '100% prepayment before start',
    coeff: 0.7 
  },
  { 
    id: 'Zero', 
    name: 'Zero-Prepay Model', 
    nameRu: 'Без предоплаты',
    desc: 'Начало работы без предоплаты + оплата по вехам',
    descEn: 'Start without prepayment + milestone payments',
    coeff: 1.2 
  },
];

export const DEFAULT_PAYMENT_MODEL = PAYMENT_MODELS[0];
