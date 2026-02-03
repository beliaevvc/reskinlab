# ReSkin Lab Calculator v2.1

Калькулятор стоимости для iGaming проектов.

## Установка и запуск

```bash
cd calculator
npm install
npm run dev
```

Приложение откроется на `http://localhost:5173`

## Сборка для продакшена

```bash
npm run build
npm run preview
```

## Структура проекта

```
calculator/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Главный компонент
    ├── index.css             # Глобальные стили + Tailwind
    ├── data/                 # Данные (вынесены отдельно)
    │   ├── index.js          # Центральный экспорт
    │   ├── styles.js         # Визуальные стили (S1-S7, P1-P3)
    │   ├── animations.js     # Типы анимации
    │   ├── categories.js     # Категории и items
    │   ├── usageRights.js    # Права использования
    │   ├── paymentModels.js  # Модели оплаты
    │   ├── promoCodes.js     # Промокоды
    │   └── presets.js        # Готовые пресеты
    ├── components/           # React компоненты
    │   ├── index.js          # Центральный экспорт
    │   ├── Icon.jsx          # SVG иконки
    │   ├── Header.jsx        # Шапка
    │   ├── PresetBundles.jsx # Быстрые пресеты
    │   ├── StyleSelector.jsx # Выбор стиля
    │   ├── CategorySection.jsx # Секция категории
    │   ├── ItemRow.jsx       # Строка item
    │   ├── OptionsSection.jsx # Опции (ревизии)
    │   ├── SettingsSection.jsx # Настройки
    │   ├── PromoSection.jsx  # Промокоды
    │   ├── Sidebar.jsx       # Боковая панель (desktop)
    │   ├── MobileFooter.jsx  # Футер (mobile)
    │   └── InvoiceView.jsx   # Страница инвойса
    └── hooks/                # Кастомные хуки
        └── useCalculator.js  # Логика калькулятора

```

## Технологии

- React 18
- Vite
- Tailwind CSS
- clsx (утилита для классов)

## Особенности

- Все 36 items из 5 категорий отображаются корректно
- Детализация (details) добавлена для всех items
- Логика расчётов сохранена без изменений
- Адаптивный дизайн (desktop + mobile)
- Печать инвойса
