# TASK ARCHIVE: Task Card & Comments Improvements

## METADATA
- **Task ID:** task-card-comments-improvements
- **Date Started:** 4 Февраля 2026
- **Date Completed:** 4 Февраля 2026
- **Complexity Level:** 2 (Multiple related improvements)
- **Status:** ARCHIVED ✅

---

## SUMMARY

Комплексное улучшение карточек задач и системы комментариев в приложении ReSkin Lab. Включает UI изменения, ограничения прав пользователей, систему отслеживания непрочитанных комментариев и подготовку инфраструктуры уведомлений.

---

## REQUIREMENTS

### Исходные задачи от пользователя:
1. Убрать выбор стадии (Stage) из модального окна задачи
2. Убрать текст "Unassigned" из карточек задач
3. Убрать лишние элементы (разделительные линии) когда нет контента
4. Запретить клиентам редактировать название и описание задачи
5. Добавить индикатор комментариев с отображением непрочитанных
6. Админ должен иметь возможность удалять любые комментарии

---

## IMPLEMENTATION

### 1. UI улучшения TaskDetailModal

**Файл:** `calculator/src/components/tasks/TaskDetailModal.jsx`

- Удалён импорт `useStages`
- Удалён вызов хука `useStages(projectId)`
- Удалена функция `handleStageChange`
- Удалён селект выбора стадии из UI
- Добавлена проверка `!isClient` для кнопки редактирования

### 2. UI улучшения TaskCard

**Файл:** `calculator/src/components/tasks/TaskCard.jsx`

- Заменён текст "Unassigned" на пустой `<div />`
- Футер показывается только если есть контент (assignee, attachments, comments)
- Добавлен индикатор непрочитанных комментариев:
  - Зелёный цвет (`text-emerald-600`) для непрочитанных
  - Формат "2/7" (непрочитанные/всего)
  - Серый цвет для прочитанных

### 3. Система отслеживания комментариев

**Миграция:** `029_comment_reads_tracking.sql`

```sql
CREATE TABLE public.comment_reads (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  comment_id UUID NOT NULL REFERENCES comments(id),
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, comment_id)
);
```

**Хук:** `useTasks.js` обновлён:
- Получает статистику комментариев для задач
- Подсчитывает непрочитанные (исключая свои комментарии)
- Polling каждые 10 секунд для обновления

### 4. Система уведомлений (для будущего)

**Миграция:** `030_notifications_system.sql`

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  project_id UUID,
  metadata JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

**Триггер:** `notify_on_new_comment()` — создаёт уведомления при новых комментариях

**Исправление:** `031_fix_notifications_trigger.sql` — исправлен триггер под реальную структуру БД

### 5. Удаление комментариев админом

**Миграция:** `032_admin_delete_any_comment.sql`

```sql
CREATE POLICY "comments_delete"
  ON public.comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

**Компонент:** `CommentItem.jsx` — добавлена проверка `canDelete = isAuthor || isAdmin`

---

## DATABASE MIGRATIONS

| # | Файл | Описание |
|---|------|----------|
| 029 | `comment_reads_tracking.sql` | Таблица отслеживания прочитанных комментариев |
| 030 | `notifications_system.sql` | Универсальная система уведомлений |
| 031 | `fix_notifications_trigger.sql` | Исправление триггера под реальную структуру БД |
| 032 | `admin_delete_any_comment.sql` | RLS политика для удаления комментариев админом |

---

## FILES CHANGED

### New Files
- `calculator/supabase/migrations/029_comment_reads_tracking.sql`
- `calculator/supabase/migrations/030_notifications_system.sql`
- `calculator/supabase/migrations/031_fix_notifications_trigger.sql`
- `calculator/supabase/migrations/032_admin_delete_any_comment.sql`
- `calculator/src/hooks/useNotifications.js` (для будущего использования)

### Modified Files
- `calculator/src/components/tasks/TaskDetailModal.jsx`
- `calculator/src/components/tasks/TaskCard.jsx`
- `calculator/src/components/comments/CommentItem.jsx`
- `calculator/src/hooks/useTasks.js`
- `calculator/src/hooks/useComments.js`

---

## TESTING

### Проверено вручную:
- [x] Stage не отображается в модальном окне задачи
- [x] "Unassigned" не отображается в карточках
- [x] Футер скрывается когда нет контента
- [x] Клиент не видит кнопку редактирования задачи
- [x] Индикатор комментариев показывает непрочитанные зелёным
- [x] Админ может удалять любые комментарии
- [x] Комментарии обновляются каждые 10 секунд

---

## LESSONS LEARNED

### 1. Supabase Realtime — осторожно
- WebSocket может блокировать HTTP запросы при перезагрузке
- Задокументировано в `systemPatterns.md`
- Polling — надёжная альтернатива для небольших проектов

### 2. Триггеры должны быть отказоустойчивыми
- Всегда добавлять EXCEPTION блок
- Не блокировать основную операцию при ошибке
- Логировать ошибки для отладки

### 3. Проверять структуру БД
- Перед написанием функций — изучить schema
- Не предполагать существование таблиц
- Использовать реальные FK связи

---

## KEY DECISIONS

| Решение | Причина |
|---------|---------|
| Polling вместо Realtime | Realtime блокирует HTTP запросы при перезагрузке |
| 10 секунд интервал | Компромисс между актуальностью и нагрузкой |
| Notifications таблица создана, но не используется | Инфраструктура для будущего UI уведомлений |
| EXCEPTION в триггере | Предотвращение блокировки при ошибках |

---

## FUTURE IMPROVEMENTS

1. **UI уведомлений** — колокольчик в хедере с dropdown списком
2. **Email уведомления** — Edge Function для отправки
3. **Оптимизация polling** — уменьшить интервал для активных страниц
4. **Исследовать Realtime** — возможно есть способ обойти блокировку

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-task-card-comments-improvements.md`
- **System Patterns:** `memory-bank/systemPatterns.md` (Realtime блокировка)
- **Tasks:** `memory-bank/tasks.md`

---

## ARCHIVE DATE
4 Февраля 2026
