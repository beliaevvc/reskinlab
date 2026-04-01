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

## КРИТИЧЕСКИ ВАЖНО: НЕ блокировать Auth Loading на fetchProfile (Февраль 2026)

### Проблема
При инициализации AuthContext вызов `await fetchProfile()` **блокировал `setLoading(false)`** на 3 секунды (таймаут профиля). Это означало, что приложение не рендерилось и хуки данных (useWorkspace, useBoards и т.д.) не запускались, пока профиль не загрузится или не протаймаутится.

**Симптомы:**
- Приложение показывает спиннер 10-15+ секунд
- В консоли: `[Auth] Profile query timeout, using cached data` — несколько раз
- После загрузки всё работает быстро
- Особенно заметно при Supabase cold start (free tier)

**Причина (подтверждено логами):**
1. `fetchProfile()` имеет таймаут 3 секунды (`Promise.race`)
2. В `getSession().then()` и `onAuthStateChange()` был `await fetchProfile()` — это **блокировало** вызов `setLoading(false)` на 3 секунды
3. Пока `loading=true`, приложение не рендерит роуты → хуки данных не запускаются
4. Когда хуки наконец запускаются, первый запрос попадает на Supabase cold start (~7 секунд)
5. Итого: 3с (таймаут профиля) + 7с (cold start) + 1с (остальные запросы) = **~11 секунд**

### Решение
В `AuthContext.jsx` вызывать `fetchProfile()` **без await** в обоих путях инициализации:

```javascript
// В onAuthStateChange:
if (currentUser) {
  // ВАЖНО: НЕ await! Кеш даёт мгновенный профиль, сетевой запрос работает в фоне
  fetchProfile(currentUser.id)
}

// В getSession().then():
if (currentUser) {
  // ВАЖНО: НЕ await! Кеш даёт мгновенный профиль, сетевой запрос работает в фоне
  fetchProfile(currentUser.id)
}
```

**Почему это безопасно:**
- `fetchProfile()` первым делом проверяет localStorage кеш и **синхронно** (через setState) устанавливает профиль из кеша
- К моменту `setLoading(false)` кешированный профиль уже установлен
- Сетевой запрос обновляет профиль в фоне, когда Supabase ответит

**Результат (подтверждено логами):**
- **ДО:** ~11,300ms (3с блок + 7с cold start + 1с данные)
- **ПОСЛЕ:** ~970ms (все запросы параллельно, без блокировки)
- Ускорение в **11 раз**

### ЗАПРЕЩЕНО:
- `await fetchProfile()` в `onAuthStateChange` — блокирует рендер
- `await fetchProfile()` в `getSession().then()` — блокирует рендер
- Добавление `withTimeout()` обёрток на хуки данных (useWorkspaces, useBoards) — только ухудшает производительность, см. ниже

---

## КРИТИЧЕСКИ ВАЖНО: НЕ добавлять withTimeout на Supabase запросы (Февраль 2026)

### Проблема
Попытка обернуть запросы к Supabase в `withTimeout()` или `Promise.race()` с таймаутами **только ухудшает** производительность.

**Что было сделано (и откачено):**
- Добавлена утилита `withTimeout(promise, ms)` для обёрачивания запросов
- Запросы в `useWorkspaces` и `useBoards` обёрнуты в `withTimeout(query, 15000)`
- React Query настроен с `retry: 1, retryDelay: 2000`

**Результат:**
- Supabase cold start занимает ~20-25с (легитимный запрос)
- `withTimeout(15s)` убивает запрос → React Query ретраит → ещё 15с
- Итого: 15с + 2с + 15с = **~32 секунды** вместо ~20с без таймаутов

### Правило
- **НИКОГДА** не добавлять `withTimeout()` на Supabase запросы в хуках
- **НИКОГДА** не настраивать `retry` и `retryDelay` в React Query `defaultOptions` для борьбы с медленными запросами
- React Query со стандартными настройками обрабатывает медленные запросы корректно

---

## КРИТИЧЕСКИ ВАЖНО: React Query Mutations — Оптимистичные обновления

### Проблема (Февраль 2026)
При обновлении данных через Supabase UI не обновлялся мгновенно. Пользователь менял название (проекта, доски, задачи), данные сохранялись в базу, но UI показывал старое значение до рефреша.

**Симптомы:**
- Изменение сохраняется (после F5 видно новое значение)
- Но UI не обновляется сразу после редактирования
- Особенно заметно для вложенных данных (workspace.name в карточке задачи)

