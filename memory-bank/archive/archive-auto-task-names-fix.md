# Archive: Auto Task Names Fix

**Date:** 2026-02-04  
**Status:** COMPLETED ✅

## Summary

Комплексное исправление системы автоматического создания задач при первой оплате проекта. Исправлены проблемы с названиями задач, триггером создания, инвалидацией кэша и UI.

## Problems Solved

### 1. Названия задач не соответствовали калькулятору
- **Проблема:** Задачи отображались с сырыми item_id (например, "pop_win_s (x1)" вместо "Big Win (Simple) (x1)")
- **Причина:** Функция `get_item_task_name()` в БД содержала устаревшие/неправильные названия
- **Решение:** Обновлена функция с правильными названиями из `categories.js`

### 2. Триггер не обрабатывал проекты в статусе 'draft'
- **Проблема:** Задачи не создавались для новых проектов
- **Причина:** Триггер обновлял только проекты со статусом 'active' или 'pending_payment'
- **Решение:** Добавлен 'draft' в список допустимых статусов

### 3. Стадии не создавались автоматически
- **Проблема:** При первой оплате не создавались все 7 стадий проекта
- **Решение:** Добавлено создание всех стадий в триггер

### 4. UI не обновлялся после подтверждения платежа
- **Проблема:** Задачи и стадии не появлялись без перезагрузки страницы
- **Причина:** Не инвалидировался кэш React Query
- **Решение:** Добавлена инвалидация `['tasks']` и `['stages']` в `useConfirmPayment`

### 5. Лишний UI элемент
- **Проблема:** Плашка "Initialize Stages" в админке была не нужна
- **Решение:** Удалена из `ProjectPage.jsx`

### 6. Лишняя секция в задачах
- **Проблема:** Секция "Связь со спецификацией" не несла ценности
- **Решение:** Удалена из `TaskDetailModal.jsx` и бейджи из `TaskCard.jsx`

### 7. Orphaned records при удалении проекта
- **Проблема:** При удалении проекта оставались записи в invoices/offers
- **Решение:** Добавлена инвалидация кэшей при удалении

## Files Modified

### Frontend
- `calculator/src/hooks/useInvoices.js` — добавлена инвалидация tasks/stages
- `calculator/src/hooks/useProjects.js` — добавлена инвалидация при удалении
- `calculator/src/pages/projects/ProjectPage.jsx` — удалена плашка Initialize Stages
- `calculator/src/components/tasks/TaskDetailModal.jsx` — удалена секция связи
- `calculator/src/components/tasks/TaskCard.jsx` — удалены бейджи spec_item

### Database (применено в Supabase)
- Обновлена функция `get_item_task_name()` с правильными названиями
- Обновлены шаблоны в `task_spec_item_templates`
- Исправлены существующие задачи с сырыми item_id
- Обновлён триггер `auto_create_tasks_on_first_payment()`

### Migration Created
- `calculator/supabase/migrations/028_fix_item_names_from_calculator.sql`

## Key Mappings (item_id → name)

```
pop_win_s → "Big Win (Simple)"
pop_win_d → "Big Win (Illustrated)"
pop_start_s → "Bonus Start (Simple)"
pop_start_d → "Bonus Start (Illustrated)"
ui_pack_s → "UI Buttons Pack (Simple)"
ui_pack_d → "UI Buttons Pack (Detailed)"
menu_buy_s → "Bonus Buy Menu (Simple)"
menu_auto_s → "Autoplay Menu (Simple)"
screen_intro_s → "Onboarding (Simple)"
promo_cover → "Slot Cover (A/B Pack)"
promo_banner → "Promo Banner Pack"
...и другие из categories.js
```

## Testing

Протестировано на нескольких проектах:
1. Полный флоу: спецификация → оферта → акцепт → платёж → подтверждение
2. Задачи создаются с правильными названиями
3. Все 7 стадий создаются автоматически
4. UI обновляется без перезагрузки

## Related Documents

- **Reflection:** `memory-bank/reflection/reflection-auto-task-names-fix.md`
- **Source of Truth:** `calculator/src/data/categories.js` — все item_id и названия
