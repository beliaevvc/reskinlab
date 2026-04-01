# Task Archive: ReTracker Performance Fix & Documentation

## Metadata

- **Task ID:** retracker-performance-fix
- **Complexity:** Level 2
- **Type:** Performance Fix + Documentation
- **Date Completed:** 2026-02-14
- **Project:** retracker

## Summary

Критический фикс медленной загрузки приложения ReTracker. Время загрузки сокращено с ~11.3 секунд до ~0.97 секунды (ускорение в 11 раз). Root cause: `await fetchProfile()` в AuthContext блокировал `setLoading(false)` на 3 секунды, из‑за чего хуки данных не запускались. После разблокировки первый Supabase-запрос попадал на cold start (~7с). Решение: убрать `await` — профиль из localStorage кеша устанавливается мгновенно, сетевой запрос идёт в фоне. Дополнительно создана документация в systemPatterns.md и правило retracker-performance.mdc для защиты от регрессий.

## Requirements Addressed

- Устранить медленную загрузку приложения (жалоба пользователя «снова всё медленно»)
- Сохранить настройки в memory bank для будущих агентов
- Обеспечить, чтобы агенты сверялись с документацией при изменениях в AuthContext и хуках данных

## Implementation Details

### Root Cause (подтверждено логами)

1. `await fetchProfile()` в `onAuthStateChange` и `getSession().then()` блокировал вызов `setLoading(false)`
2. Пока `loading=true`, приложение не рендерит роуты → хуки useWorkspace, useBoards, useTasks не запускаются
3. fetchProfile имеет таймаут 3с → блокировка минимум 3 секунды
4. Когда хуки наконец стартуют, первый Supabase-запрос попадает на cold start (~7с)
5. Итого: 3с + 7с + 1с = ~11 секунд

### Solution

Убрать `await` перед `fetchProfile()` в обоих путях инициализации AuthContext:

```javascript
// В onAuthStateChange и getSession().then():
if (currentUser) {
  fetchProfile(currentUser.id)  // без await
}
```

**Почему безопасно:** fetchProfile первым делом проверяет localStorage кеш и синхронно устанавливает профиль через setState. К моменту setLoading(false) кешированный профиль уже установлен. Сетевой запрос обновляет профиль в фоне.

### Key Files Modified

- **retracker/src/contexts/AuthContext.jsx** — убран await перед fetchProfile в onAuthStateChange и getSession.then
- **memory-bank/systemPatterns.md** — добавлены разделы:
  - «НЕ блокировать Auth Loading на fetchProfile»
  - «НЕ добавлять withTimeout на Supabase запросы»
  - «Архитектура загрузки данных (BoardPage)»
- **.cursor/rules/retracker-performance.mdc** — новое правило (globs: AuthContext, useWorkspaces, useBoards, useTasks, main.jsx, supabase.js) с абсолютными запретами

## Testing Performed

- **Debug mode с instrumentation** — fetch-логи в debug.log для замера elapsed времени каждого этапа
- **До фикса:** Profile START → 3с блок → useWorkspace START → 7.2с → useBoards → useTasks. Итого ~11.3с
- **После фикса:** Profile START → 11ms → useWorkspace/useBoard/useWorkspaces START (параллельно) → все END за ~1с. Итого ~0.97с
- **Верификация:** пользователь подтвердил быструю загрузку

## Lessons Learned

- **Параллелизм важнее таймаутов** — при cold start Supabase параллельный старт хуков даёт лучший результат, чем попытки «ускорить» через таймауты
- **withTimeout на Supabase — антипаттерн** — легитимный медленный запрос обрезается → React Query ретраит → ещё хуже
- **Debug mode с runtime evidence обязателен** для performance-багов — без логов невозможно отличить блокировку от cold start
- **Документация сразу после фикса** предотвращает регрессии при рефакторинге

## Absolute Prohibitions (для агентов)

1. НЕ добавлять `await` перед `fetchProfile()` в onAuthStateChange и getSession.then
2. НЕ оборачивать Supabase-запросы в withTimeout
3. НЕ добавлять retry/retryDelay в React Query defaultOptions для борьбы с медленными запросами
4. При изменениях в AuthContext/хуках — сверяться с memory-bank/systemPatterns.md

## References

- **Reflection:** `memory-bank/reflection/reflection-retracker-performance-fix.md`
- **Patterns:** `memory-bank/systemPatterns.md`
- **Rule:** `.cursor/rules/retracker-performance.mdc`
