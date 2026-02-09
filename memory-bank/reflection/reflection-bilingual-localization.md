# Рефлексия: Билингвальная локализация (EN/RU)

**Дата:** 2026-02-10
**Сложность:** Level 3
**Статус:** В процессе (итеративная работа)

---

## 1. Обзор задачи

Реализация полноценной двуязычной поддержки (английский/русский) для всего приложения ReSkin Lab:
- Локализация UI интерфейса (react-i18next)
- Билингвальные данные в БД (title_en/title_ru, description_en/description_ru)
- Автоматическое определение и переключение языка
- Сохранение языковых предпочтений пользователя

---

## 2. Архитектура локализации

### 2.1 Структура файлов

```
calculator/src/locales/
├── en/                          # Английские переводы
│   ├── admin.json              # Админ-панель (auditLog, dashboard, users, pricing...)
│   ├── audit.json              # Аудит-логи (отдельный namespace)
│   ├── auth.json               # Авторизация (login, register, logout...)
│   ├── calculator.json         # Калькулятор (categories, presets, public...)
│   ├── comments.json           # Комментарии
│   ├── common.json             # Общие строки (actions, status, labels, profile...)
│   ├── errors.json             # Ошибки
│   ├── files.json              # Файлы и загрузка
│   ├── invoices.json           # Инвойсы
│   ├── navigation.json         # Навигация (sidebar, breadcrumbs...)
│   ├── notifications.json      # Уведомления
│   ├── offers.json             # Оферты
│   ├── projects.json           # Проекты
│   ├── specs.json              # Спецификации
│   └── tasks.json              # Задачи
└── ru/                         # Русские переводы (зеркальная структура)
    └── ... (те же файлы)
```

### 2.2 Namespace-система

| Namespace | Область применения |
|-----------|-------------------|
| `common` | Общие действия, статусы, лейблы, профиль, accountSwitcher, stageChange |
| `admin` | Вся админ-панель: auditLog, dashboard, users, pricing, wallets |
| `calculator` | Калькулятор: категории, пресеты, public |
| `navigation` | Сайдбар, хедер, бредкрамбы |
| `projects` | Страницы проектов, стадии |
| `tasks` | Канбан, карточки задач, чеклисты |
| `offers` | Оферты, шаблоны |
| `invoices` | Инвойсы, платежи |
| `specs` | Спецификации |
| `notifications` | Центр уведомлений |

---

## 3. Паттерны локализации

### 3.1 Базовый паттерн в React-компонентах

```jsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation('namespace'); // 'common', 'admin', etc.
  
  return (
    <div>
      <h1>{t('section.title')}</h1>
      <p>{t('section.description')}</p>
      <button>{t('actions.save')}</button>
    </div>
  );
}
```

### 3.2 Интерполяция переменных

```jsx
// JSON: "greeting": "Hello, {{name}}!"
t('greeting', { name: userName })

// JSON: "items": "{{count}} item"
// JSON: "items_plural": "{{count}} items"
t('items', { count: 5 }) // → "5 items"
```

### 3.3 Вложенные ключи

```json
{
  "auditLog": {
    "title": "Audit Log",
    "filters": {
      "action": "Action",
      "user": "User",
      "dateRange": "Date Range"
    },
    "table": {
      "time": "Time",
      "action": "Action"
    }
  }
}
```

```jsx
t('auditLog.title')           // "Audit Log"
t('auditLog.filters.action')  // "Action"
t('auditLog.table.time')      // "Time"
```

### 3.4 Динамические ключи (роли, статусы)

```json
{
  "roles": {
    "admin": "Administrator",
    "am": "Account Manager",
    "client": "Client"
  }
}
```

```jsx
const role = 'admin';
t(`roles.${role}`) // → "Administrator"

// Или с fallback:
t(`accountSwitcher.roles.${profile?.role}`) || t('accountSwitcher.roles.client')
```

### 3.5 Локализация дат

```jsx
import i18n from '../lib/i18n';

// Определение локали
const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';

// Форматирование дат
new Date().toLocaleDateString(locale, { month: 'short' })
// EN: "Feb" | RU: "февр."

new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
// EN: "2:30 PM" | RU: "14:30"

// В хуках (без useTranslation)
function getDateLocale() {
  return i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
}
```

