# Reflection: Comment Forwarding Feature

## Task Summary
**Feature:** Пересылка сообщений между карточками задач в ReTracker
**Complexity:** Level 3
**Date:** 2026-02-17
**Commit:** `9118a49`

### Scope
- Диалог пересылки сообщений с выбором целевой карточки
- Копирование контента, вложений и снимка результатов опроса
- Отображение заголовка пересланного сообщения с ссылкой на источник
- Глобальный поиск задач по всем доступным workspace'ам

---

## What Went Well

### 1. Архитектура компонентов
- Чёткое разделение ответственности: `ForwardMessageDialog`, `TaskPicker`, `ForwardedMessageHeader`, `ForwardedPollSnapshot`
- `TaskPicker` сделан переиспользуемым для других сценариев (выбор задачи)
- Хуки `useGlobalTaskSearch` изолированы от локального поиска по доске

### 2. Backend-логика
- RPC функция `forward_comment` атомарно выполняет все операции:
  - Копирование контента и метаданных
  - Копирование вложений с новыми ID
  - Создание снимка опроса
  - Запись в таблицу истории пересылок
- RLS политики корректно ограничивают доступ

### 3. UX решения
- Три вкладки в TaskPicker (Поиск / Недавние / Проекты) покрывают разные сценарии
- Preview пересылаемого сообщения даёт контекст
- Визуальная индикация выбранной задачи

---

## Challenges

### 1. Click-through баг (критический)
**Проблема:** Клики внутри `ForwardMessageDialog` "пробивались" к элементам под модалкой, открывая другие карточки задач.

**Симптомы:**
- В логах менялся `excludeTaskId` при каждом клике
- Табы и кнопки задач не реагировали на клики
- Карточки за диалогом открывались

**Root Cause:** `ForwardMessageDialog` рендерился внутри `TaskDetailModal` без портала, оба с `z-50`. DOM-иерархия родителя перехватывала события.

**Решение:**
1. Добавлен `createPortal(document.body)` для рендеринга вне DOM-иерархии
2. Увеличен `z-index` до `z-[100]`
3. Добавлены `onClick` и `onMouseDown` с `stopPropagation()` на контейнер и модалку

**Debug-подход:**
- Сформулированы 6 гипотез (A-F)
- Добавлена NDJSON-инструментация в 4 файла
- Логи подтвердили гипотезу F (click-through)
- Фикс верифицирован повторным прогоном с логами

### 2. Отсутствующая зависимость `sonner`
**Проблема:** Первоначально использовал `import { toast } from 'sonner'`, но библиотека не была установлена.

**Решение:** Убрал использование toast, оставил console.error для ошибок и простое закрытие диалога при успехе.

---

## Lessons Learned

### 1. Модальные окна внутри модальных окон
> **Правило:** Всегда использовать `createPortal(document.body)` для вложенных модалок, чтобы избежать проблем с z-index и event propagation.

### 2. Debug-режим эффективен
- Формализованный подход с гипотезами и инструментацией быстро нашёл root cause
- Логи сразу показали, что данные загружаются (гипотезы A, B отклонены), но клики не работают (гипотеза C подтверждена частично)
- Анализ множественных `excludeTaskId` указал на click-through (гипотеза F)

### 3. Проверять зависимости
- Перед использованием библиотеки (`sonner`, etc.) проверять её наличие в проекте
- Альтернатива: использовать существующие паттерны проекта для уведомлений

---

## Technical Improvements

### Реализовано
- `useGlobalTaskSearch` — универсальный хук для поиска задач по всем workspace'ам
- `TaskPicker` — переиспользуемый компонент выбора задачи
- Таблица `comment_forwards` — отслеживание истории пересылок для будущих фич

### TODO (записано в systemPatterns.md)
При реализации системы прав доступа:
- Проверять доступ к оригинальной карточке в `ForwardedMessageHeader`
- Делать ссылку некликабельной, если нет доступа
- Добавить `canAccess` check в `useSourceTaskInfo`

---

## Process Improvements

### 1. Режим вопросов перед реализацией
- Задача была большой, но вопросы помогли уточнить scope до начала работы
- Пользователь чётко определил: контекстное меню → диалог → выбор карточки → пересылка

### 2. Debug workflow
- NDJSON логирование + delete_file перед каждым прогоном = чистые данные
- Гипотезы с ID позволяют быстро фильтровать логи
- Верификация фикса через повторный прогон с теми же логами

---

## Files Created/Modified

### New Files (5)
- `src/components/comments/ForwardMessageDialog.jsx`
- `src/components/comments/ForwardedMessageHeader.jsx`
- `src/components/comments/ForwardedPollSnapshot.jsx`
- `src/components/comments/TaskPicker.jsx`
- `supabase/migrations/025_comment_forwarding.sql`

### Modified Files (7)
- `src/components/comments/CommentItem.jsx` — кнопка пересылки, интеграция заголовка
- `src/components/comments/CommentThread.jsx` — проброс onForward
- `src/components/comments/ThreadView.jsx` — проброс onForward
- `src/components/comments/index.js` — экспорты
- `src/components/tasks/TaskDetailModal.jsx` — состояние и диалог пересылки
- `src/hooks/useComments.js` — хуки для пересылки
- `src/hooks/useTaskSearch.js` — глобальный поиск задач

---

## Next Steps

1. **Применить миграцию** `025_comment_forwarding.sql` в Supabase
2. **Тестирование E2E**: переслать сообщение с вложениями и опросом
3. **При реализации прав**: проверка доступа к оригинальной карточке