### Решение: Паттерн оптимистичного обновления

```javascript
export function useUpdateEntity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ entityId, updates }) => {
      const { data, error } = await supabase
        .from('entities')
        .update(updates)
        .eq('id', entityId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    
    // 1. ОПТИМИСТИЧНОЕ ОБНОВЛЕНИЕ — мгновенный UI
    onMutate: async ({ entityId, updates }) => {
      // Отменяем исходящие запросы
      await queryClient.cancelQueries({ queryKey: ['entities'] })
      
      // Сохраняем предыдущие данные для rollback
      const previousData = queryClient.getQueryData(['entities'])
      
      // Оптимистично обновляем список
      queryClient.setQueryData(['entities'], (old) => {
        if (!old) return old
        return old.map(item => item.id === entityId ? { ...item, ...updates } : item)
      })
      
      // Обновляем и индивидуальные кеши по ID/slug
      const allQueries = queryClient.getQueriesData({ queryKey: ['entity'] })
      allQueries.forEach(([key, data]) => {
        if (data?.id === entityId) {
          queryClient.setQueryData(key, { ...data, ...updates })
        }
      })
      
      return { previousData }
    },
    
    // 2. ROLLBACK ПРИ ОШИБКЕ
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['entities'], context.previousData)
      }
    },
    
    // 3. ИНВАЛИДАЦИЯ — синхронизация с сервером
    onSuccess: (data) => {
      // Основные кеши
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      queryClient.invalidateQueries({ queryKey: ['entity', data.slug] })
      
      // ВАЖНО: Инвалидация связанных данных
      // Если entity вложен в другие объекты (например workspace в task)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['task'] })
    },
  })
}
```

### Ключевые правила:

1. **onMutate** — обновляет UI мгновенно (до ответа сервера)
2. **onError** — откатывает изменения при ошибке
3. **onSuccess** — инвалидирует ВСЕ связанные кеши

### ВАЖНО: Инвалидация вложенных данных

Если сущность A вложена в сущность B (например `task.board.workspace`), при изменении A нужно инвалидировать и B:

```javascript
// При изменении workspace
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['workspaces'] })
  queryClient.invalidateQueries({ queryKey: ['workspace', data.slug] })
  // ВАЖНО: task содержит board.workspace — тоже инвалидируем
  queryClient.invalidateQueries({ queryKey: ['task'] })
}

// При изменении board
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ['boards'] })
  queryClient.invalidateQueries({ queryKey: ['board'] })
  // ВАЖНО: task содержит board — тоже инвалидируем
  queryClient.invalidateQueries({ queryKey: ['task'] })
  queryClient.invalidateQueries({ queryKey: ['tasks'] })
}
```

### ЗАПРЕЩЕНО:

- Только `invalidateQueries` без `onMutate` — UI обновится с задержкой
- Забывать инвалидировать связанные кеши — вложенные данные не обновятся
- `.select('*')` ПЕРЕД `.update()` в Supabase — вызовет ошибку (правильно: `.update().select()`)

---

## КРИТИЧЕСКИ ВАЖНО: Supabase Update Chain

### Проблема (Февраль 2026)
Обновление записи в Supabase не работало — данные не сохранялись.

**Причина:**
Неправильный порядок методов в цепочке Supabase:

```javascript
// НЕПРАВИЛЬНО — .select() перед .update()
const { data, error } = await supabase
  .from('boards')
  .select('*')  // ❌ Это SELECT запрос!
  .update(updates)  // Игнорируется
  .eq('id', boardId)

// ПРАВИЛЬНО — .update() потом .select()
const { data, error } = await supabase
  .from('boards')
  .update(updates)  // ✅ UPDATE запрос
  .eq('id', boardId)
  .select()  // Возвращает обновлённые данные
  .single()
```

### Правило:
Порядок методов в Supabase определяет тип запроса:
- `.select()` первым → SELECT
- `.insert()` первым → INSERT
- `.update()` первым → UPDATE
- `.delete()` первым → DELETE

`.select()` после `.update()/.insert()` — это RETURNING clause, не новый запрос.

---

## React Query Settings

Рекомендуемые настройки для стабильной работы:

```javascript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      // НЕ добавлять retry/retryDelay — стандартные настройки работают лучше
      refetchOnWindowFocus: false, // Важно для стабильности
    },
  },
});
```

---

## Архитектура загрузки данных (BoardPage)

