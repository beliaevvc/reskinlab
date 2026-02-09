# TASK ARCHIVE: Bilingual Localization (EN/RU)

## METADATA

| Field | Value |
|-------|-------|
| **Task ID** | bilingual-localization |
| **Date Started** | 2026-02-09 |
| **Date Completed** | 2026-02-10 |
| **Complexity Level** | Level 3 |
| **Status** | ✅ ARCHIVED |

---

## SUMMARY

Комплексная реализация двуязычной поддержки (английский/русский) для приложения ReSkin Lab:
- Локализация UI компонентов через react-i18next
- Билингвальные данные в базе данных (title_en/title_ru, description_en/description_ru)
- Переключатель языка для всех частей приложения
- Автоматическое определение и сохранение языковых предпочтений пользователя
- Создание подробной документации для будущей локализации

---

## REQUIREMENTS

### Функциональные требования
1. ✅ Локализация всех UI элементов на русский и английский
2. ✅ Переключатель языка в хедере и публичном калькуляторе
3. ✅ Билингвальные данные в БД для задач, шаблонов, оферт
4. ✅ Автоматическое определение языка браузера
5. ✅ Сохранение языковых предпочтений в профиле пользователя

### Компоненты для локализации (сессия 2026-02-10)
1. ✅ AccountSwitcher — роли, кнопки, модалка
2. ✅ StageChangeModal — модалка активации/деактивации этапов
3. ✅ PublicCalculatorPage — добавлен LanguageSwitcher
4. ✅ useDashboard — локализация названий месяцев в графиках
5. ✅ AuditLogsPage — все компоненты (ранее в другой сессии)
6. ✅ ProfilePage — все поля и кнопки (ранее в другой сессии)

---

## IMPLEMENTATION

### Архитектура локализации

```
calculator/src/
├── lib/i18n.js                    # Конфигурация i18next
├── contexts/LanguageContext.jsx   # Контекст языка
├── hooks/useLanguage.js           # Хук для билингвальных данных
├── components/LanguageSwitcher.jsx # Переключатель языка
└── locales/
    ├── en/                        # 15 JSON файлов
    └── ru/                        # 15 JSON файлов (зеркальная структура)
```

### Namespace-система

| Namespace | Область |
|-----------|---------|
| `common` | Общие действия, статусы, профиль, accountSwitcher, stageChange |
| `admin` | Админ-панель: auditLog, dashboard, users, pricing, wallets |
| `calculator` | Калькулятор: категории, пресеты, public |
| `navigation` | Сайдбар, хедер |
| `projects` | Проекты, стадии |
| `tasks` | Канбан, карточки |
| `offers` | Оферты |
| `invoices` | Инвойсы |
| `notifications` | Уведомления |

### Ключевые изменения (сессия 2026-02-10)

#### 1. AccountSwitcher локализация
**Файлы:**
- `src/components/admin/AccountSwitcher.jsx`
- `src/locales/en/common.json` — добавлена секция `accountSwitcher`
- `src/locales/ru/common.json` — добавлена секция `accountSwitcher`

**Локализованные элементы:**
- Роли: Admin/Админ, AM/Менеджер, Client/Клиент
- Кнопки: Switch Account, Add Account, Sign Out
- Модалка: заголовок, табы, поля формы, кнопки, валидация

#### 2. StageChangeModal локализация
**Файлы:**
- `src/components/project/StageChangeModal.jsx`
- `src/locales/en/common.json` — добавлена секция `stageChange`
- `src/locales/ru/common.json` — добавлена секция `stageChange`

**Локализованные элементы:**
- Заголовки: Деактивировать этап? / Activate Stage?
- Тексты подтверждения с интерполяцией {{stages}}, {{name}}
- Кнопки: Отмена, Деактивировать, Активировать

#### 3. PublicCalculatorPage — LanguageSwitcher
**Файлы:**
- `src/pages/calculator/PublicCalculatorPage.jsx`
- `src/components/index.js` — добавлен экспорт LanguageSwitcher
- `src/locales/en/calculator.json` — добавлен `public.calculatorTitle`
- `src/locales/ru/calculator.json` — добавлен `public.calculatorTitle`

