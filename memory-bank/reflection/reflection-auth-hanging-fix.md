# Reflection: Auth Hanging Fix

**Task ID:** auth-hanging-fix  
**Date:** 4 Февраля 2026  
**Complexity:** Level 2 (Bug Fix with Investigation)  
**Status:** COMPLETED ✅

---

## Summary

Исправлена критическая проблема, при которой приложение зависало при перезагрузке страницы. Пользователь видел бесконечный Loading, данные не загружались. Проблема была в том, что Supabase Auth event `SIGNED_IN` срабатывает до того, как токен авторизации полностью готов, и запросы к базе данных во время обработки этого события зависали бесконечно.

---

## What Went Well

### 1. Систематический подход к отладке
- Использовали Debug Mode с инструментацией кода
- Генерировали гипотезы и проверяли их runtime логами
- Не делали "слепых" фиксов — каждое изменение подтверждалось логами

### 2. Точная диагностика
- Логи чётко показали: `fetchProfile:beforeQuery` есть, `fetchProfile:afterQuery` нет
- Это доказало, что запрос к базе зависает, а не проблема в UI
- Логи также показали, что `INITIAL_SESSION` работает нормально, а `SIGNED_IN` — нет

### 3. Итеративное решение
- Первая гипотеза (RLS рекурсия) — не подтвердилась
- Добавили таймаут — помогло частично
- Пропустили `SIGNED_IN` event — полное решение

### 4. Документация паттерна
- Обновили `systemPatterns.md` с подробным описанием проблемы
- Добавили примеры кода для будущих разработчиков
- Задокументировали порядок событий Supabase Auth

---

## Challenges Encountered

### 1. Неочевидная причина
- Изначально думали, что проблема в RLS политиках (рекурсия функций `is_staff()`)
- SQL фикс не помог
- Пришлось копать глубже в порядок событий Supabase Auth

### 2. Гонка событий
- `SIGNED_IN` срабатывает ДО `INITIAL_SESSION` при перезагрузке
- Но при реальном входе через форму `SIGNED_IN` работает нормально
- Это создало путаницу — "почему иногда работает, иногда нет"

### 3. Сложность воспроизведения
- Проблема проявлялась только при перезагрузке
- При первом входе всё работало
- HMR (Hot Module Replacement) мог маскировать проблему

### 4. Отсутствие документации
- Supabase не документирует, что `SIGNED_IN` при перезагрузке срабатывает до готовности токена
- Пришлось выяснять эмпирически через логи

---

## Lessons Learned

### 1. Порядок событий Supabase Auth важен
```
При перезагрузке:
1. SIGNED_IN — токен НЕ готов
2. INITIAL_SESSION — токен готов

При входе через форму:
1. signInWithPassword() — токен устанавливается
2. SIGNED_IN — токен уже готов
```

### 2. Не все события Auth равны
- `SIGNED_IN` при перезагрузке ≠ `SIGNED_IN` при входе
- Нужно различать контекст события

### 3. Таймауты — хорошая защита
- Даже если основной фикс работает, таймаут защищает от edge cases
- 3 секунды — достаточно для нормального запроса, но не слишком долго для UX

### 4. Кэширование профиля критично
- Профиль в localStorage позволяет показать UI мгновенно
- Фоновое обновление из базы — для актуальности
- Это улучшает perceived performance

### 5. Debug Mode — мощный инструмент
- Инструментация с HTTP логами работает отлично
- Гипотезы + доказательства = уверенность в фиксе
- Без логов бы гадали и делали "cargo cult" фиксы

---

## Technical Improvements

### Код до фикса:
```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session?.user) {
    await fetchProfile(session.user.id); // ЗАВИСАЕТ при перезагрузке
  }
  // ...
});
```

### Код после фикса:
```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  // SIGNED_IN event causes hanging queries - skip profile fetch
  if (event === 'SIGNED_IN') {
    if (session?.user) {
      setUser(session.user);
    }
    return; // Пропускаем, ждём INITIAL_SESSION
  }
  
  // Handle INITIAL_SESSION and SIGNED_OUT normally
  if (currentUser) {
    await fetchProfile(currentUser.id); // Работает!
  }
});
```

### Добавлен таймаут:
```javascript
const queryPromise = supabase.from('profiles').select('*').eq('id', userId).single();
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('timeout')), 3000)
);
const result = await Promise.race([queryPromise, timeoutPromise]);
```

---

## Process Improvements

### 1. Добавить в systemPatterns.md сразу
- Критические баги должны документироваться немедленно
- Это было сделано — хорошая практика

### 2. Debug Mode как стандарт
- Для сложных багов сразу использовать инструментацию
- Не тратить время на "угадывание"

### 3. Проверять edge cases Auth
- При работе с Supabase Auth всегда тестировать:
  - Первый вход
  - Перезагрузка страницы
  - Смена вкладки и возврат
  - Logout и повторный вход

---

## Files Modified

- `calculator/src/contexts/AuthContext.jsx` — основной фикс
- `calculator/src/hooks/useClientActivity.js` — убраны debug логи
- `memory-bank/systemPatterns.md` — документация паттерна
- `memory-bank/activeContext.md` — обновлён контекст
- `memory-bank/tasks.md` — добавлена задача

---

## Next Steps

1. ✅ Убрать инструментацию (сделано)
2. ✅ Обновить документацию (сделано)
3. Мониторить в production на похожие проблемы
4. Рассмотреть добавление E2E тестов для auth flow
5. При обновлении Supabase SDK — проверить, не изменился ли порядок событий

---

## Time Spent

- Диагностика: ~30 минут
- Попытки фикса RLS: ~15 минут
- Правильный фикс: ~15 минут
- Документация: ~10 минут
- **Итого:** ~70 минут

---

## Conclusion

Критический баг исправлен. Ключевой урок: Supabase Auth events имеют разное поведение в зависимости от контекста (перезагрузка vs вход). Всегда использовать Debug Mode для сложных багов — это экономит время и даёт уверенность в решении.