### Цепочка запросов при открытии доски:
1. `useWorkspace(slug)` — загрузка workspace по slug
2. `useBoards(workspace.id)` — загрузка списка досок (зависит от workspace)
3. Редирект на первую доску (если boardSlug не задан)
4. `useBoard(workspaceSlug, boardSlug)` — загрузка конкретной доски (параллельно с п.1-2)
5. `useTasks(board.id)` — загрузка задач (зависит от board)

### Параллелизм:
- `useWorkspace` и `useBoard` запускаются **параллельно** (оба зависят только от URL-параметров)
- `useWorkspaces` (в Layout) запускается **параллельно** со всем остальным
- `useBoards` ждёт `workspace.id` → запускается после `useWorkspace`
- `useTasks` ждёт `board.id` → запускается после `useBoard`

### ЗАПРЕЩЕНО менять:
- Убирать `enabled: !!workspaceId` из `useBoards` — вызовет запрос с null
- Добавлять `await` перед `fetchProfile()` в AuthContext — блокирует всю цепочку
- Добавлять таймауты/обёртки на любые Supabase запросы в хуках

---

## Отладка проблем с загрузкой

1. **Проверить консоль браузера** — логи AuthContext `[Auth] ...`
2. **Смотреть порядок событий**: `SIGNED_IN` → `INITIAL_SESSION`
3. **Network tab → Fetch/XHR** — есть ли запросы к API, зависают ли
4. **Supabase Dashboard → Query Performance** — медленные запросы
5. **pg_stat_activity** — зависшие соединения

Если запросы не уходят (0 Fetch/XHR) — проблема в AuthContext или Supabase client.
Если запросы зависают (pending) — проблема с токеном или RLS политиками.

---

## КРИТИЧЕСКИ ВАЖНО: Z-index и Pointer-events в модалках

### Проблема (Февраль 2026)
Вложенные модалки (например, модалка подтверждения удаления внутри TaskDetailModal) не реагируют на клики.

**Симптомы:**
- Модалка отображается корректно
- Кнопки видны, но не кликаются
- Клик "проваливается" сквозь модалку

### Причины и решения

#### 1. Stacking Context и pointer-events-none

**Проблема:** В режиме боковой панели (`isPanel`) родительский контейнер имеет `pointer-events-none`:

```jsx
// TaskDetailModal — родительский контейнер
<div className={isPanel 
  ? 'fixed top-0 right-0 bottom-0 z-50 flex justify-end pointer-events-none'
  : 'fixed inset-0 z-50 flex items-center justify-center p-4'
}>
```

Вложенная модалка подтверждения **наследует** `pointer-events-none`, даже если у неё свой `z-index`.

**Решение:** Добавить `pointer-events-auto` на контейнер вложенной модалки:

```jsx
{/* Вложенная модалка */}
{showDeleteConfirm && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-auto">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
    <div className="relative z-10 bg-white rounded-lg ...">
      {/* Контент модалки */}
    </div>
  </div>
)}
```

#### 2. Backdrop перекрывает контент

**Проблема:** Backdrop с `position: absolute` и без z-index может перекрывать кнопки модалки.

**Решение:** Контент модалки должен иметь `z-10` или выше относительно backdrop:

```jsx
<div className="fixed inset-0 z-[9999] ...">
  {/* Backdrop — z-index по умолчанию (auto) */}
  <div className="absolute inset-0 bg-black/50" onClick={onClose} />
  
  {/* Контент — z-10, выше backdrop */}
  <div className="relative z-10 bg-white ...">
    <button>Кнопка будет кликабельна</button>
  </div>
</div>
```

### Шкала z-index в проекте

| Слой | z-index | Использование |
|------|---------|---------------|
| Dropdowns | `z-20` | Выпадающие списки, color pickers |
| AI Insights кнопка | `z-50` | Плавающая кнопка AI |
| Основные модалки | `z-50` | TaskDetailModal, BoardPage overlays |
| AI Insights панель | `z-[100]` | Плавающая панель чата AI |
| Модалки из AI (TaskModalContext) | `z-[200]` | Модалки задач, открытые из AI чата |
| Вложенные модалки | `z-[9999]` | Confirm dialogs, критичные оповещения |

### Правила:

1. **Вложенные модалки** — всегда добавлять `pointer-events-auto` на контейнер
2. **Контент модалки** — всегда `z-10` относительно backdrop
3. **НЕ использовать** `window.confirm()` — заменять на кастомные модалки
4. **При отладке** — проверять родительские элементы на `pointer-events-none`

