# TASK ARCHIVE: ReTracker AI Insights Chat Enhancements

## METADATA

| Field | Value |
|---|---|
| Task ID | `ai-insights-chat-enhancements` |
| Date Completed | 2026-02-21 |
| Complexity | Level 3 |
| Repository | `retracker` |
| Commit | `18c05ad` |
| Status | ARCHIVED ✅ |

---

## SUMMARY

Выполнено комплексное улучшение AI-чата в ReTracker: внедрен выбор модели в поле ввода, добавлен персистентный учет токенов/стоимости из БД с разбивкой по моделям, улучшена навигация embed-карточек к нужным комментариям/карточкам, и устранены UI-регрессии инпута и дропдауна.

---

## REQUIREMENTS

- Добавить переключение моделей GPT в чате (`4o` -> `5.x`) с удобным inline dropdown.
- Считать usage-траты персистентно (не завися от удаления чатов и перезагрузки).
- Показывать общие траты в compact-режиме и детализацию по моделям в expanded-режиме.
- Привести embed-рендеринг файлов/голосовых к стабильному и быстрому UX.
- Исправить визуальные и поведенческие дефекты инпута (двойная рамка, неправильный anchor у dropdown).

---

## IMPLEMENTATION

### Frontend
- `ChatView.jsx`
  - Добавлен выбор модели в инпуте.
  - Приведен к единой рамке контейнера без внутреннего ring/shadow.
  - Исправлено якорное позиционирование dropdown.
- `TokenUsage.jsx`
  - Переведен на БД-агрегации.
  - Добавлена расширенная детализация по моделям.
- `AIInsightsPanel.jsx`
  - Обновлен UI и структура вкладок под новую логику.
- Embed-компоненты (`CommentEmbed`, `FileEmbed`, `VoiceEmbed`)
  - Улучшена кликабельность и переход к источнику в задаче/комментарии.

### Hooks
- `useAIChat.js`
  - Сквозная передача выбранной модели до backend-запроса.
  - Инвалидация новых usage-запросов после ответов чата.
- `useAIDashboardData.js`
  - Добавлены хуки под RPC персистентной статистики и model breakdown.

### Backend / DB
- `supabase/functions/chat-dashboard/index.ts`
  - Корректная подача параметров для разных семейств моделей.
  - Актуализирован расчет стоимости по моделям.
  - Сохранение `model_used` для assistant-сообщений.
- `supabase/migrations/055_ai_persistent_usage.sql`
  - Добавлена колонка `model_used`.
  - Изменена FK-логика для сохранения истории затрат после удаления чатов.
  - Созданы RPC:
    - `get_ai_persistent_usage`
    - `get_ai_model_usage`

---

## TESTING

- Ручная проверка сценариев чата:
  - отправка сообщений с разными моделями;
  - корректный рендер и навигация embed-карточек;
  - проверка подсчета usage после refresh и удаления чатов.
- Отдельно проверены UI-регрессии инпута и dropdown через runtime-debug:
  - собраны стили и геометрия элементов;
  - подтверждена первопричина двойной обводки;
  - подтверждена первопричина "улетающего" меню.
- Финальная проверка пользователем: UX-проблемы устранены.

---

## LESSONS LEARNED

- Для usage-аналитики AI source of truth должен быть в БД, не в локальном состоянии чата.
- Малые визуальные правки в инпуте (например удаление `relative`) могут ломать positioning контексты.
- Runtime-логирование UI-геометрии резко сокращает время на фиксы визуальных регрессий.
- Для model-switcher важно делать сквозной change-set: UI + hooks + function + DB.

---

## REFERENCES

- Reflection: `memory-bank/reflection/reflection-ai-insights-chat-enhancements.md`
- Tasks: `memory-bank/tasks.md`
- Progress: `memory-bank/progress.md`
- Key migration: `retracker/supabase/migrations/055_ai_persistent_usage.sql`
- Key function: `retracker/supabase/functions/chat-dashboard/index.ts`
