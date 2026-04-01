# TASK ARCHIVE: Reactions in ReadersPopover

## METADATA

| Field | Value |
|-------|-------|
| Task ID | readers-popover-reactions |
| Date | 2026-02-18 |
| Complexity | Level 1 |
| Status | ARCHIVED ✅ |

## SUMMARY

Добавлено отображение эмодзи-реакций пользователей в попапе "Прочитано". Справа от имени каждого пользователя показываются его реакции на сообщение (если есть).

## IMPLEMENTATION

**File:** `src/components/comments/ReadersPopover.jsx`

- Добавлен `useCommentReactions` для загрузки реакций
- Создан `userReactionsMap` (useMemo) — маппинг user_id → [emojis]
- Эмодзи отображаются справа от имени в списке прочитавших

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-readers-popover-reactions.md`
- **Related:** `memory-bank/archive/archive-message-read-receipts.md`