---

## КРИТИЧЕСКИ ВАЖНО: Supabase Edge Functions — Деплой с --no-verify-jwt

### Проблема (Февраль 2026)
После переделплоя Edge Function `chat-dashboard` все запросы стали возвращать `{"code":401,"message":"Invalid JWT"}`, хотя код функции не менялся.

**Симптомы:**
- AI чат перестаёт работать после деплоя
- Supabase клиент получает `FunctionsHttpError` с кодом 401
- Сообщение: `Edge Function returned a non-2xx status code`
- Тело ошибки: `{"code":401,"message":"Invalid JWT"}`
- Код функции не начинает выполняться — ошибка на уровне relay

**Причина:**
По умолчанию Supabase Edge Functions проверяют JWT на уровне relay (до вызова кода функции). Функция `chat-dashboard` использует `SUPABASE_SERVICE_ROLE_KEY` для работы с базой (чтобы обойти RLS и искать по всем workspace пользователя). JWT-верификация на уровне relay не нужна.

Если функция была ранее задеплоена с `--no-verify-jwt`, а при переделплое флаг забыли — relay начнёт отвергать запросы.

### Решение: ВСЕГДА деплоить с --no-verify-jwt

```bash
npx supabase functions deploy chat-dashboard \
  --project-ref hyhxbszioeyqytfiemtn \
  --no-verify-jwt
```

### Список Edge Functions и их флаги деплоя

| Функция | --no-verify-jwt | Причина |
|---------|-----------------|---------|
| `chat-dashboard` | ДА | Использует service_role для cross-workspace поиска |
| `send-company-invite` | НЕТ | Требуется JWT пользователя + RLS-проверка прав на отправку инвайта |

### Правило:
- **ВСЕГДА** при деплое Edge Functions проверять, нужен ли `--no-verify-jwt`
- **ВСЕГДА** указывать `--project-ref hyhxbszioeyqytfiemtn`
- При добавлении новых Edge Functions — документировать флаги деплоя в этой таблице

### Также важно: GRANT SELECT для service_role

Edge Function `chat-dashboard` использует `service_role` для запросов к базе. Для новых таблиц, к которым нужен доступ из AI-поиска, необходимо добавлять:

```sql
GRANT SELECT ON public.<table_name> TO service_role;
```

Текущие гранты (миграция `054_ai_search_grants.sql`):
- workspaces, workspace_members, boards, tasks, profiles
- comments, task_files, task_activity_log, voice_transcripts
- workspace_statuses, polls, poll_votes

### Обязательный чеклист при новых таблицах/функциях

Перед merge любого изменения, которое добавляет новые таблицы или меняет доступы:

1. Проверить GRANT для `authenticated` и `service_role` там, где это требуется.
2. Проверить RLS-политики для пользовательских запросов (deny-by-default).
3. Если Edge Function деплоится с `--no-verify-jwt`, добавить/проверить внутреннюю авторизацию в коде функции (валидация пользователя и контекста доступа).
4. Обновить список функций и их deploy-флаги в этом документе.
5. Прогнать smoke-тест Edge Functions после миграции (особенно AI search/chat/summary).

---

## ReTracker: ImageViewer — 3D-режим и изображения с альфой

**Контекст (март 2026):** Полноэкранный просмотр вложений с комментариями (`ImageViewer.jsx`).

### Поведение 3D-режима
- Родитель задаёт **`perspective`**, внутренняя обёртка — **`transform-style: preserve-3d`**, трансформ **`rotateX` / `rotateY`** (+ лёгкий **`translateZ`** и **`scale`**) от позиции курсора, сглаживание через **rAF + lerp**; запись в **`element.style.transform`**, чтобы React не перезаписывал матрицу при ре-рендерах с `style={{ width, height }}`.
- Оверлеи (аннотации, пины, формы) лежат **внутри** той же обёртки — геометрия совпадает с картинкой.
- При **`isAddingComment`** и **`prefers-reduced-motion: reduce`** эффект не активен; кнопка режима скрыта при reduce motion.

### Прозрачные PNG
- Не класть **светлые полно-плоские градиенты** с **`mix-blend-*`** поверх всего кадра — на альфе это даёт «белый фон».
- Для тени у картинок с прозрачностью предпочтительно **`filter: drop-shadow(...)`** (Tailwind: `drop-shadow-[...]`), а не **`box-shadow`**, если нужен силуэт непрозрачных пикселей.
- Аналогично выровнять простой полноэкранный превью слой (**`FilePreviewOverlay`** в `CommentAttachments.jsx`), если там тот же UX.

