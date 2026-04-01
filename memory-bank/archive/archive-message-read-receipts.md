# TASK ARCHIVE: Message Read Receipts

## METADATA

| Field | Value |
|-------|-------|
| Task ID | message-read-receipts |
| Date Started | 2026-02-18 |
| Date Completed | 2026-02-18 |
| Complexity Level | 3 |
| Status | ARCHIVED ✅ |

---

## SUMMARY

Реализована функциональность прочтения сообщений в чате задач ReTracker, аналогичная Telegram:
- Галочки статуса прочтения (✓ доставлено / ✓✓ прочитано)
- Попап со списком прочитавших (имя, аватар, время)
- Автоматическая пометка сообщений при просмотре (IntersectionObserver)
- Realtime обновления через Supabase
- Автор видит себя в списке прочитавших

---

## REQUIREMENTS

### Functional Requirements
1. ✅ Показывать статус прочтения на каждом сообщении
2. ✅ Одинарная галочка (✓) — доставлено, двойная зелёная (✓✓) — прочитано
3. ✅ Клик на галочку — показать список прочитавших
4. ✅ Список содержит: аватар, имя, время прочтения
5. ✅ Автопрочтение при появлении сообщения в viewport
6. ✅ Realtime обновление статусов
7. ✅ Автор тоже помечает свои сообщения как прочитанные

### Non-Functional Requirements
1. ✅ Производительность — batch операции для множества сообщений
2. ✅ Graceful degradation — работает без миграции (возвращает пустые данные)
3. ✅ UX — попап закрывается при скролле

---

## IMPLEMENTATION

### Database Layer

**Migration:** `035_message_read_receipts.sql`

```sql
-- Enable Realtime for comment_reads
ALTER PUBLICATION supabase_realtime ADD TABLE comment_reads;

-- RPC: Batch mark as read
CREATE FUNCTION mark_comments_as_read_batch(p_comment_ids UUID[], p_user_id UUID)
  -- ON CONFLICT DO NOTHING prevents duplicates

-- RPC: Get readers for a comment
CREATE FUNCTION get_comment_readers(p_comment_id UUID)
  -- Returns: user_id, full_name, avatar_url, read_at

-- RPC: Get read counts for multiple comments
CREATE FUNCTION get_comments_read_counts(p_comment_ids UUID[])
  -- Returns: comment_id, read_count, readers[]
```

### Frontend Components

#### ReadIndicator.jsx
```jsx
// Displays checkmark icon based on read status
// Single check (gray) = delivered
// Double check (emerald) = read by someone
// Shows count if > 0
```

#### ReadersPopover.jsx
```jsx
// Portal-based popover (renders in document.body)
// Lists readers with avatar, name, relative time
// Closes on: click outside, Escape, scroll
// Positions via JS getBoundingClientRect()
```

#### ReadIndicatorWithPopover (in CommentItem.jsx)
```jsx
// Wrapper component with anchorRef for positioning
// Manages popover open/close state
```

### Hooks

#### useCommentReads.js
```javascript
// useCommentsReadCounts(commentIds) - batch fetch read counts
// useCommentReaders(commentId) - fetch readers list
// useMarkCommentsAsRead() - mutation for marking
// useCommentReadsRealtime(entityId) - Realtime subscription
// useBatchMarkAsRead(debounceMs) - debounced batch marking
```

### Integration Points

#### CommentThread.jsx
- IntersectionObserver watches visible messages
- Threshold 0.5 (50% visible)
- Debounced batch marking (200ms)
- Realtime subscription for entity

#### CommentItem.jsx
- ReadIndicatorWithPopover in flex wrapper
- Receives readInfo from parent
- Toolbar shifted left (right-8) to avoid overlap

---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    CommentThread                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useCommentsReadCounts(commentIds)                    │   │
│  │  useCommentReadsRealtime(entityId)                    │   │
│  │  useBatchMarkAsRead()                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│              IntersectionObserver                            │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   CommentItem                         │   │
│  │  ┌────────────────────────────────────────────────┐  │   │
│  │  │  ReadIndicatorWithPopover                       │  │   │
│  │  │  ├── ReadIndicator (✓ / ✓✓)                    │  │   │
│  │  │  └── ReadersPopover (portal → body)            │  │   │
│  │  └────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  comment_reads table                                  │   │
│  │  ├── mark_comments_as_read_batch (RPC)               │   │
│  │  ├── get_comment_readers (RPC)                       │   │
│  │  ├── get_comments_read_counts (RPC)                  │   │
│  │  └── Realtime subscription                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## FILES

### Created
| File | Purpose |
|------|---------|
| `supabase/migrations/035_message_read_receipts.sql` | RPC functions, RLS, Realtime |
| `src/hooks/useCommentReads.js` | React Query hooks |
| `src/components/comments/ReadIndicator.jsx` | Checkmark component |
| `src/components/comments/ReadersPopover.jsx` | Readers list popover |

### Modified
| File | Changes |
|------|---------|
| `src/lib/supabase.js` | Added enableRealtime/disableRealtime functions |
| `src/components/comments/CommentItem.jsx` | Added ReadIndicatorWithPopover, shifted toolbar |
| `src/components/comments/CommentThread.jsx` | Added IntersectionObserver, batch marking, Realtime |
| `src/components/comments/VoiceQuote.jsx` | Unified styling with QuotePreview |

---

## TESTING

### Manual Testing Performed
1. ✅ Single user — own messages marked as read, shown in readers list
2. ✅ Scroll behavior — messages auto-marked when 50% visible
3. ✅ Popover positioning — appears left of checkmark
4. ✅ Popover close — on click outside, Escape, scroll
5. ✅ Toolbar overlap — no conflict with action buttons
6. ✅ Realtime — status updates without refresh

### Edge Cases Handled
- Migration not applied — returns empty data, no errors
- Empty readers list — shows "Ещё никто не прочитал"
- Long readers list — scrollable with max-height

---

## LESSONS LEARNED

### 1. createPortal for Popups
Any popup that needs to "escape" its container (overflow: hidden, z-index stacking) should use `createPortal(document.body)` + JS positioning.

### 2. Scroll Event Capture Phase
To catch scroll on any parent element:
```javascript
window.addEventListener('scroll', handler, true) // capture = true
```

### 3. IntersectionObserver Pattern
Excellent for "mark as read" functionality:
- Debounce to batch multiple marks
- Use Set to prevent duplicate processing
- Cleanup observers on unmount

### 4. Iterative UI Design
Positioning UI elements often requires multiple iterations with real user feedback. Plan for ~3-5 iterations on visual placement.

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-message-read-receipts.md`
- **Existing table:** `comment_reads` (created in earlier migration)
- **Related feature:** Voice Quote playback, Image comments

---

## FUTURE ENHANCEMENTS

1. **Unread badge on Kanban cards** — show count of unread messages
2. **Privacy settings** — option to hide read status
3. **Delivery vs Read** — separate "delivered to server" status
4. **Thread-specific tracking** — separate read status for threads
