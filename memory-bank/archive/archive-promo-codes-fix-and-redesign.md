# TASK ARCHIVE: Promo Codes — Full Fix & Redesign

## METADATA
- **Task ID:** promo-codes-fix-and-redesign
- **Date:** 2026-02-07
- **Complexity:** Level 2
- **Status:** ARCHIVED ✅

## SUMMARY
Комплексное исправление системы промокодов: два критических бага (CRUD в админке + применение в калькуляторе) и полный редизайн UI.

## REQUIREMENTS
1. Исправить создание промокодов в админке (ошибка `PGRST204`)
2. Исправить применение промокодов в калькуляторе (захардкоженные коды)
3. Улучшить UI таблицы промокодов
4. Улучшить UI модалки создания/редактирования
5. Показывать перечёркнутую цену при скидке

## IMPLEMENTATION

### Bug 1: Column Name Mismatch (Admin CRUD)
Код в `usePromoCodes.js` использовал 5 неправильных имён полей:
- `type` → `discount_type`, `value` → `discount_value`, `min_order` → `min_order_amount`, `expires_at` → `valid_until`, `times_used` → `current_uses`
- Дополнительно: маппинг `'percent'` (БД) ↔ `'percentage'` (UI)
- Исправлено в: `useCreatePromoCode`, `useUpdatePromoCode`, `useValidatePromoCode`, `PromoCodesPage.jsx`, audit log

### Bug 2: Calculator Using Hardcoded Data
`PromoSection.jsx` импортировал `validatePromoCode` из `data/promoCodes.js` — статичный объект с 4 кодами (PR10/PR20/PR30/PR50). Supabase не использовался.
- Переключён на `useValidatePromoCode` хук
- Добавлена async-валидация, loading state

### Bug 3: CalculatorModal Wrong Field
Footer использовал `totals.discount` (не существует) вместо `totals.discountAmount`.

### Calculator Enhancement
`useCalculator.js` поддерживал только процентные скидки. Добавлена обработка фиксированных: `Math.min(value, finalTotal)`.

### UI — Admin Table
- Строки кликабельны → модалка редактирования
- Код → копирование в буфер + "Copied!" фидбек
- Toggle Active/Inactive
- Иконка корзины + модалка подтверждения удаления

### UI — Create/Edit Modal
- Иконка в заголовке + X-кнопка
- Секционное разделение полей
- Toggle вместо чекбокса
- "Create Code" / "Save Changes", спиннер, disabled-состояние

### UI — PromoSection
- Applied: зелёный блок с галочкой, кодом, размером скидки
- Кнопка "Clear" для сброса
- Enter для применения

### UI — Price Display
- Sidebar, MobileFooter, CalculatorModal: перечёркнутая старая цена + новая зелёным

## TESTING
- Debug mode с fetch-инструментацией → NDJSON логи
- Гипотеза H1-H4 (column mismatch) подтверждена с первого раза
- Гипотеза H1 (hardcoded validation) подтверждена логами
- Post-fix верификация: промокод создаётся и применяется корректно

## FILES MODIFIED

| File | Changes |
|---|---|
| `calculator/src/hooks/usePromoCodes.js` | Маппинг полей CRUD к реальным столбцам БД |
| `calculator/src/pages/admin/PromoCodesPage.jsx` | Редизайн таблицы, модалок, DeleteConfirmModal |
| `calculator/src/components/PromoSection.jsx` | Supabase-валидация, applied-state UI |
| `calculator/src/hooks/useCalculator.js` | Поддержка fixed + percentage скидок |
| `calculator/src/components/Sidebar.jsx` | Перечёркнутая цена при скидке |
| `calculator/src/components/MobileFooter.jsx` | Перечёркнутая цена при скидке |
| `calculator/src/components/project/CalculatorModal.jsx` | Fix discount field, перечёркнутая цена |

## LESSONS LEARNED
1. Всегда сверять имена полей с `CREATE TABLE` миграцией
2. CHECK constraints определяют допустимые значения — UI маппит к ним
3. Захардкоженные данные = tech debt, заменять при первой миграции
4. Проверять всю цепочку: CRUD → validation → display
5. `e.stopPropagation()` обязателен при кликабельных строках

## REFERENCES
- **Reflection:** `memory-bank/reflection/reflection-promo-codes-fix-and-ui.md`
- **DB Schema:** `calculator/supabase/migrations/001_initial_schema.sql` (lines 45-58)
