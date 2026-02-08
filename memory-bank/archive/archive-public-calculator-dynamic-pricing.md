# TASK ARCHIVE: Public Calculator + Dynamic Pricing

## METADATA
- **Task ID:** public-calculator-dynamic-pricing
- **Date:** 2026-02-08
- **Complexity:** Level 3
- **Status:** COMPLETED ✅
- **Reflection:** `memory-bank/reflection/reflection-public-calculator-dynamic-pricing.md`

---

## SUMMARY

Двухчастная функциональность:
1. Перевод калькулятора с захардкоженных локальных цен на динамические из Supabase `price_configs` через RPC `get_public_pricing()`.
2. Публичный калькулятор без регистрации (`/shared/calculator`) с системой кодов для шеринга подборок, авто-созданием проекта+спеки при регистрации, импортом кода для существующих пользователей.

---

## REQUIREMENTS

1. Цены, изменённые в админке (PricingPage), должны отражаться во всех калькуляторах, включая публичный.
2. Анонимный пользователь может открыть калькулятор по прямой ссылке, создать подборку, посмотреть спецификацию, распечатать.
3. Для сохранения — регистрация. При регистрации с кодом авто-создаётся проект и спецификация-черновик.
4. Уникальный 8-символьный код для каждой подборки. Код + прямая ссылка.
5. Существующие пользователи могут импортировать код в своём калькуляторе.
6. Безопасность: RPC с security definer, rate limiting, RLS без прямых политик.
7. Промокоды доступны в публичном калькуляторе.

---

## IMPLEMENTATION

### Фаза 0: Динамические цены

**Migration `049_dynamic_pricing.sql`:**
- Пересид `price_configs` (97 записей) с точными значениями из локальных файлов
- Категории: Concept Document, Symbols, Backgrounds, Pop-ups, UI Menus, Marketing, Styles, Animations, Usage Rights, Payment, Revisions
- RPC `get_public_pricing()` — SECURITY DEFINER, STABLE, GRANT для anon+authenticated

**Hook `useDynamicPricing.js`:**
- React Query с staleTime 30 min
- Мерж числовых значений из Supabase с метаданными из локальных файлов
- Fallback на локальные данные при ошибке загрузки
- Возвращает: `{ data, isLoading, isUsingFallback, error }`

**`useCalculator.js` — рефакторинг:**
- Принимает `pricingData = null` параметром
- Все ссылки на `ALL_ITEMS`, `STYLES`, `ANIMATIONS`, `USAGE_RIGHTS`, `PAYMENT_MODELS` заменены на динамические `_allItems`, `_styles` и т.д.
- Зависимости useCallback/useMemo обновлены
- Backward-compatible — без параметра работает как раньше

**Компоненты — optional props:**
- `StyleSelector` → `styles` prop
- `SettingsSection` → `usageRightsList`, `paymentModelsList` props
- `ItemRow` → `animations` prop
- `CategorySection` → `animations` prop (пробрасывает в ItemRow)
- `CalculatorPage`, `CalculatorModal` — подключены к `useDynamicPricing()`

### Фаза 1: Shared Sessions

**Migration `050_shared_calculator_sessions.sql`:**
- Таблица `shared_calculator_sessions`: id, short_code, state_json, totals_json, expires_at (30 дней), claimed_by, ip_hash, metadata
- Индексы: short_code, expires (для cleanup), ip+created_at (для rate limiting)
- RLS включён, политик нет — доступ только через RPC
- Helper `generate_short_code()` — 8 символов (A-Z без I/O + 2-9)
- Helper `generate_spec_number()` — SPEC-YYYY-NNNNN (как на клиенте)
- RPC `save_shared_session()` — rate limit 10/hr, валидация, генерация кода
- RPC `load_shared_session()` — проверка expired/claimed, STABLE
- RPC `claim_shared_session()` — auth.uid(), FOR UPDATE, создание client→project→specification
- GRANT: save+load для anon+authenticated, claim только для authenticated

### Фаза 2: PublicCalculatorPage

