# System Patterns & Critical Fixes

## КРИТИЧЕСКИ ВАЖНО: Supabase Auth SIGNED_IN Event

### Проблема (Февраль 2026)
Supabase Auth event `SIGNED_IN` срабатывает **до того, как токен авторизации полностью готов**. Запросы к базе данных во время обработки этого события **зависают бесконечно**.

**Симптомы:**
- Первая загрузка страницы работает
- После перезагрузки — бесконечный Loading...
- Запросы к базе зависают (timeout)
- В консоли: `[Auth] onAuthStateChange: SIGNED_IN` но профиль не загружается
- База данных работает нормально (SQL Editor быстрый)

**Причина:**
Event `SIGNED_IN` срабатывает перед `INITIAL_SESSION`. При `SIGNED_IN` токен ещё не полностью установлен в Supabase клиенте, поэтому запросы к базе зависают.

### Решение
В файле `calculator/src/contexts/AuthContext.jsx` **ОБЯЗАТЕЛЬНО** пропускать `SIGNED_IN` event:

```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  // SIGNED_IN event causes hanging queries - skip profile fetch for this event
  // Profile is already loaded from cache and via INITIAL_SESSION
  if (event === 'SIGNED_IN') {
    console.log('[Auth] Skipping SIGNED_IN event (causes hanging queries)');
    // Just set user from session, don't fetch profile
    if (session?.user) {
      setUser(session.user);
    }
    return;
  }
  
  // Handle INITIAL_SESSION and SIGNED_OUT normally
  // ... fetch profile here
});
```

### Дополнительная защита: Таймаут на запросы

```javascript
// Query with timeout to prevent hanging
const queryPromise = supabase.from('profiles').select('*').eq('id', userId).single();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Profile query timeout')), 3000)
);

const result = await Promise.race([queryPromise, timeoutPromise]);
```

---

## КРИТИЧЕСКИ ВАЖНО: Supabase Realtime WebSocket

### Проблема (Февраль 2026)
Supabase Realtime WebSocket автоматически подключается при создании клиента и **может блокировать HTTP запросы**. 

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

## AuthContext: Порядок событий Supabase Auth

### Порядок событий при загрузке страницы:
1. `SIGNED_IN` — токен ещё НЕ готов, запросы зависают
2. `INITIAL_SESSION` — токен готов, запросы работают

### Порядок событий при входе:
1. `signInWithPassword()` возвращает успех
2. `SIGNED_IN` event срабатывает
3. Можно делать запросы (токен уже установлен после signIn)

### Правило:
- При **перезагрузке страницы**: пропускать `SIGNED_IN`, обрабатывать `INITIAL_SESSION`
- При **входе через форму**: `SIGNED_IN` можно обрабатывать (токен уже готов)

---

## КРИТИЧЕСКИ ВАЖНО: Account Switcher и пропуск SIGNED_IN

### Проблема (Февраль 2026)
При переключении аккаунтов через AccountSwitcher профиль пользователя **не обновлялся**. UI показывал старого пользователя после переключения.

**Симптомы:**
- Нажатие на другой аккаунт в свитчере
- `signIn()` возвращает успех с новым userId
- Но UI продолжает показывать старый профиль (имя, роль, аватар)
- В консоли: `[Auth] Skipping SIGNED_IN event (causes hanging queries)`

**Причина:**
Поскольку `SIGNED_IN` event пропускается (для предотвращения зависающих запросов), `fetchProfile()` для нового пользователя **не вызывается**. Обработчик `onAuthStateChange` только устанавливает `setUser()`, но не загружает профиль.

### Решение
В функции `signIn()` в `AuthContext.jsx` **явно вызывать** `setUser()` и `fetchProfile()` после успешной авторизации:

```javascript
const signIn = async ({ email, password }) => {
  setError(null);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    // КРИТИЧЕСКИ ВАЖНО: Явно обновляем user и загружаем профиль
    // Это нужно потому что SIGNED_IN event пропускается
    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id, true); // force=true для обхода кеша
    }

    // ... остальной код
    return { data, error: null };
  } catch (err) {
    setError(err.message);
    return { data: null, error: err };
  }
};
```

### Почему это работает:
1. `signIn()` вызывается напрямую (не через event listener)
2. К моменту вызова `signInWithPassword()` уже вернул результат — токен готов
3. Явный вызов `fetchProfile(userId, true)` гарантирует загрузку профиля
4. `force=true` обходит localStorage кеш старого профиля

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

1. **Проверить консоль браузера** — логи AuthContext `[Auth] ...`
2. **Смотреть порядок событий**: `SIGNED_IN` → `INITIAL_SESSION`
3. **Network tab → Fetch/XHR** — есть ли запросы к API, зависают ли
4. **Supabase Dashboard → Query Performance** — медленные запросы
5. **pg_stat_activity** — зависшие соединения

Если запросы не уходят (0 Fetch/XHR) — проблема в AuthContext или Supabase client.
Если запросы зависают (pending) — проблема с токеном или RLS политиками.
