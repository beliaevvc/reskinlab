# Reflection: Public Calculator + Dynamic Pricing

## Task ID
public-calculator-dynamic-pricing

## Date
2026-02-08

## Complexity
Level 3 — Многофазная задача с SQL-миграциями, новыми хуками, публичной страницей, кросс-компонентными изменениями и инструкциями по настройке Supabase.

---

## Summary

Реализована двухчастная функциональность:

1. **Динамические цены из Supabase** — калькулятор переведён с захардкоженных локальных значений на данные из `price_configs` через RPC `get_public_pricing()`. Локальные файлы остались как fallback и источник метаданных (имена, описания).

2. **Публичный калькулятор с шерингом** — анонимный доступ по ссылке `/shared/calculator`, система кодов (8-символьные), авто-создание проекта+спеки при регистрации, импорт кода для существующих пользователей.

---

## What Went Well

### 1. Обнаружение проблемы с ценами до реализации
При анализе проекта для шеринг-функции обнаружилась рассинхронизация между локальными ценами в JS-файлах и `price_configs` в Supabase. Это было критично — без исправления админ менял цены в PricingPage, но калькулятор их игнорировал. Проблема была поднята и решена ДО начала реализации.

### 2. Backward-compatible подход
`useCalculator(pricingData = null)` — хук работает как раньше без параметра. Все компоненты получили optional props с fallback на локальные импорты. Ни один существующий flow не сломался.

### 3. Security-first архитектура
- RPC с `security definer` вместо прямого доступа к таблицам
- RLS включён без политик — доступ только через RPC
- Rate limiting по IP-хешу (SHA-256, не сырой IP)
- `claim_shared_session` требует `auth.uid()` и использует `FOR UPDATE` для предотвращения race conditions
- Анонимный доступ строго ограничен тремя RPC-функциями

### 4. Чёткое разделение фаз
11 фаз от миграций до UI — каждая независима, каждая проверяема отдельно. SQL-миграции отделены от фронтенд-кода.

### 5. Единый хук `useDynamicPricing` 
Один хук для всего приложения — и CalculatorPage, и CalculatorModal, и PublicCalculatorPage используют одну и ту же логику загрузки цен с кешированием (staleTime: 30 min).

---

## Challenges

### 1. Массовая замена ссылок в useCalculator
Хук использовал импортированные константы (`ALL_ITEMS`, `STYLES`, `ANIMATIONS`) в 15+ местах: useState, useCallback, useMemo, useEffect. Каждую замену нужно было сделать аккуратно, добавив зависимости в массивы useCallback/useMemo.

**Решение:** Последовательная замена с промежуточными переменными `_allItems`, `_styles` и т.д. Все зависимости добавлены корректно.

### 2. Propagation pricing data через компоненты
6 компонентов импортировали данные напрямую из `../data`: StyleSelector, SettingsSection, ItemRow, CategorySection, CalculatorPage, CalculatorModal. Нужно было выбрать между Context API и props.

**Решение:** Выбран props-подход с fallback на локальные импорты. Это проще контекста, явно показывает data flow, и не требует Provider wrapper.

### 3. Claim flow через email verification
Регистрация в проекте требует email verification. Код нужно "пережить" между регистрацией и первым логином.

**Решение:** localStorage (`pending_shared_code`) + `PendingCodeBanner` на DashboardPage. Баннер появляется после логина, пользователь нажимает "Import" → claim → redirect на калькулятор.

### 4. Дублирование кнопок на десктопе
PublicCalculatorPage изначально имела кнопки и в sticky-баре, и в сайдбаре. Пользователь заметил избыточность.

**Решение:** `lg:hidden` на контейнер кнопок в sticky-баре. На десктопе — только сайдбар, на мобильном — sticky-бар + мобильный футер.

---

## Lessons Learned

