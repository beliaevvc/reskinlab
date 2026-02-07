# Reflection: Minimum Order Amount

## Task ID
minimum-order-amount

## Date
2026-02-07

## Complexity
Level 2

---

## Summary

Реализована система минимальной суммы заказа ($1000) для первого заказа в проекте. Включает:
- Настройка в админке (Calculator Settings — секция Minimum Order)
- Логика capping промокодов (не могут снизить ниже минимума)
- Предупреждения в калькуляторе (Sidebar, MobileFooter, CalculatorModal)
- Блокировка сохранения draft при сумме ниже минимума
- Определение "первого заказа" через оплаченные инвойсы проекта

---

## What Went Well

1. **Структурированный подход через AskQuestion**: 10 вопросов с вариантами ответов до начала разработки — чётко определены все edge cases до написания кода
2. **Переиспользование инфраструктуры**: Вся логика настроек построена на существующей таблице `price_configs` и хуках `usePricing` / `useUpdatePriceConfig` без новых таблиц БД
3. **Разделение ответственности**: Хук `useMinimumOrder` — единая точка правды для всей логики минимума, используется и в `CalculatorPage`, и в `CalculatorModal`
4. **Capping логика**: Элегантное решение — `grandTotal = max(finalTotal - discount, minimum)`, реализованное прямо в `useCalculator.js` через дополнительный state

---

## Challenges

1. **Пропущен CalculatorModal**: При первоначальной реализации был обновлён только `CalculatorPage.jsx`, но проект использует ещё и `CalculatorModal.jsx` (внутри страницы проекта). Обнаружено только после тестирования пользователем — "в отдельном калькуляторе работает, но внутри проекта в модалке нет"

2. **Миграция не применяется автоматически**: Пользователь не знал, что SQL нужно вручную запустить в Supabase Dashboard. Нет автоматизации применения миграций в этом проекте

3. **Хранение message в description**: Кастомное сообщение для клиента хранится в поле `description` записи `min_order_message` (value=0, description="текст сообщения"). Это не идеально — price_configs предназначен для числовых значений — но работает без изменения схемы БД

---

## Lessons Learned

1. **ВСЕГДА проверять ВСЕ места использования хука/компонента**: При изменении `useCalculator` нужно было сразу найти ВСЕ файлы, где он используется (`grep useCalculator`), а не только основную страницу. В этом проекте калькулятор встроен в 2 места: `CalculatorPage` и `CalculatorModal`

2. **Паттерн "sync external data into hook state"**: Использование `useEffect` для синхронизации данных из `useMinimumOrder` в `useCalculator` через `setMinimumOrderConfig` — рабочий, но создаёт дополнительный render cycle. В будущем можно рассмотреть передачу через аргументы `useMemo`

3. **Admin UI для не-числовых настроек**: Существующая `PricingPage` заточена под числовые value — для настроек с toggle/message нужны кастомные секции. Паттерн `MinimumOrderSection` можно переиспользовать для будущих подобных настроек

4. **isBelowMinimum как функция**: Возврат функции из хука (`isBelowMinimum(grandTotal)`) вместо boolean — удобнее, т.к. grandTotal меняется в реальном времени, но нужно помнить что React не отслеживает вызовы функций для перерендера (работает корректно т.к. компонент перерендеривается при изменении totals)

---

## Process Improvements

1. **Чеклист при изменении хуков**: При любом изменении API хука — сразу grep все места использования и обновить все
2. **Документировать все entry points калькулятора**: Добавить в systemPatterns информацию о том, что калькулятор встроен в 2 места
3. **Миграции**: Напоминать пользователю о необходимости применения SQL миграции сразу после создания файла

---

## Technical Details

### Files Created
- `calculator/supabase/migrations/045_minimum_order_settings.sql`
- `calculator/src/hooks/useMinimumOrder.js`

### Files Modified
- `calculator/src/hooks/useCalculator.js` — minimumOrderConfig state + capping в totals
- `calculator/src/pages/calculator/CalculatorPage.jsx` — useMinimumOrder + sync + props
- `calculator/src/components/Sidebar.jsx` — warning + promo capped message
- `calculator/src/components/MobileFooter.jsx` — warning + promo capped message
- `calculator/src/components/calculator/SaveDraftButton.jsx` — belowMinimum + tooltip
- `calculator/src/components/project/CalculatorModal.jsx` — useMinimumOrder + sync + warning + block save
- `calculator/src/pages/admin/PricingPage.jsx` — MinimumOrderSection component

### Data Model
```
price_configs (category = 'Minimum Order'):
  - min_order_enabled: value=1 (toggle)
  - min_order_amount: value=1000 (amount in $)
  - min_order_message: value=0, description="Custom message" (text via description field)
```

### Business Logic
```
First order = no paid invoices in project (invoices WHERE project_id=X AND status='paid')
No project selected = treat as first order (conservative)

if (isFirstOrder && isEnabled && grandTotal < minimum && finalTotal >= minimum):
  grandTotal = minimum
  discountAmount = finalTotal - minimum
  minimumApplied = true
```
