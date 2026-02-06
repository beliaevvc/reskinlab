# TASK ARCHIVE: Audit Logs — Entity Names & Parent Context

## METADATA
- **Task ID:** `audit-logs-entity-names`
- **Date Started:** 2026-02-06
- **Date Completed:** 2026-02-06
- **Complexity:** Level 3 (Multi-file, cross-cutting concern)
- **Status:** ARCHIVED ✅

## SUMMARY

Расширение системы аудит-логов для отображения:
1. **Названий сущностей** — при любой CRUD-операции в логе теперь указывается имя/название сущности (проект, задача, промокод, шаблон, кошелёк, спецификация)
2. **Родительского контекста** — спецификации/задачи/оферты показывают к какому проекту относятся, проекты — к какому клиенту
3. **Обогащение старых записей** — существующие логи без этих данных обогащаются на лету через batch-fetch при отображении

## REQUIREMENTS

### Исходный запрос пользователя
> "когда создаются, удаляются и тд проекты, спецификации и тд — надо бы в логах указывать названия этих проектов (и они кликабельны)"
> "ещё бы указывать к какому проекту и юзеру относилась спецификация или оферта — а если проект — то к какому юзеру"

### Функциональные требования
- При создании/обновлении/удалении сущностей — сохранять их имена в metadata аудит-лога
- При delete — получать имя ДО удаления из БД
- Для дочерних сущностей — сохранять имя родительского проекта
- Для проектов — сохранять имя клиента
- Старые записи без этих данных — обогащать при отображении
- Имена кликабельны (открывают модалку)
- Контекст отображается в humanized-описании и в entity link

## IMPLEMENTATION

### Архитектурные решения

1. **Snapshot подход** — имена сохраняются в metadata в момент логирования (audit log = snapshot)
2. **Enrichment pattern** — для старых записей: batch-fetch project_name/client_name при загрузке страницы
3. **Нормализация через humanize** — один `getHumanDescription` читает все возможные поля metadata вместо унификации формата

### Изменённые файлы (13)

#### Core утилиты
| Файл | Изменение |
|------|-----------|
| `calculator/src/lib/auditLog.js` | +`fetchProjectName()`, +`fetchClientName()`, +`enrichLogsWithParentNames()` |
| `calculator/src/components/audit-logs/auditLogHumanize.js` | Расширен entityName (title, code, company_name, filename, currency+network, version), +`getParentContext()` |
| `calculator/src/components/audit-logs/AuditLogEntityLink.jsx` | Entity name в ссылке, subtext с родительским контекстом (📁 / 👤) |

#### Data hooks — enrichment
| Файл | Изменение |
|------|-----------|
| `calculator/src/hooks/useAuditLogs.js` | Импорт и вызов `enrichLogsWithParentNames` после fetch |
| `calculator/src/hooks/useDashboard.js` | Импорт и вызов `enrichLogsWithParentNames` в `useRecentActivity` |

#### Data hooks — logging metadata
| Файл | Изменение |
|------|-----------|
| `calculator/src/hooks/useProjects.js` | +`client_name` в create, update, delete, complete, archive |
| `calculator/src/hooks/useSpecifications.js` | +`project_name` в create, save, finalize, delete, admin_delete |
| `calculator/src/hooks/useOffers.js` | +`project_name` в create_offer, accept_offer |
| `calculator/src/hooks/useTasks.js` | +`project_name` в create, update, delete |
| `calculator/src/hooks/useOfferTemplates.js` | +`name` в delete |
| `calculator/src/hooks/usePromoCodes.js` | +`code` в delete |
| `calculator/src/hooks/useCryptoWallets.js` | +`currency`, `network` в delete |

#### UI
| Файл | Изменение |
|------|-----------|
| `calculator/src/pages/admin/AdminDashboardPage.jsx` | ActivityItem: убран дубль entity_type, `line-clamp-2` |

### Паттерны

#### Получение имени перед удалением
```javascript
// В mutationFn — ДО delete
const { data: projectData } = await supabase
  .from('projects').select('name, client_id').eq('id', projectId).single();
const client_name = await fetchClientName(projectData?.client_id);

// delete...

return { id: projectId, name: projectData?.name, client_name };

// В onSuccess — передаём в лог
logProjectEvent('delete_project', id, { name, client_name });
```

#### Enrichment старых записей
```javascript
// Собрать все project_id без project_name → один batch SELECT
// Собрать все project entity_id без client_name → один batch SELECT с join
// Инжектировать в metadata каждого лога
```

#### Humanize с контекстом
```
Создана спецификация "v1.0" → проект «My Game»
Удалён проект "My Game" → клиент «Studio X»
Создана задача "Fix bug" → проект «My Game»
```

## TESTING

- Линтер: 0 ошибок на всех 13 файлах
- Старые записи: enrichment подтягивает project_name и client_name через batch-fetch
- Новые записи: metadata содержит все необходимые поля
- Graceful degradation: удалённые проекты — контекст не показывается, ошибок нет

## LESSONS LEARNED

1. **Audit logs = snapshot** — хранить имена в момент записи, а не полагаться на join
2. **Batch enrichment** — собирать ID и один запрос, а не fetch per row
3. **Underscore convention** (`_project_name`) — удобный проброс metadata через mutationFn → onSuccess
4. **Humanize покрывает 80%** — расширение одной функции вместо изменения десятков хуков

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-audit-logs-entity-names.md`
- **Plan:** `.cursor/plans/audit_log_entity_names_17f9a0f3.plan.md`
- **Related task:** Audit Logs v2 (миграция 041)
