export const USAGE_RIGHTS = [
  { 
    id: 'U1', 
    name: 'U1 Public Allowed', 
    desc: 'Публичное использование разрешено (портфолио, соцсети)', 
    coeff: 1.0 
  },
  { 
    id: 'U2', 
    name: 'U2 Private / PDF Only', 
    desc: 'Разрешено только в закрытом PDF-кейсе / при прямых продажах', 
    coeff: 1.25 
  },
  { 
    id: 'U3', 
    name: 'U3 Ghost / NDA', 
    desc: 'Полный запрет на публикацию (Ghost-production)', 
    coeff: 1.5 
  },
];

export const DEFAULT_USAGE_RIGHTS = USAGE_RIGHTS[0];
