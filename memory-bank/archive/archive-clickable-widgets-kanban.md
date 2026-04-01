# TASK ARCHIVE: Clickable Widgets on Kanban/List View

## METADATA
- **Task ID**: clickable-widgets-kanban
- **Date Started**: 2026-02-19
- **Date Completed**: 2026-02-20
- **Complexity Level**: 2-3
- **Status**: ARCHIVED ✅

## SUMMARY
Реализация кликабельных виджетов на карточках задач в Kanban и List view — редактирование значений виджетов прямо на доске без открытия модалки задачи. Также реализован виджет "Время в колонке" (Time in Column) с историей перемещений задачи между статусами.

## REQUIREMENTS

### Функциональные требования
1. Виджеты на карточках должны быть кликабельными и открывать inline-редактор
2. Кнопка "+" при наведении на карточку для добавления новых виджетов
3. Виджет "Время в колонке" показывает сколько задача находится в текущем статусе
4. При клике на виджет времени — показать историю перемещений между статусами
5. История сортируется: новые записи сверху
6. Виджет "Время в колонке" автоматически показывается на всех карточках если подключён к доске

### Технические требования
1. Dropdowns должны позиционироваться через Portal (вне DOM-иерархии карточки)
2. Клик на виджет не должен открывать карточку (stopPropagation)
3. Автоматическое логирование изменений статуса через PostgreSQL triggers
4. Адаптивное обновление времени (секунды → минуты → часы)

## IMPLEMENTATION

### Database Migrations

#### 038_time_in_column.sql
- Добавлен ENUM value `time_in_column` к `widget_type`
- Добавлена колонка `status_changed_at` к таблице `tasks`
- Триггер `update_status_changed_at` для автообновления при смене статуса
- Widget template "Время в колонке"

#### 039_task_status_history.sql
- Таблица `task_status_history` для хранения истории перемещений
- Триггер `log_task_status_change` (SECURITY DEFINER) для логирования
- RLS политики для доступа к истории
- GRANT INSERT, UPDATE для authenticated role

### Frontend Components

#### TimeInColumnSticker.jsx (Created)
```jsx
// Автономный компонент виджета времени в колонке
- formatDuration() — умное форматирование (с/м/ч/д/н)
- getUpdateInterval() — адаптивный интервал обновления
- StatusHistoryDropdown — dropdown с timeline историей
- LiveDuration — real-time счётчик для текущего статуса
```

#### WidgetSticker.jsx (Modified)
```jsx
// Добавлены inline dropdown editors
- SelectDropdown — для priority/select
- MultiSelectDropdown — для multi_select
- NumberDropdown — для number
- TextDropdown — для text
- UrlDropdown — для url
- TimeTrackingDropdown — для time_tracking
- getDropdownForType() — фабрика компонентов
```

#### TaskWidgets.jsx (Modified)
```jsx
// Контейнер виджетов на карточках
- AddWidgetDropdown — dropdown для добавления виджетов
- Кнопка "+" при наведении (group-hover)
- Передача taskId, editable, onChange, onClear в WidgetSticker
```

#### TaskCard.jsx & TaskListRow.jsx (Modified)
```jsx
// Передача новых props в TaskWidgets
- taskId={task.id}
- editable={canEdit}
- showAddButton={canEdit}
```

### Hooks

#### useTaskWidgetValues.js (Modified)
```javascript
// Новый hook для истории статусов
export function useTaskStatusHistory(taskId) {
  return useQuery({
    queryKey: ['task-status-history', taskId],
    queryFn: async () => {
      const { data } = await supabase
        .from('task_status_history')
        .select('*')
        .eq('task_id', taskId)
        .order('entered_at', { ascending: false }) // Новые сверху
      return data || []
    },
    enabled: !!taskId,
  })
}
```

## FILES CHANGED

### Created
| File | Description |
|------|-------------|
| `migrations/038_time_in_column.sql` | ENUM + column + widget template |
| `migrations/039_task_status_history.sql` | History table + triggers |
| `components/widgets/TimeInColumnSticker.jsx` | Time in Column widget |

### Modified
| File | Changes |
|------|---------|
| `components/widgets/WidgetSticker.jsx` | Inline dropdown editors для всех типов |
| `components/widgets/TaskWidgets.jsx` | Кнопка "+", editable mode |
| `components/widgets/TaskWidgetsSection.jsx` | Auto-show time_in_column first |
| `components/tasks/TaskCard.jsx` | taskId, editable, showAddButton props |
| `components/tasks/TaskListRow.jsx` | taskId, editable, showAddButton props |
| `hooks/useTaskWidgetValues.js` | useTaskStatusHistory hook |
| `hooks/useTasks.js` | Cache invalidation for status history |

## TESTING

### Manual Testing
1. ✅ Клик на виджет открывает dropdown редактор
2. ✅ Изменение значения сохраняется в БД
3. ✅ Клик на виджет НЕ открывает карточку
4. ✅ Кнопка "+" появляется при наведении
5. ✅ Добавление виджета через "+" работает
6. ✅ Time in Column показывает корректное время
7. ✅ История статусов отображается при клике
8. ✅ Новые записи истории появляются при перемещении задачи
9. ✅ Сортировка истории: новые сверху

### Edge Cases
- ✅ Виджеты работают в Kanban view
- ✅ Виджеты работают в List view
- ✅ Dropdown корректно позиционируется у края экрана
- ✅ Time in Column показывается даже без явного добавления к задаче

## LESSONS LEARNED

### 1. Portal-based Dropdowns
Для dropdown/popover внутри кликабельных элементов:
- Всегда использовать `createPortal(element, document.body)`
- Обязательно `e.stopPropagation()` и `e.preventDefault()`
- Умное позиционирование с учётом краёв viewport

### 2. PostgreSQL Triggers с RLS
- `SECURITY DEFINER` позволяет триггеру работать от имени владельца функции
- Нужны явные `GRANT INSERT, UPDATE` для authenticated role
- Exception handling предотвращает блокировку основных операций

### 3. Time Formatting UX
Умное форматирование времени улучшает читаемость:
- Секунды для очень коротких периодов
- Минуты для периодов до часа
- Комбинации (2ч 30м, 3д 5ч) для длинных периодов

### 4. Local vs Production Networking
Периодические таймауты к Supabase при локальной разработке — норма.
На production (Vercel) проблем не будет благодаря edge-оптимизациям.

## KEY DECISIONS

1. **Default value creation**: При добавлении виджета через "+" создаём минимальное значение (`{ option_id: null }`) чтобы виджет появился на карточке

2. **History sorting**: Новые записи сверху (DESC) — соответствует UX ожиданиям

3. **Auto-show time_in_column**: Если виджет подключён к доске, он показывается на всех карточках автоматически (не требует добавления к каждой задаче)

## REFERENCES

- **Reflection**: `memory-bank/reflection/reflection-clickable-widgets-kanban.md`
- **Related Pattern**: Portal-based dropdowns в `systemPatterns.md`
- **Database Schema**: `migrations/038_time_in_column.sql`, `migrations/039_task_status_history.sql`