- Полноценная страница калькулятора без аутентификации
- Баннер "ReSkin Lab Calculator — Build your selection..."
- Sticky action bar (мобильный only на десктопе — `lg:hidden`)
- Сайдбар с итогами + кнопки Get Code / View Spec / Register
- Мобильный футер
- Модалка с кодом и share-ссылкой
- Warning баннер при fallback pricing

### Фазы 3-7: Хуки, роутинг, claim flow

- `useSharedSessions.js` — 3 хука (save, load, claim) с обработкой ошибок
- `ipHash.js` — SHA-256 публичного IP через api.ipify.org, кеш в sessionStorage
- Роуты `/shared/calculator` и `/shared/calculator/:code` в App.jsx
- `RegisterPage` — читает `?code=`, сохраняет в localStorage, показывает баннер
- `PendingCodeBanner` — на DashboardPage, авто-claim после логина
- `ImportCodeModal` — ввод кода в калькуляторе существующего пользователя
- Ссылка "Public Calculator" в хедере калькулятора (внешняя ссылка, новая вкладка)

---

## TESTING

### Supabase Verification
- GRANT проверен: 8 строк (все функции для нужных ролей) ✅
- RLS: relrowsecurity=true, 0 политик ✅
- get_public_pricing(): возвращает 97 записей с корректными значениями ✅
- pg_cron: cleanup задача создана (ежедневно в 3:00 UTC) ✅

### Build Verification
- `npx vite build` — SUCCESS, 0 ошибок ✅
- Линтер — 0 ошибок на всех 15 изменённых файлах ✅

### UI Verification
- Публичный калькулятор загружается с динамическими ценами ✅
- Сайдбар показывает корректные итоги ✅
- Дублирование кнопок исправлено (desktop: только сайдбар) ✅

---

## FILES

### Created (8 files)
| File | Purpose |
|------|---------|
| `supabase/migrations/049_dynamic_pricing.sql` | Пересид price_configs + RPC get_public_pricing |
| `supabase/migrations/050_shared_calculator_sessions.sql` | Таблица + 3 RPC + helpers |
| `src/hooks/useDynamicPricing.js` | Загрузка цен из Supabase с fallback |
| `src/hooks/useSharedSessions.js` | Save/load/claim shared sessions |
| `src/lib/ipHash.js` | SHA-256 IP для rate limiting |
| `src/pages/calculator/PublicCalculatorPage.jsx` | Публичная страница калькулятора |
| `src/components/calculator/ImportCodeModal.jsx` | Импорт кода |
| `src/components/calculator/PendingCodeBanner.jsx` | Авто-claim на Dashboard |

### Modified (11 files)
| File | Changes |
|------|---------|
| `src/hooks/useCalculator.js` | pricingData param, динамические ссылки |
| `src/pages/calculator/CalculatorPage.jsx` | useDynamicPricing, Import Code, Public link |
| `src/components/project/CalculatorModal.jsx` | useDynamicPricing |
| `src/components/StyleSelector.jsx` | Optional styles prop |
| `src/components/SettingsSection.jsx` | Optional usageRightsList, paymentModelsList |
| `src/components/ItemRow.jsx` | Optional animations prop |
| `src/components/CategorySection.jsx` | Pass animations to ItemRow |
| `src/components/calculator/index.js` | New exports |
| `src/pages/auth/RegisterPage.jsx` | ?code= handling, localStorage |
| `src/pages/dashboard/DashboardPage.jsx` | PendingCodeBanner |
| `src/App.jsx` | /shared/calculator routes |

---

## LESSONS LEARNED

1. **Аудит данных до реализации** — обнаружение рассинхронизации цен (локальные vs Supabase) до начала работы предотвратило баги в публичном калькуляторе.
2. **Optional props > Context** для feature-specific данных в конечном дереве компонентов.
3. **RPC + security definer** — золотой стандарт для анонимного доступа к Supabase.
4. **Rate limiting в SQL** — `COUNT(*) WHERE created_at > now() - '1 hour'` проще Redis.
5. **localStorage** для cross-page state (registration → login → dashboard).

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-public-calculator-dynamic-pricing.md`
- **Plan:** `/Users/sergejbelaev/.cursor/plans/public_calculator_sharing_cf4a403f.plan.md`
- **System Patterns:** `memory-bank/systemPatterns.md`
