export const USAGE_RIGHTS = [
  { 
    id: 'U1', 
    name: 'U1 Public Allowed', 
    nameRu: 'U1 Публичное',
    desc: 'Публичное использование разрешено (портфолио, соцсети)',
    descEn: 'Public use allowed (portfolio, social media)',
    coeff: 1.0 
  },
  { 
    id: 'U2', 
    name: 'U2 Private / PDF Only', 
    nameRu: 'U2 Приватное / PDF',
    desc: 'Разрешено только в закрытом PDF-кейсе / при прямых продажах',
    descEn: 'Allowed only in private PDF case / direct sales',
    coeff: 1.25 
  },
  { 
    id: 'U3', 
    name: 'U3 Ghost / NDA', 
    nameRu: 'U3 Конфиденциально',
    desc: 'Полный запрет на публикацию (Ghost-production)',
    descEn: 'Full publication ban (Ghost-production)',
    coeff: 1.5 
  },
];

export const DEFAULT_USAGE_RIGHTS = USAGE_RIGHTS[0];