### 1. Проверять синхронность данных при интеграции
Когда два источника данных существуют параллельно (локальные файлы + БД), рассинхронизация неизбежна. При планировании фичи, зависящей от данных, **всегда проверять** актуальность всех источников.

### 2. Optional props > Context для isolated features
Для калькулятора (конечное дерево компонентов) props с fallback оказались проще и прозрачнее, чем React Context. Context оправдан для данных, которые нужны "везде" (auth, theme). Для feature-specific данных — props.

### 3. RPC + security definer — золотой стандарт для анонимного доступа
Вместо открытия таблиц для `anon` роли через RLS-политики, RPC-функции дают полный контроль: валидация, rate limiting, бизнес-логика — всё в одном месте. Таблица остаётся закрытой.

### 4. Rate limiting на уровне SQL — просто и эффективно
`SELECT COUNT(*) ... WHERE ip_hash = $1 AND created_at > now() - INTERVAL '1 hour'` — одна строка SQL вместо Redis/middleware. Для MVP более чем достаточно.

### 5. localStorage для cross-page state (не session-critical)
Для передачи данных между registration → login → dashboard `localStorage` работает отлично. Не нужен Redux, не нужен URL state — код сохраняется и читается в нужный момент.

---

## Process Improvements

### 1. Фаза 0 для data integrity
При добавлении новой функциональности, зависящей от данных, **всегда начинать с аудита данных**. В этом проекте обнаружение проблемы с ценами сэкономило время — иначе публичный калькулятор показывал бы неправильные цены.

### 2. Инструкции по Supabase как часть deliverable
SQL-миграции без инструкции по ручному применению бесполезны. Пошаговая инструкция (Шаги 1-7 с проверками) — обязательная часть любого Supabase-related task.

---

## Technical Improvements

### 1. `useDynamicPricing` — переиспользуемый паттерн
Хук демонстрирует паттерн: "Supabase data + local fallback + React Query caching". Можно применить для других динамических настроек (minimum order, promo codes).

### 2. Shared sessions как шаблон
Архитектура `save → code → load → claim` может быть переиспользована для любой функции "гостевой работы с отложенной привязкой к аккаунту".

---

## Files Created
- `calculator/supabase/migrations/049_dynamic_pricing.sql`
- `calculator/supabase/migrations/050_shared_calculator_sessions.sql`
- `calculator/src/hooks/useDynamicPricing.js`
- `calculator/src/hooks/useSharedSessions.js`
- `calculator/src/lib/ipHash.js`
- `calculator/src/pages/calculator/PublicCalculatorPage.jsx`
- `calculator/src/components/calculator/ImportCodeModal.jsx`
- `calculator/src/components/calculator/PendingCodeBanner.jsx`

## Files Modified
- `calculator/src/hooks/useCalculator.js` — принимает pricingData, все ссылки динамические
- `calculator/src/pages/calculator/CalculatorPage.jsx` — useDynamicPricing, Import Code, Public Calculator link
- `calculator/src/components/project/CalculatorModal.jsx` — useDynamicPricing
- `calculator/src/components/StyleSelector.jsx` — optional styles prop
- `calculator/src/components/SettingsSection.jsx` — optional usageRightsList, paymentModelsList props
- `calculator/src/components/ItemRow.jsx` — optional animations prop
- `calculator/src/components/CategorySection.jsx` — pass animations to ItemRow
- `calculator/src/components/calculator/index.js` — exports
- `calculator/src/pages/auth/RegisterPage.jsx` — ?code= handling, localStorage
- `calculator/src/pages/dashboard/DashboardPage.jsx` — PendingCodeBanner
- `calculator/src/App.jsx` — /shared/calculator routes

## Next Steps
- Протестировать полный end-to-end flow (Шаг 7 из инструкции)
- Обновить PricingPage в админке для отображения актуальных config_data
- Добавить analytics tracking для публичного калькулятора (посещения, генерации кодов, конверсия в регистрацию)
- Рассмотреть SSR/meta tags для SEO публичной страницы
