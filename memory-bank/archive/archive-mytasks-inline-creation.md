# TASK ARCHIVE: My Tasks Inline Creation

## METADATA
| Field | Value |
|-------|-------|
| Task ID | mytasks-inline-creation |
| Date Started | 2026-02-17 |
| Date Completed | 2026-02-17 |
| Complexity Level | 3 |
| Status | COMPLETED ✅ |

---

## SUMMARY

Реализация inline-создания задач в разделе "Мои задачи" с поддержкой задач без привязки к доске (`board_id = NULL`), кастомный LocationPickerModal для назначения/изменения расположения, логирование изменений расположения в Activity Log.

**Основные изменения:**
- Убрана зелёная кнопка "Создать задачу" и модалка `CreateTaskFromMyTasks`
- Добавлен inline input для быстрого создания задач
- Задачи могут создаваться "без расположения" с последующим назначением
- Новый компонент `LocationPickerModal` для выбора Проект → Доска → Статус
- Изменения расположения логируются в Activity Log

---

## REQUIREMENTS

### Функциональные требования
1. Inline-создание задач через input вместо модалки
2. Поддержка задач без привязки к доске (`board_id = NULL`)
3. При создании из таба "В фокусе" — автоматическое добавление в фокус
4. Возможность назначить/изменить расположение из карточки задачи
5. Логирование изменений расположения в Activity Log

### Ограничения
- Создание недоступно при группировке по статусу или дедлайну
- Новые задачи должны появляться сверху списка

---

## IMPLEMENTATION

### Database Migration (029_tasks_nullable_board.sql)

```sql
-- Nullable columns
ALTER TABLE tasks ALTER COLUMN board_id DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN status_id DROP NOT NULL;

-- RLS policies for unassigned tasks
CREATE POLICY "Users can view their own unassigned tasks"
  ON tasks FOR SELECT TO authenticated
  USING (board_id IS NULL AND (created_by = auth.uid() OR assignee_id = auth.uid()));

CREATE POLICY "Users can create unassigned tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (board_id IS NULL AND created_by = auth.uid());

CREATE POLICY "Users can update their own unassigned tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (board_id IS NULL AND (created_by = auth.uid() OR assignee_id = auth.uid()))
  WITH CHECK (created_by = auth.uid() OR assignee_id = auth.uid());

CREATE POLICY "Users can delete their own unassigned tasks"
  ON tasks FOR DELETE TO authenticated
  USING (board_id IS NULL AND created_by = auth.uid());

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_tasks_unassigned_creator ON tasks (created_by) WHERE board_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_unassigned_assignee ON tasks (assignee_id) WHERE board_id IS NULL;
```

### New Components

#### LocationPickerModal.jsx
Модалка для каскадного выбора расположения задачи:
- `CustomSelect` — кастомный dropdown компонент
- Каскадный выбор: Проект → Доска → Статус
- Цветные точки для статусов
- Автовыбор первого статуса при выборе доски

### Modified Components

#### MyTasksList.jsx
- Inline input для создания задач
- Состояния: `isCreating`, `newTaskTitle`
- Логика: `handleStartCreate`, `handleSaveTask`, `handleNewTaskKeyDown`, `handleNewTaskBlur`
- При создании из "В фокусе" — вызов `addToFocus.mutate(taskId)`

#### TaskDetailModal.jsx
- Блок "Расположение" с навигацией и редактированием
- Клик на плашку → переход на доску
- Иконка карандаша → открывает LocationPickerModal
- "Без расположения — Назначить" для задач с `board_id = NULL`
- Activity logging при изменении расположения

#### useTasks.js
- `useCreateTask`: поддержка `board_id = null`, `status_id = null`
- `useDeleteTask`: полная инвалидация всех релевантных кешей

### Activity Logging
- Новый тип `ACTIVITY_TYPES.LOCATION_CHANGE`
- Иконка геолокации в TaskActivityLog
- Описание: "переместил из 'X' в 'Y > Z'"

---

## FILES CHANGED

### Created
| File | Description |
|------|-------------|
| `retracker/supabase/migrations/029_tasks_nullable_board.sql` | DB migration |
| `retracker/src/components/myTasks/LocationPickerModal.jsx` | Location picker modal |

