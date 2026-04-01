# Reflection: Clickable Widgets on Kanban/List View

## Date: 2026-02-19/20

## Summary
Реализация кликабельных виджетов на карточках задач в Kanban и List view — редактирование значений виджетов прямо на доске без открытия модалки задачи. Также реализован виджет "Время в колонке" (Time in Column) с историей статусов.

## What Went Well

### 1. Архитектура компонентов
- **Переиспользование логики**: Dropdown-компоненты для редактирования (SelectDropdown, NumberDropdown, TextDropdown, UrlDropdown, TimeTrackingDropdown) вынесены в `WidgetSticker.jsx` и могут быть переиспользованы
- **Изолированная логика**: TimeInColumnSticker — полностью автономный компонент с собственным dropdown для истории статусов
- **Portal-based dropdowns**: Правильное использование `createPortal` для корректного позиционирования dropdowns вне DOM-иерархии карточки

### 2. UX решения
- **Умное позиционирование**: Dropdowns автоматически определяют, открываться влево или вправо в зависимости от позиции на экране
- **Кнопка "+" для добавления виджетов**: Появляется при наведении, не засоряет интерфейс
- **Event propagation control**: `stopPropagation()` предотвращает открытие карточки при клике на виджет

### 3. Time in Column Widget
- **Автообновление**: Интервал обновления адаптируется к длительности (секунды → минуты → часы)
- **История статусов**: Dropdown с timeline, показывающий все перемещения задачи между колонками
- **Real-time duration**: LiveDuration компонент для текущего статуса

### 4. Database Design
- **task_status_history**: Таблица для хранения истории перемещений
- **PostgreSQL triggers**: Автоматическое логирование при изменении status_id
- **SECURITY DEFINER**: Правильное решение для триггеров с RLS

## Challenges Encountered

### 1. Event Propagation Bug
**Проблема**: Клик по виджету `time_in_column` открывал и карточку задачи
**Решение**: Добавлен `e.stopPropagation()` и `e.preventDefault()` в обработчик `openDropdown`

### 2. Показ пустых виджетов
**Проблема**: Изначально в режиме `editable` показывались все виджеты, даже без значений
**Решение**: Убрали показ пустых виджетов, добавили кнопку "+" для добавления новых

### 3. SQL Trigger Errors
**Проблема**: Триггер `log_task_status_change` не мог записывать в `task_status_history` из-за RLS
**Решение**: `SECURITY DEFINER` + `GRANT INSERT, UPDATE ON task_status_history TO authenticated`

### 4. Network Timeouts (Supabase)
**Наблюдение**: Периодические `ERR_TIMED_OUT` при локальной разработке с удалённым Supabase
**Вывод**: Это нормально для локальной разработки, на production (Vercel) таких проблем не будет из-за edge-оптимизаций

## Lessons Learned

### 1. Portal-based Dropdowns
Для любых dropdown/popover компонентов внутри кликабельных элементов (карточки, строки) — всегда использовать `createPortal` и `stopPropagation`. Это предотвращает:
- Z-index проблемы
- Event bubbling на родительские элементы
- Обрезание overflow

### 2. Trigger Security
При использовании PostgreSQL triggers с RLS:
- `SECURITY DEFINER` позволяет триггеру работать от имени владельца функции
- Нужны явные `GRANT` для authenticated role
- Exception handling (`BEGIN...EXCEPTION WHEN OTHERS`) предотвращает блокировку основных операций

### 3. Sorting Order Matters
Изменение порядка сортировки (`ascending: true → false`) — простое изменение, но важно проверить все зависимые UI компоненты на корректное отображение.

### 4. Local vs Production Networking
При разработке с удалённым Supabase периодические таймауты — норма. Vercel + Supabase имеют peering-соединения и edge-оптимизации, которые устраняют эту проблему в production.

## Technical Decisions

### 1. Widget Value Default Creation
При добавлении нового виджета через "+" кнопку — создаём минимальное значение в БД (`{ option_id: null }` для select, `{ value: 0 }` для number), чтобы виджет появился на карточке и пользователь мог его отредактировать.

### 2. History Sorting
Новые записи истории статусов показываются сверху (descending by entered_at) — соответствует UX ожиданиям пользователя.

### 3. Time Formatting
Умное форматирование времени:
- < 1 мин: секунды (45с)
- < 1 час: минуты (12м)
- < 1 день: часы и минуты (2ч 30м)
- < 1 неделя: дни и часы (3д 5ч)
- >= 1 неделя: недели и дни (2н 3д)

## Files Changed

### Created
- `retracker/supabase/migrations/038_time_in_column.sql` — ENUM + column + widget template
- `retracker/supabase/migrations/039_task_status_history.sql` — history table + triggers
- `retracker/src/components/widgets/TimeInColumnSticker.jsx` — Time in Column widget

### Modified
- `retracker/src/components/widgets/WidgetSticker.jsx` — добавлены inline editors
- `retracker/src/components/widgets/TaskWidgets.jsx` — добавлена кнопка "+" для добавления виджетов
- `retracker/src/components/tasks/TaskCard.jsx` — передача taskId и editable
- `retracker/src/components/tasks/TaskListRow.jsx` — передача taskId и editable
- `retracker/src/components/widgets/TaskWidgetsSection.jsx` — auto-show time_in_column
- `retracker/src/hooks/useTaskWidgetValues.js` — useTaskStatusHistory hook

## Process Improvements

1. **Incremental Feature Rollout**: Сначала реализовали базовый функционал (Time in Column), затем расширили на все виджеты (clickable editing)

2. **User Feedback Loop**: Быстрая итерация на основе фидбека (убрать пустые виджеты → добавить кнопку "+")

3. **Debug Mode Value**: Debug mode помог выявить, что сетевые ошибки не связаны с кодом — это инфраструктурная особенность локальной разработки

## Next Steps

1. Добавить поддержку time_tracking виджета с inline редактированием
2. Рассмотреть возможность batch-редактирования виджетов для нескольких задач
3. Добавить keyboard shortcuts для быстрого редактирования (Enter для сохранения, Escape для отмены)
