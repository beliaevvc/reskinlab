# TASK ARCHIVE: Fix Tasks Creation for Multiple Specifications

## METADATA
- **Task ID:** multiple-specifications-fix
- **Date Started:** 4 февраля 2026
- **Date Completed:** 4 февраля 2026
- **Complexity Level:** 2 (Enhancement with DB changes)
- **Status:** ARCHIVED ✅

---

## SUMMARY

Исправлен критический баг в системе автоматического создания задач. При дозаказе работ клиентом в рамках существующего проекта (новая спецификация → оффер → инвойс → оплата) задачи не создавались.

**Root Cause:** Функция `auto_create_tasks_on_first_payment()` проверяла "есть ли уже задачи в проекте" вместо "созданы ли задачи для ЭТОЙ КОНКРЕТНОЙ спецификации".

---

## REQUIREMENTS

### Бизнес-требования
- Клиент должен иметь возможность дозаказать работы в рамках одного проекта
- Для каждой новой спецификации должны создаваться свои задачи
- Задачи должны быть связаны с соответствующей спецификацией

### Технические требования
- Отслеживание источника задачи (какая спецификация её создала)
- Правильное отображение спецификации/оффера в карточке задачи
- Корректное обновление UI без перезагрузки страницы

---

## IMPLEMENTATION

### Database Changes

**Миграция:** `036_fix_tasks_for_multiple_specifications.sql`

1. **Новая колонка в tasks:**
```sql
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS source_specification_id UUID REFERENCES public.specifications(id);
```

2. **Backfill существующих данных:**
```sql
WITH first_paid_specs AS (
  SELECT DISTINCT ON (i.project_id) 
    i.project_id,
    o.specification_id
  FROM public.invoices i
  JOIN public.offers o ON o.id = i.offer_id
  WHERE i.status = 'paid'
    AND i.milestone_order = 1
  ORDER BY i.project_id, i.paid_at ASC NULLS LAST
)
UPDATE public.tasks t
SET source_specification_id = fps.specification_id
FROM first_paid_specs fps
WHERE t.project_id = fps.project_id
  AND t.source_specification_id IS NULL;
```

3. **Обновлённая функция триггера:**
- Проверка по `source_specification_id` вместо `project_id`
- При создании задач записывается `source_specification_id`
- Поддержка множественных спецификаций в одном проекте

### Frontend Changes

**TaskDetailModal.jsx:**
```javascript
// Было:
const activeSpec = specifications?.find(s => s.status !== 'draft') || specifications?.[0];

// Стало:
const activeSpec = task?.source_specification_id 
  ? specifications?.find(s => s.id === task.source_specification_id)
  : (specifications?.find(s => s.status !== 'draft') || specifications?.[0]);
```

**useInvoices.js:**
- Добавлена инвалидация `['project-offers']` в `useConfirmPayment`

---

## FILES MODIFIED

### New Files
| File | Description |
|------|-------------|
| `calculator/supabase/migrations/036_fix_tasks_for_multiple_specifications.sql` | Миграция БД |

### Modified Files
| File | Changes |
|------|---------|
| `calculator/src/components/tasks/TaskDetailModal.jsx` | Логика определения связанной спецификации |
| `calculator/src/hooks/useInvoices.js` | Инвалидация кеша project-offers |

---

## TESTING

### Verification Steps
1. ✅ Проверка данных в БД — backfill корректно связал задачи со спецификациями
2. ✅ Старые задачи показывают правильную спецификацию (v1)
3. ✅ Новые задачи показывают правильную спецификацию (v2)
4. ✅ Оффер отображается без перезагрузки страницы
5. ✅ Создание задач для новых спецификаций работает

### SQL Verification Query
```sql
SELECT 
  t.title,
  t.source_specification_id,
  s.version_number as spec_version
FROM tasks t
LEFT JOIN specifications s ON s.id = t.source_specification_id
WHERE t.project_id = '...'
ORDER BY t.created_at;
```

---

## LESSONS LEARNED

### 1. Query Key Consistency
При создании хуков с кастомными query keys нужно добавлять их инвалидацию во ВСЕ связанные мутации.

### 2. Прямые связи vs косвенные
Для задач важно хранить прямую связь `source_specification_id`, а не полагаться на косвенные связи через проект.

### 3. Поэтапная отладка
Проблема имела несколько слоёв:
- БД триггер (основная логика)
- Frontend отображение (TaskDetailModal)
- Кеширование (React Query)

Каждый слой требовал отдельного исправления.

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-multiple-specifications-fix.md`
- **Migration:** `calculator/supabase/migrations/036_fix_tasks_for_multiple_specifications.sql`
- **Related Pattern:** Query key invalidation (systemPatterns.md)

---

## ARCHIVE DATE
4 февраля 2026
