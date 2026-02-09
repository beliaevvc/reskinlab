export const STYLES = [
  { 
    id: 'S1', 
    name: 'S1 Flat Minimalist', 
    nameRu: 'S1 Плоский минимализм',
    coeff: 1.0, 
    desc: 'Плоский, без теней и текстур; простые формы, чистые цвета. Подходит для Telegram-игр, казуальных UI, минимализма.',
    descEn: 'Flat, no shadows or textures; simple shapes, clean colors. Suitable for Telegram games, casual UI, minimalism.'
  },
  { 
    id: 'S2', 
    name: 'S2 Cartoon Soft 2D', 
    nameRu: 'S2 Cartoon 2D',
    coeff: 1.15, 
    desc: 'Базовые градиенты, мягкие тени, немного FX, но без реализма. Яркие цвета, smooth shading.',
    descEn: 'Basic gradients, soft shadows, some FX, but no realism. Bright colors, smooth shading.'
  },
  { 
    id: 'P1', 
    name: 'P1 Pixel Basic', 
    nameRu: 'P1 Пиксель базовый',
    coeff: 1.0, 
    desc: 'Минимальная палитра, крупные пиксели, простые формы, без мягких теней. Используется для Telegram-игр и ретро-интерфейсов.',
    descEn: 'Minimal palette, large pixels, simple shapes, no soft shadows. Used for Telegram games and retro interfaces.'
  },
  { 
    id: 'S3', 
    name: 'S3 Stylized 2D', 
    nameRu: 'S3 Стилизация 2D',
    coeff: 1.3, 
    desc: 'Ручная прорисовка деталей, фактура, тени, но без глубокой светотени. Промежуточный между cartoon и pseudo-3D.',
    descEn: 'Hand-drawn details, texture, shadows, but no deep shading. Intermediate between cartoon and pseudo-3D.'
  },
  { 
    id: 'P2', 
    name: 'P2 Pixel Detailed', 
    nameRu: 'P2 Пиксель детальный',
    coeff: 1.2, 
    desc: 'Более плотный пиксельный стиль, плавные градиенты, покадровые FX-элементы, больше слоёв и кадров. Требует аниматора или опытного пиксель-иллюстратора.',
    descEn: 'Denser pixel style, smooth gradients, frame-by-frame FX elements, more layers and frames. Requires animator or experienced pixel illustrator.'
  },
  { 
    id: 'S4', 
    name: 'S4 Pseudo-3D', 
    nameRu: 'S4 Псевдо-3D',
    coeff: 1.5, 
    desc: 'Полноценная светотень, объём, материалы (металл, камень, кожа), FX. Используется в большинстве слотов уровня Pragmatic, BGaming.',
    descEn: 'Full shading, volume, materials (metal, stone, leather), FX. Used in most Pragmatic, BGaming level slots.'
  },
  { 
    id: 'P3', 
    name: 'P3 Pixel HD', 
    nameRu: 'P3 Пиксель HD',
    coeff: 1.4, 
    desc: 'Пиксель-арт с высоким разрешением и пост-эффектами (свечение, шум, color dodge). Часто комбинируется с векторным или FX-рендером.',
    descEn: 'High-resolution pixel art with post-effects (glow, noise, color dodge). Often combined with vector or FX render.'
  },
  { 
    id: 'S5', 
    name: 'S5 High-Detail 2D', 
    nameRu: 'S5 Детальный 2D',
    coeff: 1.8, 
    desc: 'Ближе к 3D-рендеру: сложная геометрия, текстуры, отражения, бликовые эффекты, рендер-освещение.',
    descEn: 'Close to 3D render: complex geometry, textures, reflections, highlight effects, render lighting.'
  },
  { 
    id: 'S6', 
    name: 'S6 Stylized 3D', 
    nameRu: 'S6 Стилизация 3D',
    coeff: 2.0, 
    desc: 'Используются рендеры или 3D-блокинг с последующей отрисовкой; сложный свет, перспектива, частично процедурные FX.',
    descEn: 'Uses renders or 3D blocking with subsequent drawing; complex lighting, perspective, partially procedural FX.'
  },
  { 
    id: 'S7', 
    name: 'S7 Cinematic 3D', 
    nameRu: 'S7 Кинематографичный 3D',
    coeff: 2.3, 
    desc: 'Реалистичные материалы, глобальное освещение, пост-обработка, фотоблизкий стиль. Используется для промо-артов и постеров.',
    descEn: 'Realistic materials, global illumination, post-processing, photo-like style. Used for promo arts and posters.'
  },
];

export const DEFAULT_STYLE = STYLES[3]; // S3 Stylized 2D
