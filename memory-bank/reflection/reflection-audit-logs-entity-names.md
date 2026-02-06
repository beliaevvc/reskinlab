# Reflection: Audit Logs — Entity Names & Parent Context

## Task ID
`audit-logs-entity-names`

## Date
2026-02-06

## Summary
Расширение аудит-логов: добавление названий сущностей при логировании всех CRUD-операций, отображение родительского контекста (проект → спецификация, клиент → проект) и обогащение старых записей на лету.

---

## What Went Well

### 1. Умный подход к обогащению старых данных
Вместо бэкфилла БД (невозможно из-за RLS immutability) реализовано обогащение на уровне хука `enrichLogsWithParentNames`. Одна batch-операция на все логи — минимум запросов, максимум покрытия. Работает и для старых, и для новых записей.

### 2. Нормализация через humanize
Вместо изменения всех хуков для единого формата `name` — расширен `getHumanDescription` для чтения из множества полей (`name`, `title`, `code`, `company_name`, `filename`, `currency+network`, `version`). Это покрыло ~80% случаев одним изменением.

### 3. Переиспользование утилит
`fetchProjectName` и `fetchClientName` вынесены в `auditLog.js` и используются во всех хуках. `enrichLogsWithParentNames` используется и в `useAuditLogs`, и в `useDashboard` — нет дублирования.

### 4. Graceful degradation
Если проект удалён — контекст просто не показывается. Если metadata не содержит нужных полей — fallback на предыдущее поведение. Ни одна ошибка не ломает отображение.

---

## Challenges

### 1. Двойное логирование в хуках
Многие хуки логируют и в `mutationFn` (с await), и в `onSuccess` (fire-and-forget). При изменении формата return из `mutationFn` нужно было аккуратно протягивать данные (`_project_name`, `_client_name`) через оба места. Решение: возвращать обогащённый объект из `mutationFn` с underscore-prefix полями.

### 2. Разные форматы имён сущностей
Каждая сущность хранит "имя" в разных полях: `name`, `title`, `code`, `offer_number`, `version`, `currency+network`. Вместо унификации — адаптировали humanize для чтения всех вариантов. Trade-off: сложнее humanize, но не нужно менять десятки существующих записей.

### 3. RLS на audit_logs
Таблица audit_logs имеет политики `no_update` и `no_delete`. Это делает бэкфилл невозможным без service role key. Решение через client-side enrichment — правильный архитектурный выбор для данного контекста.

### 4. Каскадный fetch для контекста
Для получения `client_name` по проекту нужен join через 3 таблицы: `projects → clients → profiles`. В enrichment-функции использован вложенный select, который может быть хрупким при изменении схемы.

---

## Lessons Learned

### 1. Audit logs = snapshot, не reference
Лучшая практика для audit-логов: хранить snapshot данных в moment of logging (name, project_name, client_name), а не полагаться на join по ID. Это защищает от удалённых/изменённых сущностей.

### 2. Batch enrichment > per-row enrichment
При отображении списков — собирать все нужные ID и делать batch-запрос, а не fetch для каждой строки. Это критично для производительности на странице с 100 записями.

### 3. Underscore convention для internal fields
Паттерн `_project_name` для проброса данных между `mutationFn` → `onSuccess` — удобный способ передачи metadata без загрязнения основного объекта данных.

### 4. Humanize > Raw display
Пользователи лучше воспринимают "Создана спецификация v1.0 → проект «My Game»" чем "create_specification | specification | uuid". Инвестиция в humanize окупается быстро.

---

## Technical Improvements

### Файлы созданы
_(нет новых файлов)_

### Файлы изменены

| Файл | Изменение |
|------|-----------|
| `calculator/src/lib/auditLog.js` | Добавлены `fetchProjectName`, `fetchClientName`, `enrichLogsWithParentNames` |
| `calculator/src/components/audit-logs/auditLogHumanize.js` | Расширен поиск entityName (title, code, company_name, etc.), добавлен `getParentContext` |
| `calculator/src/components/audit-logs/AuditLogEntityLink.jsx` | Показ entityName в ссылке, subtext с родительским контекстом |
| `calculator/src/hooks/useAuditLogs.js` | Импорт и вызов `enrichLogsWithParentNames` |
| `calculator/src/hooks/useDashboard.js` | Импорт и вызов `enrichLogsWithParentNames` в `useRecentActivity` |
| `calculator/src/hooks/useProjects.js` | Добавлен `client_name` во все операции (create, update, delete, complete, archive) |
| `calculator/src/hooks/useSpecifications.js` | Добавлен `project_name` во все операции (create, save, finalize, delete, admin_delete) |
| `calculator/src/hooks/useOffers.js` | Добавлен `project_name` в create_offer, accept_offer |
| `calculator/src/hooks/useTasks.js` | Добавлен `project_name` в create, update, delete |
| `calculator/src/hooks/useOfferTemplates.js` | Добавлен `name` в delete |
| `calculator/src/hooks/usePromoCodes.js` | Добавлен `code` в delete |
| `calculator/src/hooks/useCryptoWallets.js` | Добавлены `currency`, `network` в delete |
| `calculator/src/pages/admin/AdminDashboardPage.jsx` | Обновлён ActivityItem: убран дубль entity_type, line-clamp-2 |

---

## Process Improvements

1. **Поэтапная реализация**: сначала humanize (быстрый win, 80% покрытие), потом delete-операции, потом parent context — от простого к сложному.
2. **Enrichment pattern**: паттерн "обогащение при отображении" можно переиспользовать для других контекстов (например, отображение имён assignee в задачах).
3. **Централизация**: весь audit-related код теперь в `auditLog.js` (logging + enrichment) и `auditLogHumanize.js` (display) — чёткое разделение.

---

## Next Steps

- [ ] Протестировать отображение на живых данных
- [ ] Рассмотреть кэширование `projectNamesMap` для повторных запросов
- [ ] При необходимости — добавить enrichment для других parent-сущностей (spec → offer)
- [ ] Обновить `memory-bank/style-guide.md` с паттерном audit log entity display
