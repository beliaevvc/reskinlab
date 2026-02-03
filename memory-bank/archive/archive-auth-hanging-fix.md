# TASK ARCHIVE: Auth Hanging Fix

## METADATA

| Field | Value |
|-------|-------|
| Task ID | auth-hanging-fix |
| Date Started | 4 Февраля 2026 |
| Date Completed | 4 Февраля 2026 |
| Complexity Level | Level 2 (Bug Fix with Investigation) |
| Status | COMPLETED ✅ |
| Time Spent | ~70 минут |

---

## SUMMARY

Критический баг: приложение зависало при перезагрузке страницы. Пользователь видел бесконечный Loading, внутренние данные не загружались.

**Root Cause:** Supabase Auth event `SIGNED_IN` срабатывает ДО того, как токен авторизации полностью готов. Запросы к базе данных во время обработки этого события зависали бесконечно.

**Solution:** Пропускаем `SIGNED_IN` event и обрабатываем только `INITIAL_SESSION`, добавляем таймаут 3 секунды на запрос профиля как защиту.

---

## REQUIREMENTS

### Problem Statement
- При перезагрузке страницы приложение показывало бесконечный Loading
- Данные дашборда не загружались
- Консоль показывала: `fetchProfile:beforeQuery` без последующего `fetchProfile:afterQuery`
- При входе через форму логина всё работало нормально

### Success Criteria
- [x] Страница загружается при перезагрузке без зависания
- [x] Профиль пользователя загружается корректно
- [x] Внутренние данные (дашборд, активность) отображаются
- [x] Задокументирован паттерн для будущих разработчиков

---

## IMPLEMENTATION

### Technical Solution

#### 1. Пропуск SIGNED_IN event
```javascript
// AuthContext.jsx
supabase.auth.onAuthStateChange(async (event, session) => {
  // SIGNED_IN event causes hanging queries - skip profile fetch
  if (event === 'SIGNED_IN') {
    if (session?.user) {
      setUser(session.user);
    }
    return; // Пропускаем, ждём INITIAL_SESSION
  }
  
  // Handle INITIAL_SESSION and SIGNED_OUT normally
  // ...
});
```

#### 2. Таймаут на запрос профиля
```javascript
// fetchProfile function
const queryPromise = supabase.from('profiles').select('*').eq('id', userId).single();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Profile query timeout')), 3000)
);
const result = await Promise.race([queryPromise, timeoutPromise]);
```

#### 3. Кэширование профиля
- Профиль сохраняется в localStorage
- При загрузке сначала показывается кэш
- Затем обновляется из базы в фоне

### Event Flow Understanding

**При перезагрузке страницы:**
```
1. SIGNED_IN — токен НЕ готов (запросы зависают)
2. INITIAL_SESSION — токен готов (запросы работают)
```

**При входе через форму:**
```
1. signInWithPassword() — токен устанавливается
2. SIGNED_IN — токен уже готов (запросы работают)
```

### Files Modified

| File | Changes |
|------|---------|
| `calculator/src/contexts/AuthContext.jsx` | Основной фикс: пропуск SIGNED_IN, таймаут на профиль |

---

## TESTING

### Debug Mode Approach
- Использовали инструментацию с HTTP логами
- Генерировали гипотезы и проверяли их runtime данными
- Итеративно отвергали неверные гипотезы

### Hypotheses Tested

| # | Hypothesis | Result | Evidence |
|---|------------|--------|----------|
| 1 | RLS рекурсия в функциях `is_staff()` | ❌ REJECTED | SQL фикс не помог |
| 2 | Race condition между getSession и onAuthStateChange | ❌ REJECTED | Увеличение таймаута не помогло |
| 3 | SIGNED_IN срабатывает до готовности токена | ✅ CONFIRMED | Логи показали: beforeQuery есть, afterQuery нет |

### Verification Steps
1. Перезагрузка страницы — страница загружается
2. Проверка дашборда — данные отображаются
3. Смена вкладки и возврат — не зависает
4. Выход и повторный вход — работает

---

## LESSONS LEARNED

### Technical Insights

1. **Порядок событий Supabase Auth важен**
   - `SIGNED_IN` при перезагрузке ≠ `SIGNED_IN` при входе
   - Нужно различать контекст события

2. **Таймауты — хорошая защита**
   - Даже если основной фикс работает, таймаут защищает от edge cases
   - 3 секунды — разумный баланс

3. **Кэширование критично для UX**
   - Профиль в localStorage позволяет показать UI мгновенно
   - Фоновое обновление — для актуальности

### Process Insights

1. **Debug Mode эффективен**
   - Инструментация с логами работает отлично
   - Гипотезы + доказательства = уверенность в фиксе

2. **Не угадывать — доказывать**
   - Без логов бы делали "cargo cult" фиксы
   - Runtime данные показали реальную причину

### What Went Well
- Систематический подход к отладке
- Точная диагностика через логи
- Итеративное решение с верификацией
- Немедленная документация паттерна

### What Could Be Improved
- Supabase не документирует это поведение — пришлось выяснять эмпирически
- E2E тесты для auth flow помогли бы отловить раньше

---

## REFERENCES

### Documentation
- **Pattern:** `memory-bank/systemPatterns.md` — Supabase Auth SIGNED_IN Event Hanging Pattern
- **Reflection:** `memory-bank/reflection/reflection-auth-hanging-fix.md`

### Related Issues
- Supabase Realtime WebSocket issue (отключен в `supabase.js`)

### Code Locations
- Auth handling: `calculator/src/contexts/AuthContext.jsx`
- Supabase client: `calculator/src/lib/supabase.js`

---

## FUTURE RECOMMENDATIONS

1. **Мониторинг в production** — следить за похожими проблемами
2. **E2E тесты для auth flow** — тестировать перезагрузку, смену вкладки, logout/login
3. **При обновлении Supabase SDK** — проверить, не изменился ли порядок событий
4. **Документировать в README** — предупреждение для новых разработчиков
