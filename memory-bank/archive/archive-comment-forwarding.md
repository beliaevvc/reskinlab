# TASK ARCHIVE: Comment Forwarding

## METADATA
- **Task ID:** comment-forwarding
- **Date Started:** 2026-02-17
- **Date Completed:** 2026-02-17
- **Complexity Level:** 3
- **Commit:** `9118a49`
- **Status:** COMPLETED ✅

---

## SUMMARY

Реализована функциональность пересылки сообщений между карточками задач в ReTracker. Пользователь может переслать любое сообщение из чата одной карточки в другую, с сохранением контента, вложений и результатов опросов. Пересланные сообщения отображаются со специальным заголовком и ссылкой на источник.

---

## REQUIREMENTS

### Функциональные требования
1. Кнопка пересылки в hover-панели сообщения
2. Диалог выбора целевой карточки с тремя вкладками:
   - Поиск по названию/ключу
   - Недавние карточки
   - Дерево проектов (workspace → board → task)
3. Копирование контента и вложений
4. Снимок результатов опроса (read-only)
5. Возможность добавить комментарий при пересылке
6. Отображение заголовка "Переслано от @user из [Task]"
7. Отслеживание истории пересылок

### Нефункциональные требования
- Пересылка доступна в любую карточку, к которой есть доступ
- RLS политики для безопасности
- Локализация (ru/en)

---

## IMPLEMENTATION

### Database (PostgreSQL)

**Новые колонки в `comments`:**
```sql
forwarded_from_comment_id UUID
forwarded_from_task_id UUID
forwarded_from_author_id UUID
forwarded_at TIMESTAMPTZ
forward_comment TEXT
forwarded_poll_snapshot JSONB
```

**Новая таблица `comment_forwards`:**
```sql
CREATE TABLE comment_forwards (
  id UUID PRIMARY KEY,
  source_comment_id UUID NOT NULL,
  target_comment_id UUID NOT NULL,
  target_task_id UUID NOT NULL,
  forwarded_by UUID NOT NULL,
  created_at TIMESTAMPTZ
);
```

**RPC функция `forward_comment`:**
- Создаёт новый комментарий с копией контента
- Копирует вложения с новыми UUID
- Делает снимок результатов опроса
- Записывает в таблицу истории

### Frontend (React)

**Новые компоненты:**
| Компонент | Описание |
|-----------|----------|
| `ForwardMessageDialog` | Модальный диалог пересылки с preview и TaskPicker |
| `TaskPicker` | Переиспользуемый компонент выбора задачи (3 вкладки) |
| `ForwardedMessageHeader` | Заголовок пересланного сообщения |
| `ForwardedPollSnapshot` | Read-only отображение результатов опроса |

**Новые хуки:**
| Хук | Описание |
|-----|----------|
| `useForwardComment()` | Мутация для пересылки через RPC |
| `useForwardHistory(id)` | История пересылок сообщения |
| `useForwardCount(id)` | Количество пересылок |
| `useGlobalTaskSearch()` | Глобальный поиск задач |

### Архитектурные решения

1. **Portal для модалки** — `ForwardMessageDialog` рендерится через `createPortal(document.body)` с `z-[100]` для избежания click-through бага

2. **Снимок опроса** — результаты опроса сохраняются как JSONB snapshot, не как ссылка, чтобы показывать состояние на момент пересылки

3. **Копирование вложений** — вложения копируются с новыми UUID, ссылаясь на те же файлы в storage

---

## TESTING

### Debug Session
Использован формализованный debug-подход:

**Проблема:** Клики внутри диалога пробивались к элементам под модалкой

**Гипотезы:**
- A: recentTasks не возвращает данные → ОТКЛОНЕНО (логи: count=10)
- B: projectTree пустой → ОТКЛОНЕНО (логи: count=2)
- C: Клики на задачи не работают → ЧАСТИЧНО ПОДТВЕРЖДЕНО
- D: Параметры передаются неправильно → ОТКЛОНЕНО
- E: Табы не переключаются → ОТКЛОНЕНО после фикса
- F: Click-through из-за DOM-иерархии → ПОДТВЕРЖДЕНО

**Инструментация:** NDJSON логирование в 4 файлах

**Верификация:** Повторный прогон с логами подтвердил фикс

### Manual Testing
- [x] Пересылка текстового сообщения
- [x] Пересылка с вложениями
- [x] Пересылка с опросом
- [x] Поиск задач
- [x] Выбор из недавних
- [x] Навигация по дереву проектов

---

## LESSONS LEARNED

### Technical
1. **Вложенные модалки** — всегда использовать `createPortal(document.body)` для вложенных модальных окон
2. **Event propagation** — добавлять `stopPropagation()` на контейнер и содержимое модалки
3. **z-index** — использовать значительно большие значения (`z-[100]`) для вложенных модалок

### Process
1. **Debug workflow** — гипотезы + инструментация + верификация = эффективный поиск root cause
2. **Режим вопросов** — уточнение требований до начала реализации экономит время

### Reusability
- `TaskPicker` можно использовать для других сценариев выбора задачи
- `useGlobalTaskSearch` — универсальный хук для поиска по всем workspace'ам

---

## FILES

### Created (5 files)
```
retracker/src/components/comments/ForwardMessageDialog.jsx
retracker/src/components/comments/ForwardedMessageHeader.jsx
retracker/src/components/comments/ForwardedPollSnapshot.jsx
retracker/src/components/comments/TaskPicker.jsx
retracker/supabase/migrations/025_comment_forwarding.sql
```

### Modified (7 files)
```
retracker/src/components/comments/CommentItem.jsx
retracker/src/components/comments/CommentThread.jsx
retracker/src/components/comments/ThreadView.jsx
retracker/src/components/comments/index.js
retracker/src/components/tasks/TaskDetailModal.jsx
retracker/src/hooks/useComments.js
retracker/src/hooks/useTaskSearch.js
```

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-comment-forwarding.md`
- **System Patterns:** `memory-bank/systemPatterns.md` — TODO для прав доступа
- **Migration:** `retracker/supabase/migrations/025_comment_forwarding.sql`

---

## TODO (Future)

При реализации системы прав доступа:
- Проверять доступ к оригинальной карточке в `ForwardedMessageHeader`
- Делать ссылку некликабельной, если нет доступа
- Добавить `canAccess` проверку в `useSourceTaskInfo`
