# TASK ARCHIVE: Account Switcher Fix

## METADATA
- **Task ID:** account-switcher-fix
- **Дата:** 4 февраля 2026
- **Уровень сложности:** Level 1 (Bug Fix)
- **Статус:** COMPLETE

---

## SUMMARY

Исправлена критическая проблема с переключением аккаунтов через AccountSwitcher. При переключении на другой сохранённый аккаунт UI продолжал показывать данные старого пользователя (имя, роль, аватар).

---

## REQUIREMENTS

- Переключение аккаунтов должно корректно обновлять профиль пользователя
- UI должен отображать данные нового пользователя после переключения
- Исправление не должно нарушить существующую защиту от зависающих запросов при `SIGNED_IN` событии

---

## IMPLEMENTATION

### Корневая причина
В `AuthContext.jsx` событие `SIGNED_IN` пропускалось для предотвращения зависающих запросов к базе данных. Однако это приводило к тому, что `fetchProfile()` не вызывался при переключении аккаунтов.

### Решение
Добавлен явный вызов `setUser()` и `fetchProfile()` в функции `signIn()` после успешной авторизации:

```javascript
// calculator/src/contexts/AuthContext.jsx
const signIn = async ({ email, password }) => {
  // ...
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Явно обновляем user и загружаем профиль
  if (data?.user) {
    setUser(data.user);
    await fetchProfile(data.user.id, true); // force=true для обхода кеша
  }
  // ...
};
```

### Дополнительное исправление
Исправлен React warning про вложенные `<button>` элементы в `AccountSwitcher.jsx` — внешняя кнопка заменена на `<div role="button">`.

---

## TESTING

Верификация через debug-инструментацию:

**До исправления:**
```
signIn result: success=true, newUserEmail=test.client@example.com
SIGNED_IN skipped - profile NOT fetched!
afterSignIn: profileAfter=k8d.boss@gmail.com  ← старый профиль
```

**После исправления:**
```
signIn result: success=true, newUserEmail=test.client@example.com
Fetching profile after signIn: userId=test.client
Profile fetched successfully: profileEmail=test.client@example.com ← новый профиль
```

---

## ИЗМЕНЁННЫЕ ФАЙЛЫ

| Файл | Изменение |
|------|-----------|
| `calculator/src/contexts/AuthContext.jsx` | Добавлен явный вызов `fetchProfile()` в `signIn()` |
| `calculator/src/components/admin/AccountSwitcher.jsx` | Исправлен warning про вложенные кнопки |
| `memory-bank/systemPatterns.md` | Добавлена документация паттерна |

---

## LESSONS LEARNED

1. Пропуск обработки событий имеет побочные эффекты — нужно проверять все зависимые функции
2. Явные вызовы надёжнее event-driven подхода для критических операций
3. Debug-инструментация с логами эффективна для подтверждения гипотез

---

## REFERENCES

- Рефлексия: `memory-bank/reflection/reflection-account-switcher-fix.md`
- Паттерны: `memory-bank/systemPatterns.md` (раздел "Account Switcher и пропуск SIGNED_IN")
