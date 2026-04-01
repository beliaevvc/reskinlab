# Task Reflection: ReTracker Performance Fix & Documentation

## Summary

Критический фикс медленной загрузки приложения ReTracker (11+ секунд до отображения данных). Root cause: `await fetchProfile()` в AuthContext блокировал `setLoading(false)` на 3 секунды (таймаут профиля), из‑за чего хуки данных (useWorkspace, useBoards, useTasks) не запускались. После разблокировки первый Supabase-запрос попадал на cold start (~7с). Решение: убрать `await` — профиль из кеша устанавливается мгновенно, сетевой запрос идёт в фоне. Результат: ~11.3с → ~0.97с (ускорение в 11 раз). Дополнительно: обновлён `memory-bank/systemPatterns.md` и создано правило `.cursor/rules/retracker-performance.mdc` для защиты от регрессий.

## What Went Well

- **Систематический debug с runtime evidence** — вместо догадок использовалась инструментация (fetch-логи в debug.log), что позволило точно выявить bottleneck.
- **Чёткая цепочка гипотез** — A (profile timeout), B (waterfall), C (duplicate workspace), D (cold start), E (overload). Логи подтвердили A и B.
- **Минимальный фикс** — изменение в 2 местах (убрать `await` в onAuthStateChange и getSession.then), без лишних обёрток и рефакторинга.
- **Документация для будущих агентов** — systemPatterns.md и retracker-performance.mdc защищают от случайного возврата `await` при рефакторинге AuthContext или дизайна.

## Challenges Encountered

- **Первоначальная гипотеза была неверной** — консоль показывала "Profile query timeout", но это не было главной причиной. Таймаут срабатывал, но блокировка была в `await`, а не в самом таймауте.
- **Логи в первом прогоне были неполными** — useBoards START без END. Потребовался второй прогон с дополнительной инструментацией (boards fetched, taskCount START/END), чтобы убедиться, что useBoards не зависает.
- **Второй прогон показал другую картину** — useWorkspace и useWorkspaces заняли 7.2с (cold start), а блокировка 3с была до их старта. Это окончательно указало на `await fetchProfile()`.

## Solutions Applied

- **Убрать `await` перед `fetchProfile()`** в обоих путях инициализации AuthContext. Кеш даёт мгновенный профиль, `setLoading(false)` вызывается сразу, хуки данных стартуют параллельно.
- **Оставить таймаут 3с в fetchProfile** — он защищает от зависания при проблемах с сетью, но больше не блокирует UI.
- **Документировать запреты** — не добавлять withTimeout на Supabase-запросы, не добавлять retry/retryDelay в React Query, не возвращать await перед fetchProfile.

## Key Technical Insights

- **Параллелизм важнее таймаутов** — при cold start Supabase все запросы медленные. Параллельный старт (без блокировки на профиле) даёт лучший результат, чем попытки "ускорить" через таймауты.
- **withTimeout на Supabase — антипаттерн** — легитимный запрос 20–25с (cold start) обрезается таймаутом → React Query ретраит → ещё 15с. Итого хуже, чем без таймаута.
- **Кеш профиля в localStorage** — синхронная установка в начале fetchProfile даёт мгновенный UI. Сетевой запрос может идти в фоне без блокировки.

## Process Insights

- **Debug mode с runtime evidence** — обязателен для performance-багов. Без логов с elapsed временем невозможно отличить "profile блокирует" от "Supabase cold start".
- **Итеративная инструментация** — первый прогон показал useBoards без END. Второй прогон с детализацией (boards fetched, taskCount) подтвердил, что useBoards быстрый. Фокус сместился на блокировку до старта хуков.
- **Документация сразу после фикса** — пользователь попросил сохранить настройки в memory bank, чтобы агенты при изменении дизайна не ломали производительность. Это предотвращает регрессии.

## Action Items for Future Work

- При любых изменениях в AuthContext, useWorkspaces, useBoards, useTasks — сверяться с `memory-bank/systemPatterns.md` и `.cursor/rules/retracker-performance.mdc`.
- Не добавлять `await` перед `fetchProfile()` в путях инициализации.
- Не оборачивать Supabase-запросы в withTimeout.
- При повторных жалобах на медленную загрузку — сначала проверить, не вернулся ли `await` в AuthContext.

## Files Modified

- `retracker/src/contexts/AuthContext.jsx` — убран await перед fetchProfile в onAuthStateChange и getSession.then
- `memory-bank/systemPatterns.md` — добавлены разделы "НЕ блокировать Auth Loading", "НЕ добавлять withTimeout", "Архитектура загрузки BoardPage"
- `.cursor/rules/retracker-performance.mdc` — новое правило для файлов AuthContext, хуков данных, main.jsx, supabase.js
