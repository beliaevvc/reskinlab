# Reflection: Dashboard Presets & Widgets

## Task Summary

**Task:** ReTracker Dashboard — Пресеты виджетов, исправление TaskStats, auto-scroll при resize  
**Date:** 2026-02-20  
**Complexity:** Level 2-3

### Scope

Комплексное улучшение дашборда ReTracker:
1. Система пресетов виджетов для разных ролей (5 пресетов)
2. Исправление виджета TaskStatsWidget (удаление разбивки по статусам)
3. Кнопки экспорта layout и сброса кэша
4. Замена нативного select на кастомный Select
5. Auto-scroll при drag и resize виджетов

---

## What Went Well

### 1. Пресеты виджетов

- **Удачная архитектура**: `ROLE_PRESETS` и `WIDGET_DEFINITIONS` разделены — метаданные виджетов (minW/minH/category) отдельно от конфигурации пресетов
- **Гибкость**: Каждый пресет содержит полный layout с точными координатами (x, y, w, h)
- **Пользовательский ввод**: Пользователь сам подобрал оптимальные размеры и позиции виджетов для каждого пресета через экспорт/импорт JSON

### 2. Упрощение TaskStats

- **Правильное решение**: Удаление `by_status` агрегации в пользу простых метрик (total, in_progress, created, completed)
- **Использование is_done флага**: Универсальный способ определения "выполнено" без привязки к конкретным названиям статусов

### 3. Developer Experience

- **Экспорт layout**: Кнопка копирует JSON в буфер — удобно для создания новых пресетов
- **Полный сброс**: Очистка localStorage для быстрого тестирования

---

## Challenges

### 1. Auto-scroll при resize НЕ работает

**Проблема:** `react-grid-layout` callback `onResize` не предоставляет mouse event напрямую.

**Первая попытка:** Использовать `onResize` callback — не работает, т.к. в нём нет координат курсора.

**Вторая попытка:** Глобальный `document.addEventListener('mousemove')` во время resize:
```javascript
const handleResizeStart = useCallback(() => {
  document.addEventListener('mousemove', handleMouseMoveForScroll)
}, [handleMouseMoveForScroll])

const handleResizeStop = useCallback(() => {
  document.removeEventListener('mousemove', handleMouseMoveForScroll)
  stopAutoScroll()
}, [handleMouseMoveForScroll, stopAutoScroll])
```

**Текущий статус:** Пользователь сообщил "не скроллится" — требуется дальнейшая отладка.

**Возможные причины:**
- `scrollContainerRef.current` может быть `null` или неправильный элемент
- `handleMouseMoveForScroll` может не вызываться из-за особенностей event propagation
- `containerRect.bottom - mouseY` может давать неверные значения

### 2. Алгоритм autoFillLayout (УДАЛЁН)

**Изначальная идея:** Автоматически заполнять пустое пространство виджетами при добавлении/удалении.

**Попытка 1:** Компактировать + расширять — пользователь отверг ("они не должны были так уменьшиться").

**Попытка 2:** Только расширять в свободное пространство — багованный алгоритм, `y: Infinity` при добавлении виджета.

**Решение:** Полностью удалить autoFillLayout, заменить на систему пресетов + ручной export/import.

### 3. Status breakdown в TaskStats

**Проблема:** Статусы из разных workspace'ов показывались как отдельные строки (дубликаты "В работе", "На проверке" и т.д.).

**Root cause:** Агрегация `GROUP BY status_key` не учитывала workspace_id, а пользователь хотел cross-workspace статистику.

**Решение:** Упростить до 4 метрик без разбивки:
- Всего задач (total)
- В работе (is_done = false)
- Создано за период (created_this_period)
- Выполнено за период (is_done = true + updated_at >= period)

---

## Lessons Learned

### 1. Итеративный дизайн через Export/Import

Вместо попыток угадать "правильный" layout программно — дать пользователю инструменты для ручной настройки и экспорта. Это намного эффективнее, чем сложные алгоритмы автозаполнения.

### 2. react-grid-layout ограничения

- `onResize` callback не даёт mouse event
- Для auto-scroll при resize нужен workaround через глобальные listeners
- Библиотека хорошо работает с CSS transforms, но интеграция с кастомной логикой скролла требует дополнительных усилий

### 3. Cross-workspace статистика

При агрегации данных из нескольких workspace нельзя просто группировать по названиям статусов — названия могут совпадать, но это разные сущности. Лучше использовать булевые флаги (is_done) или UUID статусов.

### 4. Пользовательские ожидания vs. алгоритмы

Алгоритм "оптимизации layout" был воспринят негативно, т.к. пользователь ожидал сохранения своей ручной настройки. При добавлении подобных фич важно:
- Делать их opt-in, не автоматическими
- Предоставлять undo/reset
- Чётко объяснять, что произойдёт

---

## Technical Decisions

### 1. Удаление autoFillLayout

**Причина:** Сложность алгоритма не оправдывала результат, пользователь предпочёл ручное управление.

**Альтернатива:** Система пресетов (full, manager, member, analyst, minimal) + экспорт для создания новых пресетов.

### 2. Хранение в localStorage

Dashboard config хранится в `retracker-dashboard-config` и `retracker-dashboard-config-preview`. При сбросе удаляются оба ключа.

### 3. Кастомный Select вместо native

По требованиям style guide все dropdowns должны использовать компонент `Select.jsx` вместо нативного `<select>`.

---

## Files Modified

| File | Changes |
|------|---------|
| `src/config/dashboardRolePresets.js` | 5 пресетов с детальными layouts |
| `src/pages/DashboardPage.jsx` | Кнопки экспорта/сброса, кастомный Select |
| `src/components/dashboard/WidgetGrid.jsx` | Auto-scroll при drag/resize |
| `src/components/dashboard/widgets/TaskStatsWidget.jsx` | 4 метрики вместо status breakdown |
| `src/hooks/useDashboardConfig.js` | Удалён autoFillLayout |
| `supabase/migrations/046_fix_dashboard_task_stats.sql` | Новая RPC функция |

---

## Pending Issues

### 1. Auto-scroll при resize не работает

**Статус:** Требуется отладка  
**Приоритет:** Medium  
**Следующие шаги:**
- Добавить `console.log` в `handleMouseMoveForScroll` для проверки вызова
- Проверить `scrollContainerRef.current` — правильный ли элемент найден
- Попробовать использовать `document.elementFromPoint()` для определения позиции

---

## Process Improvements

1. **Ранний прототип UI:** Для сложных взаимодействий (drag-resize-scroll) лучше сначала создать минимальный прототип и протестировать с пользователем
2. **Экспорт конфигураций:** Инструменты экспорта/импорта упрощают итерации и тестирование
3. **Fallback к ручному управлению:** Если автоматика сложна — предоставить удобные ручные инструменты

---

## Summary

Задача эволюционировала от "алгоритма оптимизации layout" к "системе пресетов с ручным экспортом". Это правильный pivot — сложные алгоритмы для UI часто проигрывают простым ручным инструментам. TaskStats упрощён до 4 метрик, что решило проблему дублирования статусов из разных workspace. Auto-scroll при drag работает, но при resize требуется дополнительная отладка.
