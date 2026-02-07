# TASK ARCHIVE: Minimum Order Amount

## METADATA
- **Task ID:** minimum-order-amount
- **Date:** 2026-02-07
- **Complexity:** Level 2
- **Status:** ARCHIVED ✅

---

## SUMMARY

Реализована система минимальной суммы заказа для первого заказа в проекте. Минимум ($1000 по умолчанию) применяется только если в проекте нет оплаченных инвойсов. Промокоды не могут снизить цену ниже минимума. Настройка управляется через админку (Calculator Settings).

---

## REQUIREMENTS

1. Минимальная сумма заказа $1000 для **первого** заказа в проекте
2. Последующие заказы — без минимума
3. Настройка в админке: toggle вкл/выкл, сумма, кастомное сообщение
4. Промокод не может снизить цену ниже минимума: `grandTotal = max(price - discount, minimum)`
5. Для не первого заказа промокод может снизить до $0
6. Блокировка сохранения draft при сумме ниже минимума
7. Предупреждение в калькуляторе (subtle — мелкий текст)
8. Минимум применяется и к основным спецификациям, и к аддонам
9. Глобальная настройка для всех проектов
10. Первый заказ = нет оплаченных инвойсов в проекте

---

## IMPLEMENTATION

### Database (migration 045)
- Категория "Minimum Order" в `price_configs`:
  - `min_order_enabled` (value=1) — toggle
  - `min_order_amount` (value=1000) — сумма
  - `min_order_message` (description="текст") — сообщение клиенту

### Hook: useMinimumOrder
- Запрашивает настройки из price_configs (category="Minimum Order")
- Проверяет оплаченные инвойсы проекта (invoices WHERE status='paid')
- Возвращает: `{ isEnabled, amount, message, isFirstOrder, isBelowMinimum(), isMinimumActive }`

### Calculator Logic (useCalculator.js)
- Новый state: `minimumOrderConfig { amount, isFirstOrder, isEnabled }`
- Capping в totals: если первый заказ и grandTotal < minimum и finalTotal >= minimum → grandTotal = minimum
- Новые поля в totals: `minimumApplied`, `minimumOrderAmount`

### UI
- **Sidebar.jsx** — amber текст под суммой при нарушении минимума + "Promo capped"
- **MobileFooter.jsx** — аналогично
- **SaveDraftButton.jsx** — disabled + hover tooltip при belowMinimum
- **CalculatorModal.jsx** — та же логика + warning в footer
- **PricingPage.jsx** — кастомная секция MinimumOrderSection (toggle, $, message, preview)

---

## FILES

### Created
| File | Purpose |
|------|---------|
| `calculator/supabase/migrations/045_minimum_order_settings.sql` | Миграция: категория Minimum Order в price_configs |
| `calculator/src/hooks/useMinimumOrder.js` | Хук: settings + paid invoices check |

### Modified
| File | Changes |
|------|---------|
| `calculator/src/hooks/useCalculator.js` | minimumOrderConfig state + capping логика в totals |
| `calculator/src/pages/calculator/CalculatorPage.jsx` | useMinimumOrder + sync + props drilling |
| `calculator/src/components/Sidebar.jsx` | minimumOrder prop + amber warnings |
| `calculator/src/components/MobileFooter.jsx` | minimumOrder prop + amber warnings |
| `calculator/src/components/calculator/SaveDraftButton.jsx` | belowMinimum prop + tooltip |
| `calculator/src/components/project/CalculatorModal.jsx` | useMinimumOrder + sync + footer warning + save block |
| `calculator/src/pages/admin/PricingPage.jsx` | MinimumOrderSection + CATEGORY_ICONS/ORDER |

---

## LESSONS LEARNED

1. **Grep все потребители хука**: При изменении `useCalculator` — сразу искать ВСЕ файлы где он используется. Калькулятор встроен в 2 места (CalculatorPage + CalculatorModal)
2. **Миграции не автоматические**: Напоминать пользователю о необходимости применения SQL в Supabase Dashboard
3. **price_configs для не-числовых данных**: Кастомное сообщение хранится в `description` — workaround, но работает без изменения схемы

---

## REFERENCES
- **Reflection:** `memory-bank/reflection/reflection-minimum-order-amount.md`
- **Plan:** Minimum order amount (plan mode, this conversation)