**Изменения:**
- Добавлен LanguageSwitcher в верхний баннер
- Добавлен LanguageSwitcher в режим спецификации
- Локализован заголовок "Calculator" / "Калькулятор"

#### 4. useDashboard — локализация месяцев
**Файл:** `src/hooks/useDashboard.js`

**Изменения:**
```jsx
// Было:
date.toLocaleDateString('en', { month: 'short' })

// Стало:
import i18n from '../lib/i18n';
const locale = i18n.language?.startsWith('ru') ? 'ru-RU' : 'en-US';
date.toLocaleDateString(locale, { month: 'short' })
```

- Добавлен импорт i18n
- Добавлена функция `getDateLocale()`
- Обновлены `useRevenueChart` и `useProjectsChart`
- Добавлен locale в queryKey для реактивности

### Миграции БД (предыдущие сессии)

| Миграция | Описание |
|----------|----------|
| 054 | User language preference — `preferred_language` в profiles |
| 055 | Bilingual offer content — `title_en/ru`, `description_en/ru` |
| 056 | Bilingual offer variables |
| 057 | Bilingual task descriptions |
| 058 | Update existing bilingual data |

---

## FILES CREATED/MODIFIED

### Создано (сессия 2026-02-10)
- `memory-bank/localization-guide.md` — справочник по локализации
- `memory-bank/reflection/reflection-bilingual-localization.md` — рефлексия

### Изменено
- `src/components/admin/AccountSwitcher.jsx` — локализация
- `src/components/project/StageChangeModal.jsx` — локализация
- `src/pages/calculator/PublicCalculatorPage.jsx` — LanguageSwitcher
- `src/components/index.js` — экспорт LanguageSwitcher
- `src/hooks/useDashboard.js` — локализация месяцев
- `src/locales/en/common.json` — accountSwitcher, stageChange
- `src/locales/ru/common.json` — accountSwitcher, stageChange
- `src/locales/en/calculator.json` — public.calculatorTitle
- `src/locales/ru/calculator.json` — public.calculatorTitle

---

## TESTING

### Проверенные сценарии
1. ✅ Переключение языка в хедере — все элементы меняются
2. ✅ Переключение языка в публичном калькуляторе
3. ✅ AccountSwitcher — роли отображаются на текущем языке
4. ✅ StageChangeModal — все тексты локализованы
5. ✅ Dashboard графики — месяцы на русском/английском
6. ✅ AuditLogs — все элементы локализованы
7. ✅ ProfilePage — все поля локализованы

### Исправленные баги
- ❌ `Failed to resolve import "../i18n"` → ✅ Исправлен путь на `../lib/i18n`

---

## LESSONS LEARNED

### Что работает хорошо
1. **Namespace-система** — чёткое разделение по областям применения
2. **useTranslation hook** — простой и удобный API
3. **Интерполяция** — гибкость для динамических строк
4. **LanguageContext** — централизованное управление языком

### Частые ошибки
1. **Неправильный путь к i18n** — использовать `../lib/i18n`, не `../i18n`
2. **Забытый locale в queryKey** — данные не обновляются при смене языка
3. **Хардкоженные роли** — нужно использовать `t('roles.${role}')`
4. **Хардкоженная локаль дат** — `'en'` вместо динамической локали

### Рекомендации
1. При создании нового компонента — сразу добавлять локализацию
2. Всегда добавлять locale в queryKey для реактивных данных
3. Использовать `getLocalized()` для билингвальных данных из БД
4. Проверять оба языка после любых изменений

---

## DOCUMENTATION

### Созданные документы
1. **Справочник:** `memory-bank/localization-guide.md`
   - Быстрый старт
   - Паттерны локализации
   - Чеклисты
   - Примеры кода
   - Частые ошибки

2. **Рефлексия:** `memory-bank/reflection/reflection-bilingual-localization.md`
   - Полная история задачи
   - Архитектура
   - Все паттерны с примерами

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-bilingual-localization.md`
- **Guide:** `memory-bank/localization-guide.md`
- **i18n Config:** `calculator/src/lib/i18n.js`
- **Language Context:** `calculator/src/contexts/LanguageContext.jsx`
- **Language Hook:** `calculator/src/hooks/useLanguage.js`
- **Migrations:** `calculator/supabase/migrations/054-058_*.sql`

---

*Archived: 2026-02-10*
