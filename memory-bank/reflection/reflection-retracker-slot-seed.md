# Task Reflection: ReTracker Seed — Lucky Fruits Slot

## Summary

Создание тестовых данных для ReTracker: проект «Lucky Fruits Slot» с 20 задачами по разработке слота, распределёнными по этапам Kanban (backlog, todo, in_progress, review, done). Задачи содержат дедлайны, чеклисты и назначения. Реализованы два способа seed: Node.js-скрипт с авторизацией и SQL-скрипт для Supabase SQL Editor.

## What Went Well

- **Осмысленный контент** — 20 задач охватывают полный цикл разработки слота (дизайн → движок → логика → бонусы → интеграция → релиз), что даёт реалистичный сценарий для тестирования ReTracker.
- **Два варианта seed** — Node-скрипт (npm run seed) и SQL (Supabase Dashboard) обеспечивают гибкость: первый работает через RLS с авторизованным пользователем, второй — с полными правами postgres.
- **Быстрое исправление SQL** — синтаксическая ошибка `(v_sort := v_sort + 1000)` в VALUES была исправлена выносом присваивания в отдельную строку.

## Challenges Encountered

- **Permission denied при service role** — Supabase JS client с `SUPABASE_SERVICE_ROLE_KEY` выдавал «permission denied for table profiles» при запросе к profiles. Причины не выяснены (возможно, особенности hosted Supabase). Решение: переключиться на авторизацию через email/password (SEED_EMAIL, SEED_PASSWORD).
- **SQL syntax error** — в PostgreSQL выражение `(v_sort := v_sort + 1000)` внутри `VALUES (...)` недопустимо: `:=` — оператор присваивания PL/pgSQL, а не часть SQL-выражения. Ошибка: `syntax error at or near ":="`.

## Solutions Applied

- **Auth-based seed script** — скрипт использует `signInWithPassword` и создаёт workspace/board/tasks от имени залогиненного пользователя. RLS корректно пропускает операции.
- **SQL seed** — `supabase/seed.sql` выполняется в SQL Editor с правами postgres. Присваивание переменной вынесено: `v_sort := v_sort + 1000;` перед каждым INSERT, в VALUES используется только `v_sort`.

## Key Technical Insights

- **PL/pgSQL vs SQL** — присваивание `:=` допустимо только в контексте PL/pgSQL (внутри DO $$ ... $$, функций). В обычном SQL (в т.ч. внутри VALUES) его использовать нельзя.
- **Supabase service role** — на hosted проектах может вести себя иначе, чем ожидается. Auth-based подход надёжнее для seed-скриптов, работающих в контексте приложения.
- **dotenv для Node-скриптов** — загрузка `.env` через `config({ path: ... })` обеспечивает доступ к переменным при запуске `npm run seed`.

## Process Insights

- **Итеративный подход** — сначала service role, затем auth; сначала Node-only, затем добавлен SQL как альтернатива. Это позволило получить рабочий результат несмотря на ограничения.
- **Документирование вариантов** — README-seed.md описывает оба способа (npm run seed и SQL Editor), что снижает порог входа для пользователя.

## Action Items for Future Work

- При добавлении новых seed-данных в `seed.sql` — использовать отдельные `v_sort := v_sort + 1000;` перед INSERT, не вставлять `:=` в VALUES.
- Если потребуется seed без интерактивного ввода — рассмотреть использование service role с проверкой GRANT-прав в БД.

## Files Created/Modified

### Created
- `retracker/scripts/seed-slot-project.mjs` — Node.js seed с auth
- `retracker/supabase/seed.sql` — SQL seed для Supabase SQL Editor
- `retracker/scripts/README-seed.md` — инструкции по запуску

### Modified
- `retracker/package.json` — добавлен script `seed`, зависимость dotenv
- `retracker/.env` — SEED_EMAIL, SEED_PASSWORD
- `retracker/.env.example` — шаблон переменных для seed
