# Task Archive: ReTracker Seed — Lucky Fruits Slot

## Metadata

- **Task ID:** retracker-slot-seed
- **Complexity:** Level 1
- **Type:** Seed Data / Testing Setup
- **Date Completed:** 2026-02-14
- **Project:** retracker

## Summary

Создание тестовых данных для ReTracker: проект «Lucky Fruits Slot» с 20 задачами по разработке слота. Задачи распределены по этапам Kanban (backlog, todo, in_progress, review, done), содержат дедлайны (январь–апрель 2025), чеклисты (2–4 пункта) и назначения. Реализованы два способа seed: Node.js-скрипт с авторизацией (SEED_EMAIL/SEED_PASSWORD) и SQL-скрипт для Supabase SQL Editor.

## Requirements Addressed

- 20 осмысленных задач по разработке слота для тестирования ReTracker
- Дедлайны, чеклисты, разные этапы Kanban
- Проект и доска для тестирования всех функций

## Implementation Details

### Seed Content

- **Workspace:** Lucky Fruits Slot (slug: lucky-fruits-slot)
- **Board:** Kanban (slug: kanban)
- **20 задач:** дизайн → движок → логика → бонусы → интеграция → релиз
- **Распределение по статусам:** done (3), in_progress (2), todo (4), review (2), backlog (9)

### Two Seed Options

1. **Node.js script** (`npm run seed`) — авторизация через SEED_EMAIL/SEED_PASSWORD, создание данных от имени пользователя (RLS-compliant)
2. **SQL** (`supabase/seed.sql`) — выполнение в Supabase SQL Editor с правами postgres

### SQL Fix Applied

Ошибка `syntax error at or near ":="` — выражение `(v_sort := v_sort + 1000)` внутри VALUES недопустимо в PostgreSQL. Решение: вынести присваивание в отдельную строку перед каждым INSERT.

## Files Created/Modified

### Created
- `retracker/scripts/seed-slot-project.mjs` — Node.js seed с auth
- `retracker/supabase/seed.sql` — SQL seed для Supabase SQL Editor
- `retracker/scripts/README-seed.md` — инструкции по запуску

### Modified
- `retracker/package.json` — script `seed`, зависимость dotenv
- `retracker/.env` / `.env.example` — SEED_EMAIL, SEED_PASSWORD

## Lessons Learned

- **PL/pgSQL `:=`** — присваивание допустимо только в контексте PL/pgSQL, не внутри VALUES
- **Supabase service role** — на hosted проектах может давать permission denied; auth-based seed надёжнее
- **Два варианта seed** — обеспечивают гибкость для разных окружений

## References

- **Reflection:** `memory-bank/reflection/reflection-retracker-slot-seed.md`
- **Instructions:** `retracker/scripts/README-seed.md`