### 3.6 Локализация в хуках (без компонентов)

```jsx
// hooks/useDashboard.js
import i18n from '../lib/i18n';

function getDateLocale() {
  return i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
}

export function useRevenueChart() {
  const locale = getDateLocale();
  
  return useQuery({
    queryKey: ['revenue-chart', locale], // ВАЖНО: добавить locale в queryKey
    queryFn: async () => {
      // ...
      const monthName = date.toLocaleDateString(locale, { month: 'short' });
    },
  });
}
```

### 3.7 Хук useLanguage для билингвальных данных из БД

```jsx
import { useLanguage } from '../hooks/useLanguage';

export function MyComponent({ item }) {
  const { getLocalized } = useLanguage();
  
  // item = { name_en: "Test", name_ru: "Тест", description_en: "...", description_ru: "..." }
  const name = getLocalized(item, 'name');           // → "Тест" (если RU)
  const desc = getLocalized(item, 'description');    // → "..." (по текущему языку)
  
  return <div>{name}: {desc}</div>;
}
```

---

## 4. Компоненты локализации

### 4.1 LanguageSwitcher

```jsx
// components/LanguageSwitcher.jsx
import { useLanguageContext } from '../contexts/LanguageContext';

export function LanguageSwitcher({ className = '' }) {
  const { language, setLanguage, isRussian } = useLanguageContext();
  
  const handleToggle = () => {
    setLanguage(isRussian ? 'en' : 'ru');
  };
  
  return (
    <button onClick={handleToggle} className={className}>
      <GlobeIcon />
      {isRussian ? 'RU' : 'EN'}
    </button>
  );
}
```

**Использование:**
```jsx
// В хедере/тулбаре
<LanguageSwitcher />

// С кастомными стилями (например, на тёмном фоне)
<LanguageSwitcher className="text-white hover:bg-white/20" />
```

### 4.2 LanguageContext

```jsx
// contexts/LanguageContext.jsx
export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState(i18n.language || 'en');
  
  const setLanguage = useCallback((lang) => {
    i18n.changeLanguage(lang);
    setLanguageState(lang);
    // Сохранить в профиль пользователя (если авторизован)
    // Сохранить в localStorage (для гостей)
  }, [i18n]);
  
  const isRussian = language?.startsWith('ru');
  
  // Функция для получения локализованного поля из БД
  const getLocalized = useCallback((obj, field) => {
    if (!obj) return '';
    const suffix = isRussian ? '_ru' : '_en';
    return obj[`${field}${suffix}`] || obj[`${field}_en`] || obj[field] || '';
  }, [isRussian]);
  
  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRussian, getLocalized }}>
      {children}
    </LanguageContext.Provider>
  );
}
```

---

## 5. Локализованные компоненты (примеры из проекта)

### 5.1 AccountSwitcher (common namespace)

**Ключи локализации:**
```json
{
  "accountSwitcher": {
    "roles": {
      "admin": "Admin / Админ",
      "am": "AM / Менеджер",
      "client": "Client / Клиент"
    },
    "switchAccount": "Switch Account / Сменить аккаунт",
    "addAccount": "Add Account / Добавить аккаунт",
    "signOut": "Sign Out / Выйти",
    "modal": {
      "title": "Add Account / Добавить аккаунт",
      "existingAccount": "Existing Account / Существующий аккаунт",
      "createNew": "Create New / Создать новый",
      // ... labels, buttons, hints
    },
    "errors": {
      "emailPasswordRequired": "Email and password are required / Email и пароль обязательны",
      // ... validation errors
    }
  }
}
```

**Паттерн для ролей:**
```jsx
const getRoleBadge = (role) => {
  const style = ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.client;
  const label = t(`accountSwitcher.roles.${role}`) || t('accountSwitcher.roles.client');
  return { ...style, label };
};
```

### 5.2 StageChangeModal (common namespace)