### Modified
| File | Changes |
|------|---------|
| `retracker/src/pages/MyTasksPage.jsx` | Removed create button and modal |
| `retracker/src/components/myTasks/MyTasksList.jsx` | Inline creation |
| `retracker/src/components/tasks/TaskDetailModal.jsx` | Location block |
| `retracker/src/hooks/useTasks.js` | useCreateTask + useDeleteTask |
| `retracker/src/hooks/useMyTasks.js` | Sorting new tasks to top |
| `retracker/src/hooks/useMyTasksPreferences.js` | applyManualOrder |
| `retracker/src/hooks/useTaskActivity.js` | location_change type |
| `retracker/src/components/tasks/TaskActivityLog.jsx` | Location icon |
| `retracker/src/utils/activityLogger.js` | LOCATION_CHANGE constant |
| `retracker/src/locales/*/common.json` | Translations |

### Deleted
| File | Reason |
|------|--------|
| `retracker/src/components/myTasks/CreateTaskFromMyTasks.jsx` | Replaced by inline creation |

---

## TESTING

### Manual Testing Performed
1. ✅ Создание задачи через inline input
2. ✅ Создание задачи в табе "В фокусе" → появляется в фокусе
3. ✅ Удаление задачи → мгновенное исчезновение из списка
4. ✅ Изменение расположения через LocationPickerModal
5. ✅ Навигация на доску по клику на плашку расположения
6. ✅ Activity log при изменении расположения

### Edge Cases
- Задачи без расположения корректно отображаются
- Каскадный сброс dropdown'ов в LocationPickerModal
- Автовыбор первого статуса при смене доски

---

## DEBUG FIXES

| Issue | Root Cause | Fix |
|-------|------------|-----|
| SQL error: column "creator_id" does not exist | Wrong column name in migration | Changed to `created_by` |
| Tasks not appearing in focus | Wrong mutation argument | Changed `{ taskId }` to `taskId` |
| Empty status dropdown | Wrong object property | Used `status.label` instead of `status.custom_name` |
| Browser default selects | Native HTML elements | Created `CustomSelect` component |
| New tasks at bottom | Missing sort logic | Added secondary sort by `created_at` desc |
| Deleted tasks remain visible | Incomplete cache invalidation | Added all relevant query keys |

---

## LESSONS LEARNED

### Technical
1. **RLS для NULL значений** — требуются отдельные политики для nullable FK
2. **Partial indexes** — эффективны для запросов с WHERE условием
3. **React Query кеши** — при мутациях инвалидировать ВСЕ связанные ключи
4. **Кастомные формы** — всегда использовать кастомные компоненты в модалках

### Process
1. **Проверка схемы БД** — всегда проверять имена колонок перед миграцией
2. **API хуков** — читать исходный код хука перед использованием
3. **Полное тестирование** — тестировать все сценарии: создание, удаление, изменение

---

## PATTERNS DOCUMENTED

### Cache Invalidation Pattern (useDeleteTask)
```javascript
onSuccess: (_, { taskId, boardId }) => {
  if (boardId) queryClient.invalidateQueries({ queryKey: ['tasks', boardId] })
  queryClient.invalidateQueries({ queryKey: ['my-tasks'] })
  queryClient.invalidateQueries({ queryKey: ['focus-tasks'] })
  queryClient.invalidateQueries({ queryKey: ['my-tasks-counts'] })
  queryClient.invalidateQueries({ queryKey: ['user-focus-task-ids'] })
  queryClient.invalidateQueries({ queryKey: ['task', taskId] })
}
```

### Tasks Without Location Pattern
- `board_id = NULL`, `status_id = NULL`
- RLS: проверка `created_by` и `assignee_id`
- Отдельные политики для SELECT, INSERT, UPDATE, DELETE

---

## REFERENCES

| Document | Path |
|----------|------|
| Reflection | `memory-bank/reflection/reflection-mytasks-inline-creation.md` |
| System Patterns | `memory-bank/systemPatterns.md` |
| Tasks | `memory-bank/tasks.md` |

---

## ACTION REQUIRED

```bash
# Apply migration in Supabase SQL Editor:
retracker/supabase/migrations/029_tasks_nullable_board.sql
```

---

## NEXT STEPS
- [ ] Применить миграцию в production
- [ ] Добавить создание при группировке по проекту (LocationPickerModal при выборе)
- [ ] Оптимизировать инвалидацию кешей (partial key matching)
