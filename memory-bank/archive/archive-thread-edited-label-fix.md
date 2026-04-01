# Архив задачи: Ложная «(ред.)» при старте треда

## Метаданные
- Дата начала: 2026-04-01
- Дата завершения: 2026-04-01
- Уровень сложности: 2

## Резюме
При первом ответе в треде у корневого сообщения появлялась пометка «(ред.)», хотя текст не редактировали. Причина — generic-триггер `update_updated_at_column()` бампил `updated_at` при любом UPDATE на `comments`, включая изменение thread-метаданных. Решение — замена на smart trigger `update_comments_updated_at_smart()`, который обновляет `updated_at` только при изменении `content`, `attachments`, `scheduled_at`.

## Требования
- Убрать ложную метку «(ред.)» при создании треда и ответах в нём
- Не затрагивать поведение при реальном редактировании текста сообщения

## Реализация

### Миграция 075
- Создан `update_comments_updated_at_smart()` — BEFORE UPDATE триггер, проверяющий `IS NOT DISTINCT FROM` для `content`, `attachments`, `scheduled_at`
- Заменён старый триггер `update_comments_updated_at` на smart-версию
- Переписаны `update_thread_stats()` и `decrement_thread_stats()` в чистом виде (без `ALTER TABLE`)
- Создан RPC `mark_comment_thread_root(p_comment_id UUID)` с `SECURITY DEFINER`

### Фронтенд
- `useAddComment` — вызов RPC `mark_comment_thread_root` вместо прямого `UPDATE`, с fallback на обычный UPDATE при ошибке

### Провалившиеся подходы
1. `ALTER TABLE DISABLE TRIGGER` без `SECURITY DEFINER` → 42501 (must be owner)
2. `ALTER TABLE DISABLE TRIGGER` с `SECURITY DEFINER` внутри триггера → 55006 (cannot ALTER TABLE in active session)
3. Финальное решение — smart trigger — сработало

## Изменённые файлы
- `retracker/supabase/migrations/075_thread_metadata_without_content_bump.sql` (новый)
- `retracker/src/hooks/useComments.js` (изменён)

## Тестирование
- Ручная проверка в UI: создание треда, несколько ответов — метка «(ред.)» не появляется
- Редактирование текста сообщения — метка «(ред.)» появляется корректно
- `npm run build` — успешно

## Уроки
- `ALTER TABLE DISABLE/ENABLE TRIGGER` невозможен внутри триггера на ту же таблицу (PostgreSQL ограничение 55006)
- Smart trigger с `IS NOT DISTINCT FROM` — правильный подход для таблиц с «контентными» и «метадатными» полями
- Fallback-паттерн (RPC → plain UPDATE) позволяет деплоить фронт независимо от миграции
- Runtime-логирование критически для отладки ошибок PostgreSQL

## Ссылки
- Рефлексия: `memory-bank/reflection/reflection-thread-edited-label-fix.md`
- Паттерн: `memory-bank/systemPatterns.md` → «Smart Trigger для updated_at на comments»
