# System Patterns & Critical Fixes

## КРИТИЧЕСКИ ВАЖНО: Supabase Realtime WebSocket

### Проблема (Февраль 2026)
Supabase Realtime WebSocket автоматически подключается при создании клиента и **блокирует HTTP запросы**. 

**Симптомы:**
- Первая загрузка страницы работает
- После перезагрузки — бесконечный Loading...
- Запросы к базе зависают (timeout)
- В консоли: "Profile fetch timeout"
- База данных работает нормально (SQL Editor быстрый)

**Причина:**
WebSocket Realtime занимает соединение и при переподключении блокирует REST API запросы.

### Решение
В файле `calculator/src/lib/supabase.js` **ОБЯЗАТЕЛЬНО** отключать Realtime:

```javascript
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    // Настройки Realtime
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
  }
);

// КРИТИЧЕСКИ ВАЖНО: Отключаем Realtime если не используем
supabase.realtime.disconnect();
```

### Когда Realtime нужен
Если в будущем понадобится Realtime (live updates), нужно:
1. Удалить `supabase.realtime.disconnect()`
2. Подключаться к каналам только когда нужно
3. Отключаться при unmount компонентов
4. Тестировать с перезагрузками страницы

---

## AuthContext: fetchingRef Pattern

### Проблема
`fetchingRef.current` может застрять в `true`, блокируя повторные запросы.

### Решение
**ВСЕГДА** сбрасывать `fetchingRef.current = false`:
- После успешной загрузки
- После ошибки
- После таймаута

```javascript
try {
  // ... запрос
  fetchingRef.current = false; // После успеха
} catch (err) {
  // ... обработка
  fetchingRef.current = false; // После ошибки
}
```

---

## React Query Settings

Рекомендуемые настройки для стабильной работы:

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false, // Важно для стабильности
    },
  },
});
```

---

## Отладка проблем с загрузкой

1. **Проверить консоль браузера** — логи AuthContext
2. **Network tab → Fetch/XHR** — есть ли запросы к API
3. **Supabase Dashboard → Query Performance** — медленные запросы
4. **pg_stat_activity** — зависшие соединения

Если запросы не уходят (0 Fetch/XHR) — проблема в AuthContext или Supabase client.
