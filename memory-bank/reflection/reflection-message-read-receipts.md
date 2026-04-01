# Reflection: Message Read Receipts

## Task Summary
**Date:** 2026-02-18
**Complexity:** Level 3
**Status:** COMPLETED ✅

Реализована функциональность прочтения сообщений в чате задач ReTracker, аналогичная Telegram: галочки статуса прочтения, попап со списком прочитавших, автоматическая пометка при просмотре.

---

## What Went Well

### 1. Чёткое планирование через вопросы
Перед началом реализации были заданы уточняющие вопросы, что помогло избежать переделок:
- Где применять (только чат задач)
- Групповые чаты (да, несколько участников)
- Как показывать статус (галочки ✓/✓✓)
- Realtime обновления (да, WebSocket)
- Автопрочтение (IntersectionObserver)

### 2. Модульная архитектура
- `useCommentReads.js` — все хуки для работы с прочтениями
- `ReadIndicator.jsx` — изолированный компонент галочки
- `ReadersPopover.jsx` — изолированный попап
- RPC функции в PostgreSQL для batch-операций

### 3. Graceful degradation
Хуки обрабатывают случай, когда миграция ещё не применена:
```javascript
if (error) {
  console.warn('get_comments_read_counts not available:', error.message)
  return {}
}
```

### 4. Производительность
- Batch marking — debounce 200ms собирает ID и отправляет одним запросом
- Batch fetching — `get_comments_read_counts` получает данные для всех сообщений за раз
- IntersectionObserver — пометка только видимых сообщений

---

## Challenges Encountered

### 1. Позиционирование попапа
**Проблема:** Попап появлялся в неправильном месте (слева вместо справа, снизу вместо сверху).

**Причина:** Использовался relative positioning внутри элемента с overflow, что ограничивало видимость.

**Решение:** Использование `createPortal` для рендеринга в `document.body` + JavaScript расчёт позиции через `getBoundingClientRect()`.

### 2. Конфликт с hover toolbar
**Проблема:** Toolbar перекрывал галочку на коротких сообщениях.

**Решение:** Сдвинули toolbar левее (`right-4` → `right-8`), чтобы освободить место для галочки.

### 3. Несколько итераций позиционирования галочки
**Итерации:**
1. Inline в конце текста (Telegram-style) — не понравилось визуально
2. Справа от сообщения — выбран окончательный вариант
3. Внизу в row с реакциями — промежуточный вариант

---

## Lessons Learned

### 1. createPortal для попапов
Любой попап, который должен выходить за границы родительского контейнера, лучше рендерить через `createPortal(document.body)`. Это избавляет от проблем с:
- `overflow: hidden` родителей
- z-index stacking contexts
- Позиционированием относительно scrollable контейнеров

### 2. Закрытие попапа при скролле
Стандартный паттерн UX — закрывать попапы при скролле:
```javascript
window.addEventListener('scroll', handleScroll, true) // capture phase
```
Capture phase (`true`) важен для перехвата событий на всех уровнях DOM.

### 3. IntersectionObserver для автопрочтения
Отличный паттерн для отслеживания видимости сообщений:
- Threshold 0.5 — сообщение видно на 50%
- Debounce для batch-отправки
- Set для предотвращения повторных пометок

### 4. Итеративный UI дизайн
Позиционирование UI элементов часто требует нескольких итераций с реальным фидбеком пользователя. Важно быстро прототипировать и получать обратную связь.

---

## Technical Decisions

### 1. RPC функции вместо прямых запросов
**Решение:** Использовать PostgreSQL RPC для batch-операций.

**Обоснование:**
- `mark_comments_as_read_batch` — ON CONFLICT DO NOTHING предотвращает дубли
- `get_comments_read_counts` — один запрос вместо N
- `get_comment_readers` — JOIN с profiles для получения имён/аватаров

### 2. Realtime через Supabase
**Решение:** Подписка на `comment_reads` таблицу.

**Обоснование:**
- Встроенная инфраструктура Supabase
- Автоматическая инвалидация React Query кешей
- Минимальный overhead

### 3. Автор видит себя в прочитавших
**Решение:** Не фильтровать автора из списка.

**Обоснование:**
- Telegram показывает автора
- Проще для понимания ("я тоже прочитал")
- Меньше edge cases

---

## Files Created/Modified

### New Files
| File | Purpose |
|------|---------|
| `migrations/035_message_read_receipts.sql` | RPC функции, RLS политики, Realtime |
| `hooks/useCommentReads.js` | Хуки для прочтений |
| `components/comments/ReadIndicator.jsx` | Компонент галочки |
| `components/comments/ReadersPopover.jsx` | Попап со списком |

### Modified Files
| File | Changes |
|------|---------|
| `lib/supabase.js` | enableRealtime/disableRealtime функции |
| `components/comments/CommentItem.jsx` | Интеграция галочки и попапа |
| `components/comments/CommentThread.jsx` | IntersectionObserver, batch marking |
| `components/comments/VoiceQuote.jsx` | Унификация стиля с QuotePreview |

---

## Metrics

| Metric | Value |
|--------|-------|
| Files Created | 4 |
| Files Modified | 5 |
| UI Iterations | ~5 (позиционирование) |
| RPC Functions | 3 |
| Lines Added | ~500 |

---

## Next Steps (Optional Enhancements)

1. **Unread badge на Kanban карточках** — показывать количество непрочитанных сообщений
2. **Privacy settings** — возможность скрыть свой статус прочтения
3. **Delivery status** — отдельная галочка для "доставлено" vs "прочитано"
4. **Read receipts в threads** — отдельный tracking для тредов

---

## Conclusion

Задача выполнена успешно. Основные вызовы были связаны с UI/UX — позиционирование попапа и галочки потребовали нескольких итераций. Техническая реализация (база данных, хуки, Realtime) прошла без серьёзных проблем благодаря чёткому планированию на этапе вопросов.

Ключевой урок: для попапов, которые должны "выпрыгивать" из контейнера, всегда использовать `createPortal` и абсолютное позиционирование через JS.