---

## ReTracker: SketchEditor — рисование в чате

**Контекст (апрель 2026):** Полноэкранный редактор для рисования с нуля, отправка в чат как PNG.

### Архитектура
- Форк `ImageAnnotationEditor` — убраны фигуры, текст, overlay canvas; добавлен выбор фона холста.
- Путь данных: `SketchEditor.handleSave()` → `canvas.toBlob('image/png')` → `CommentInput.addBlobFile(blob, filename)` → `uploadSingleFile` (Supabase Storage `task-files`) → `comments.attachments[]`.
- Ноль миграций БД — используется существующая инфраструктура `task_files` + `task-files` bucket.

### Паттерн «blob → addBlobFile → chat»
Универсальный паттерн для клиентски-генерируемых медиа. Используется в:
- `ImageAnnotationEditor` (аннотированные фото)
- `SketchEditor` (рисунки)
- Потенциально: скриншоты, сгенерированные изображения и т.д.

### Выбор фона
- Фон **не рисуется** на основном canvas — это CSS-фон контейнера (можно менять на лету).
- При экспорте: создаётся `exportCanvas`, заливается `fillRect` выбранным цветом (если не transparent), поверх `drawImage(mainCanvas)`.
- Прозрачный фон: CSS шахматный паттерн (`linear-gradient` 45deg), экспорт PNG с alpha.

### Файлы
- `retracker/src/components/comments/SketchEditor.jsx`
- `retracker/src/components/comments/AttachmentMenu.jsx` (пункт «Скетч»)
- `retracker/src/components/comments/CommentInput.jsx` (state + рендер)

---

## КРИТИЧЕСКИ ВАЖНО: Smart Trigger для updated_at на comments

### Проблема (Апрель 2026)
Generic-триггер `update_updated_at_column()` устанавливал `updated_at = now()` при **любом** UPDATE на `comments`, включая изменение thread-метаданных (`is_thread_root`, `thread_replies_count`, `thread_last_reply_at`, `thread_participants`). UI показывал «(ред.)» при `updated_at !== created_at`.

### Решение
Миграция `075_thread_metadata_without_content_bump.sql` заменила generic-триггер на `update_comments_updated_at_smart()`:
- Обновляет `updated_at = now()` **только** при изменении `content`, `attachments`, `scheduled_at`
- При изменении любых других полей (thread-метаданные, пины и пр.) — сохраняет `OLD.updated_at`
- Проверка через `IS NOT DISTINCT FROM` (корректно обрабатывает NULL)

### Что НЕ работает в триггерах comments
**`ALTER TABLE comments DISABLE TRIGGER` внутри триггера на ту же таблицу — НЕВОЗМОЖНО.**
PostgreSQL выбрасывает `55006: cannot ALTER TABLE because it is being used by active queries`.
Даже с `SECURITY DEFINER`. Это ограничение PostgreSQL, а не Supabase.

### Правило
- Для таблиц, где нужно различать «контентный» и «метадатный» UPDATE — использовать smart trigger с `IS NOT DISTINCT FROM`
- **НЕ** использовать `ALTER TABLE DISABLE/ENABLE TRIGGER` внутри триггеров на ту же таблицу
- RPC `mark_comment_thread_root` — для установки `is_thread_root` с фронта (с `SECURITY DEFINER`)

---

## TODO: Будущие улучшения и права доступа

### Пересылка сообщений (Comment Forwarding) — Права доступа

**Текущая реализация (Февраль 2026):**
- Пользователь может переслать сообщение в любую карточку, к которой у него есть доступ
- В заголовке пересланного сообщения показывается ссылка на оригинальную карточку

**TODO при реализации системы прав доступа:**
- Если пользователь **не имеет доступа** к оригинальной карточке (откуда было переслано сообщение):
  - Ссылка на карточку должна быть **неактивной** (не кликабельной)
  - Название карточки может отображаться, но переход запрещён
  - Альтернатива: показывать только "Переслано от @user" без ссылки на карточку

**Компоненты для изменения:**
- `ForwardedMessageHeader.jsx` — проверять права доступа перед отображением кликабельной ссылки
- `useSourceTaskInfo()` hook — добавить проверку `canAccess` для оригинальной карточки

**RLS политики:**
- Таблица `comment_forwards` уже имеет базовые RLS политики
- При реализации прав нужно будет учитывать workspace membership и board access
