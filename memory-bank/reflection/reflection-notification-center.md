# Reflection: Notification Center

## Task ID
notification-center

## Date
2026-02-09

## Complexity
Level 3 — Intermediate (multi-layer: DB triggers + RPC functions + frontend hooks + UI components + deep-linking)

---

## Summary

Реализована полная система уведомлений: 14 типов триггеров в PostgreSQL, фронтенд-компоненты (колокольчик, дропдаун, карточки уведомлений), поллинг 15с, deep-linking в модалки проекта, батчевые уведомления при активации/деактивации стадий. Система покрывает три роли: client, AM, admin.

---

## What Went Well

### 1. Архитектура уведомлений через DB триггеры
- `SECURITY DEFINER` функции + `EXCEPTION WHEN OTHERS` — уведомления никогда не блокируют основные операции
- Хелпер `create_notification_for_user()` изолирует INSERT-логику
- Хелпер `get_project_stakeholders()` — переиспользуемый запрос стейкхолдеров

### 2. Быстрое выявление и фикс бага со стадиями
- Найдена корневая причина "Stage not found": `mergedStages` vs `stages` — плейсхолдерные стадии с `id: 'default-moodboard'` не находились в raw DB данных
- Правильно обработаны плейсхолдеры: INSERT для новых, UPDATE для существующих

### 3. Переход от per-row триггера к батчевому RPC
- Проблема: активация "UI Elements" создавала 3 отдельных уведомления (Moodboard, Symbols Design, UI Elements)
- Решение: RPC функция `notify_stages_changed()` — одно осмысленное уведомление на всю операцию
- Уведомления теперь идут ВСЕМ стейкхолдерам (client + AM + admins), не только клиенту

### 4. Deep-linking через query параметры
- Единый паттерн: `/projects/{id}?offer=uuid` / `?invoice=uuid` / `?spec=uuid` / `?task=uuid&comment=uuid`
- Все entity-уведомления ведут в проект → модалка, а не на отдельные страницы

---

## Challenges

### 1. `supabase.rpc(...).catch()` — PostgrestBuilder ≠ Promise
- **Проблема:** `.catch()` не существует на PostgrestBuilder, вызывает TypeError
- **Эффект:** Ломало ВСЮ мутацию — DB обновлялась, но onSuccess не срабатывал, UI не обновлялся
- **Фикс:** Заменил на `try { await ... } catch { }`
- **Урок:** Всегда использовать `try/catch` для Supabase RPC, никогда `.catch()`

### 2. Stacking context и z-index
- **Проблема:** Стрелка сайдбара (`fixed z-30`) просвечивала через дропдаун уведомлений
- **Первая попытка:** `z-[60]` на bell-контейнере — не помогло (вложен в header с `z-30` stacking context)
- **Решение:** Поднять z-index header'а с `z-30` до `z-40`
- **Урок:** Z-index дочернего элемента ограничен stacking context'ом родителя. Для отладки — всегда проверять z-index родительской цепочки

### 3. Dollar-quoting конфликт в SQL
- **Проблема:** `$$` внутри `$$` в pg_cron вызвал syntax error
- **Фикс:** `$outer$` для внешнего блока, `$cron$` для вложенного SQL
- **Урок:** При вложенных SQL блоках всегда использовать именованные dollar-quotes

### 4. Плейсхолдерные стадии и RLS
- **Проблема:** `mergedStages` содержит плейсхолдеры (`id: 'default-*'`), но `allStages` в модалке — только реальные из БД
- **Решение:** Передавать `mergedStages` в модалку, в мутации — разделять на placeholder/real и обрабатывать отдельно
- **Урок:** Когда UI показывает "merged" данные (DB + defaults), все компоненты в цепочке должны работать с этим merged набором

---

## Lessons Learned

### Технические

1. **Supabase RPC ≠ Promise** — PostgrestBuilder не имеет `.catch()`. Всегда `try/catch` или `const { error } = await supabase.rpc(...)`.

2. **Per-row триггеры не подходят для batch-операций** — При массовом UPDATE каждый row генерит отдельное уведомление. Для batch-действий — RPC функция, вызываемая из фронтенда.

3. **Z-index наследует stacking context** — Ребёнок с `z-50` внутри родителя с `z-30` не перекроет соседний `z-30` элемент. Решение: поднять z-index родителя или использовать Portal.

4. **Deep-linking через query params** — Универсальный паттерн для навигации к вложенным сущностям. `useSearchParams` + `useEffect` → read params → open modal → clear params.

5. **Placeholder объекты в UI** — Когда UI показывает "merged" массив (DB + defaults), ВСЕ мутации должны уметь работать с обоими типами объектов. Маркер `_isPlaceholder` помогает различать.

### Процессные

1. **Тестировать после каждого изменения** — Ошибка `.catch()` была скрыта, потому что код выглядел корректно. Hot-reload не всегда подхватывает изменения — нужен hard refresh.

2. **Визуальные баги требуют инспекции DOM** — Z-index проблема не решается добавлением бОльшего числа — нужно понимать stacking context.

---

## Files Created

| File | Purpose |
|------|---------|
| `migrations/051_notification_center.sql` | 14 триггеров, 2 хелпера, индексы, pg_cron cleanup |
| `migrations/052_fix_stage_notifications.sql` | Drop per-row trigger, batch RPC function |
| `src/hooks/useNotifications.js` | Хуки: fetch, count, mark read, navigation |
| `src/components/notifications/NotificationBell.jsx` | Колокольчик с badge + dropdown toggle |
| `src/components/notifications/NotificationDropdown.jsx` | Панель с фильтрами и списком |
| `src/components/notifications/NotificationItem.jsx` | Карточка уведомления с rich content |
| `src/components/notifications/index.js` | Barrel exports |

## Files Modified

| File | Changes |
|------|---------|
| `src/components/layout/AppHeader.jsx` | z-30 → z-40, добавлен NotificationBell |
| `src/hooks/useStages.js` | Placeholder handling, batch notification RPC |
| `src/pages/projects/ProjectPage.jsx` | Deep-link params (offer/invoice/spec), mergedStages в modal |
| `src/components/project/StageChangeModal.jsx` | Без изменений (работает с новыми allStages) |
| `src/components/comments/CommentThread.jsx` | highlightCommentId + scrollIntoView |
| `src/components/comments/CommentItem.jsx` | Highlight effect (bg-emerald-50/60, 2s fade) |
| `src/components/tasks/TaskDetailModal.jsx` | Pass highlightCommentId |
| `src/components/tasks/TaskListRow.jsx` | Comments icon moved to left (after checklist) |

---

## Process Improvements

1. **Supabase API cheat-sheet** — Создать шпаргалку по API: какие методы возвращают Promise, какие PostgrestBuilder, где нужен `await`, где `.then()`
2. **Z-index map** — Вести документ с z-index'ами всех fixed/sticky элементов проекта
3. **Smoke-test после RPC changes** — Любое изменение с `supabase.rpc()` тестировать сразу, не полагаться на код-ревью

---

## Next Steps

- [ ] Протестировать уведомления для всех ролей (client, AM, admin)
- [ ] Проверить получение уведомлений при: создании оффера, оплате, комментариях, загрузке файлов
- [ ] Проверить deep-linking для всех типов entity
- [ ] Проверить cleanup cron job для read notifications (90 дней)
- [ ] Рассмотреть переход с поллинга на Supabase Realtime (если стабилизируется)
