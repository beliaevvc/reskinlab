# TASK ARCHIVE: Client Dashboard Activity — Audit Logs Integration

## METADATA
- **Task ID:** client-dashboard-activity
- **Date:** 2026-02-07
- **Complexity:** Level 1
- **Status:** ARCHIVED ✅

---

## SUMMARY

Блок "Recent Activity" на клиентском дашборде переведён с синтетических данных (4 отдельных запроса к таблицам projects, specifications, offers, invoices) на настоящие аудит-логи из таблицы `audit_logs`. UI обновлён до стиля админского дашборда. Блок сделан сворачиваемым.

---

## REQUIREMENTS

1. Заменить синтетическую "активность" (запросы к entity-таблицам) на реальные аудит-логи клиента
2. Показывать только важные действия (без page_view, logout, админских операций)
3. Привести UI в соответствие со стилем админского дашборда (эмодзи, бейджи, разделители)
4. Сделать блок сворачиваемым

---

## IMPLEMENTATION

### useClientActivity.js — полная перезапись
- **Было:** 4 отдельных запроса к `projects`, `specifications`, `offers`, `invoices` с ручным формированием "псевдо-активности" из дат создания
- **Стало:** 1 запрос к `audit_logs` с фильтром `user_id = current user`, исключением шумных действий (`page_view`, `logout`, админские операции), обогащением через `enrichLogsWithParentNames()`
- RLS-политика (`user_id = auth.uid()`) гарантирует безопасность на уровне БД

### DashboardPage.jsx — ActivityItem в стиле админки
- Эмодзи-иконка действия (`getActionIcon`)
- Цветной бейдж типа действия (`getActivityBadgeColor`) — тот же маппинг что в AdminDashboardPage
- Человекочитаемые описания (`getHumanDescription`) с именами сущностей и контекстом проекта
- Кликабельные записи → страница проекта/офера/инвойса/спецификации
- Разделители между записями (`divide-y divide-neutral-100`)

### Collapsible блок
- `useState(false)` — свёрнут по умолчанию
- Шапка кликабельна целиком с hover-эффектом
- Счётчик записей в бейдже рядом с заголовком
- Анимация поворота шеврона (`rotate-180`)

---

## FILES MODIFIED

| File | Change |
|------|--------|
| `calculator/src/hooks/useClientActivity.js` | Полная перезапись: 4 entity queries → 1 audit_logs query |
| `calculator/src/pages/dashboard/DashboardPage.jsx` | Admin-style ActivityItem, badge colors, collapsible блок |

---

## LESSONS LEARNED

1. **Единый источник данных:** Если есть система audit_logs — она должна быть единственным источником для таймлайнов активности. Дублирование через запросы к entity-таблицам — антипаттерн.
2. **Переиспользование:** Вся инфраструктура форматирования (`auditLogHumanize.js`, `enrichLogsWithParentNames`, RLS) была уже готова — 0 новых утилит.
3. **Shared-модули:** `ACTIVITY_BADGE_COLORS` дублируется между админкой и клиентом — стоит вынести в `auditLogHumanize.js`.

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-client-dashboard-activity.md`
- **Related:** RLS-политика в `calculator/supabase/migrations/041_audit_logs_v2.sql`
- **Related:** `calculator/src/components/audit-logs/auditLogHumanize.js` — shared humanize/icon utilities