**Ключи локализации:**
```json
{
  "stageChange": {
    "deactivateTitle": "Deactivate Stage? / Деактивировать этап?",
    "activateTitle": "Activate Stage? / Активировать этап?",
    "stageLabel": "Stage: / Этап:",
    "deactivateMultiple": "The following stages will be deactivated: {{stages}}...",
    "deactivateSingle": "Are you sure you want to deactivate stage \"{{name}}\"?",
    "activateMultiple": "The following stages will be activated: {{stages}}",
    "activateSingle": "Are you sure you want to activate stage \"{{name}}\"?",
    "cancel": "Cancel / Отмена",
    "processing": "Processing... / Обработка...",
    "deactivate": "Deactivate / Деактивировать",
    "activate": "Activate / Активировать"
  }
}
```

**Использование интерполяции:**
```jsx
{stagesToDeactivate.length > 1
  ? t('stageChange.deactivateMultiple', { stages: stagesToDeactivate.map(s => s.name).join(', ') })
  : t('stageChange.deactivateSingle', { name: stage.name })}
```

### 5.3 AuditLogsPage (admin namespace)

**Структура ключей:**
```json
{
  "auditLog": {
    "title": "Audit Log",
    "subtitle": "Track all important actions in the system",
    "header": { "humanMode": "Human", "rawMode": "Technical", "live": "Live", "print": "Print" },
    "stats": { "last24h": "Last 24 hours", "last7d": "Last 7 days", ... },
    "quickFilters": { "title": "Quick Filters", "resetAll": "Reset all", ... },
    "filters": { "action": "Action", "user": "User", "dateRange": "Date Range", ... },
    "presets": { "today": "Today", "yesterday": "Yesterday", ... },
    "roles": { "all": "All roles", "admin": "Admins", "am": "Managers", "client": "Clients" },
    "options": { "allUsers": "All users", "allActions": "All actions", ... },
    "table": { "time": "Time", "action": "Action", "role": "Role", ... },
    "charts": { "showCharts": "Show Charts", "analyticsTitle": "Analytics", ... },
    "empty": { "title": "No audit logs found", "subtitle": "Try adjusting your filters" },
    "pagination": { "showing": "Showing", "to": "–", "of": "of", "logs": "logs" },
    "timeline": { "today": "Today", "yesterday": "Yesterday", "events": "events", ... },
    "details": { "changes": "Changes", "metadata": "Metadata", "ip": "IP:", ... },
    "unknown": "Unknown"
  }
}
```

---

## 6. Билингвальные данные в БД

### 6.1 Структура таблиц

```sql
-- Пример: tasks
ALTER TABLE tasks
ADD COLUMN title_en TEXT,
ADD COLUMN title_ru TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN description_ru TEXT;

-- Пример: task_auto_templates
ALTER TABLE task_auto_templates
ADD COLUMN title_en TEXT,
ADD COLUMN title_ru TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN description_ru TEXT;
```

### 6.2 Миграции для билингвальных данных

```sql
-- Миграция 054: User language preference
ALTER TABLE profiles ADD COLUMN preferred_language TEXT DEFAULT 'en';

-- Миграция 057: Bilingual task descriptions
ALTER TABLE tasks
ADD COLUMN title_en TEXT,
ADD COLUMN title_ru TEXT,
ADD COLUMN description_en TEXT,
ADD COLUMN description_ru TEXT;

-- Миграция 058: Update existing data
UPDATE tasks SET 
  title_en = title,
  title_ru = title,
  description_en = description,
  description_ru = description
WHERE title_en IS NULL;
```

### 6.3 Триггеры для автозаполнения

```sql
CREATE OR REPLACE FUNCTION set_bilingual_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Если указан только один язык, копировать в другой
  IF NEW.title_en IS NOT NULL AND NEW.title_ru IS NULL THEN
    NEW.title_ru := NEW.title_en;
  ELSIF NEW.title_ru IS NOT NULL AND NEW.title_en IS NULL THEN
    NEW.title_en := NEW.title_ru;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Чеклист для локализации нового компонента

### Шаг 1: Определить namespace
- [ ] Компонент админки → `admin`
- [ ] Общие элементы → `common`
- [ ] Калькулятор → `calculator`
- [ ] Проекты → `projects`
- [ ] Задачи → `tasks`

### Шаг 2: Добавить ключи в JSON файлы
- [ ] Добавить ключи в `en/[namespace].json`
- [ ] Добавить ключи в `ru/[namespace].json`
- [ ] Использовать вложенную структуру: `section.subsection.key`
- [ ] Использовать интерполяцию для динамических значений: `{{variable}}`

### Шаг 3: Обновить компонент
- [ ] Импортировать: `import { useTranslation } from 'react-i18next';`
- [ ] Инициализировать: `const { t } = useTranslation('namespace');`
- [ ] Заменить хардкоженные строки на `t('key')`
- [ ] Для дат использовать `toLocaleDateString(locale, options)`

### Шаг 4: Проверка
- [ ] Переключить язык и проверить все строки
- [ ] Проверить интерполяцию ({{переменные}})
- [ ] Проверить pluralization (если есть)
- [ ] Запустить линтер: `ReadLints`

---

## 8. Частые ошибки и решения

### 8.1 Ошибка: `t is not defined`

**Причина:** Забыли добавить `useTranslation`

**Решение:**
```jsx
import { useTranslation } from 'react-i18next';
// ...
const { t } = useTranslation('namespace');
```

### 8.2 Ошибка: Неправильный путь к i18n

**Причина:** Разные пути в разных частях проекта

**Решение:**
```jsx
// В компонентах — useTranslation
import { useTranslation } from 'react-i18next';

// В хуках/утилитах — прямой импорт
import i18n from '../lib/i18n';  // НЕ '../i18n' !
```

### 8.3 Ошибка: Данные не обновляются при смене языка

**Причина:** queryKey не включает язык

**Решение:**
```jsx
const locale = getDateLocale();
return useQuery({
  queryKey: ['data-key', locale],  // Добавить locale!
  queryFn: ...
});
```

### 8.4 Ошибка: Роли отображаются на английском

**Причина:** Использование констант вместо t()

**Было:**
```jsx
const ROLE_BADGES = {
  admin: { label: 'Admin', ... },
};
```

**Стало:**
```jsx
const getRoleBadge = (role) => ({
  ...ROLE_BADGE_STYLES[role],
  label: t(`roles.${role}`)
});
```

### 8.5 Ошибка: Месяцы на английском

**Причина:** Хардкоженная локаль `'en'`

**Было:**
```jsx
date.toLocaleDateString('en', { month: 'short' })
```

**Стало:**
```jsx
const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
date.toLocaleDateString(locale, { month: 'short' })
```

---

## 9. Компоненты, требующие локализации (TODO)

### Высокий приоритет
- [ ] Все модальные окна подтверждения
- [ ] Все формы и валидация
- [ ] Пагинация и сортировка
- [ ] Пустые состояния (empty states)
- [ ] Тосты и нотификации

### Средний приоритет
- [ ] Тултипы и хинты
- [ ] Плейсхолдеры в инпутах
- [ ] Заголовки табов
- [ ] Бейджи и теги

### Низкий приоритет
- [ ] Console.log сообщения (можно оставить на EN)
- [ ] Комментарии в коде
- [ ] Dev-only элементы

---

## 10. Выводы и рекомендации

### Что работает хорошо
1. **Структура namespace** — чёткое разделение по областям
2. **useTranslation hook** — удобный API
3. **Интерполяция** — гибкость для динамических строк
4. **LanguageContext** — централизованное управление языком

### Что требует внимания
1. **Консистентность** — следить за одинаковой структурой ключей в EN/RU
2. **Fallbacks** — всегда иметь fallback на EN
3. **QueryKeys** — не забывать добавлять locale для реактивности
4. **Импорты** — правильный путь к i18n (`../lib/i18n`)

### Рекомендации для будущей работы
1. При создании нового компонента — сразу добавлять локализацию
2. Использовать copy-paste из существующих компонентов как шаблон
3. Проверять оба языка после любых изменений
4. Документировать новые ключи в этом файле

---

## 11. Связанные документы

- **Миграции БД:** `supabase/migrations/054-058_*.sql`
- **i18n конфиг:** `src/lib/i18n.js`
- **Language Context:** `src/contexts/LanguageContext.jsx`
- **Language Hook:** `src/hooks/useLanguage.js`
- **LanguageSwitcher:** `src/components/LanguageSwitcher.jsx`
