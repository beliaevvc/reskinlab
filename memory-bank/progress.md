# Progress Log

## 2026-04-01 — ReTracker: Скетч (рисование) в чате задачи [АРХИВИРОВАНО]
- Уровень: 3
- Архив: `memory-bank/archive/archive-sketch-editor-chat.md`
- Рефлексия: `memory-bank/reflection/reflection-sketch-editor.md`
- Creative: `memory-bank/creative/creative-sketch-editor.md`
- Файлы: SketchEditor.jsx (новый), AttachmentMenu.jsx, CommentInput.jsx
- Creative: `memory-bank/creative/creative-sketch-editor.md`

---

## 2026-04-01 — ReTracker: ложная «(ред.)» при треде [АРХИВИРОВАНО]
- Уровень: 2
- Архив: `memory-bank/archive/archive-thread-edited-label-fix.md`
- Рефлексия: `memory-bank/reflection/reflection-thread-edited-label-fix.md`

---

## 2026-03-31 — ReTracker: ImageViewer 3D-режим — АРХИВИРОВАНО ✅

### Уровень: 2
### Архив: `memory-bank/archive/archive-image-viewer-3d-mode.md`
### Рефлексия: `memory-bank/reflection/reflection-image-viewer-3d-mode.md`

---

## 2026-03-31 — ReTracker: ImageViewer 3D-режим и прозрачные PNG

### Уровень: 2
### Статус: REFLECT завершён (после BUILD и UX-итераций)

### Изменения
Полноэкранный `ImageViewer`: переключаемый псевдо-3D просмотр (`perspective`, `rotateX`/`rotateY`, `translateZ`, scale), rAF+lerp по позиции мыши относительно кадра; отключение при режиме комментария и `prefers-reduced-motion`. Иконка режима — «куб». Прозрачные PNG: убран градиентный блик с blend, тени `drop-shadow` вместо `box-shadow`; то же в `FilePreviewOverlay` (`CommentAttachments.jsx`).

### Файлы
- `retracker/src/components/comments/ImageViewer.jsx`
- `retracker/src/components/comments/CommentAttachments.jsx`

### Проверки
- `npm run build` (retracker) — успешно
- `npm run test:permissions:sql` — пройдены

### Рефлексия
📄 `memory-bank/reflection/reflection-image-viewer-3d-mode.md`

---

## ReTracker: AI Insights Chat Enhancements — ARCHIVED ✅

### Date: 2026-02-21
### Complexity: Level 3
### Commit: `18c05ad`

### Summary
Завершен цикл улучшений AI-чата ReTracker: селектор моделей в инпуте, персистентные usage-метрики токенов и стоимости из БД, breakdown по моделям, улучшенная навигация embed-карточек, и стабилизация UI инпута/дропдауна.

### Key Outcomes
- Модель передается сквозь фронт и бэк (UI -> hook -> Edge Function).
- Usage считается по данным БД и сохраняется независимо от удаления чатов.
- Добавлен breakdown затрат по моделям в расширенной статистике.
- Исправлены UX-дефекты чата (двойная обводка, якорь dropdown, единый визуальный контур).

### Files
- `retracker/src/components/dashboard/AIInsights/components/ChatView.jsx`
- `retracker/src/components/dashboard/AIInsights/components/TokenUsage.jsx`
- `retracker/src/hooks/useAIChat.js`
- `retracker/src/hooks/useAIDashboardData.js`
- `retracker/src/pages/DashboardPage.jsx`
- `retracker/supabase/functions/chat-dashboard/index.ts`
- `retracker/supabase/migrations/055_ai_persistent_usage.sql`

### Reflection Reference
📄 `memory-bank/reflection/reflection-ai-insights-chat-enhancements.md`

### Archive Reference
📄 `memory-bank/archive/archive-ai-insights-chat-enhancements.md`

---

## ReTracker: AI Summary Tab — ARCHIVED ✅

### Date: 2026-02-21
### Complexity: Level 3-4
### Commits: `ee4be69`, `551ec72`

### Summary
Вкладка "AI Summary" в модалке задачи ReTracker. GPT-powered анализ задачи (название, описание, чеклисты, виджеты, комментарии + голосовые транскрипции) с генерацией структурированного саммари. Расширенный staleCheck для обнаружения изменений task.updated_at.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Created | 6 |
| Files Modified | 5 |
| Lines Added | ~1500 |
| Migrations | 3 |
| Debug Iterations | ~15 |
| UI Iterations | ~8 |
| Hypotheses Generated | 6 |

### Components Created
- `TaskAISummary.jsx` — основной компонент вкладки с переключателем тона, stale check, markdown parsing

### Hooks Created
- `useTaskSummary.js` — React Query hooks для fetching и генерации саммари

### Edge Function
- `summarize-task/index.ts` — OpenAI GPT с strict JSON schema, service role для RLS bypass

### Database Changes
- `047_task_summaries.sql` — таблица task_summaries + RLS + grants
- `048_task_summaries_per_tone.sql` — `UNIQUE(task_id, tone)` constraint
- `049_task_summaries_track_task_updated.sql` — `task_updated_at` column + stale function

### Key Features
- Три тона: деловой, нейтральный, простой
- Per-tone caching — отдельный кеш для каждого тона
- Stale check — проверка `last_comment_id` + `task.updated_at` для экономии токенов
- Markdown parsing — `**bold**` → `<strong>`
- Brand colors — все акценты emerald green

### Debug Challenges Resolved
- **JWT 401** → `--no-verify-jwt` deploy flag
- **Constraint violation** → tone mapping fix (`casual` → `informal`)
- **Circular JSON** → arrow function wrappers
- **RLS denied** → service role client
- **staleCheck not activating** → fixed updateTask argument structure in TaskDetailModal

### Archive Reference
📄 `memory-bank/archive/archive-ai-summary-tab.md`
📄 `memory-bank/reflection/reflection-ai-summary-tab.md`

---

## Project Header Description & Sidebar Improvements — ARCHIVED ✅

### Date: 2026-02-20
### Complexity: Level 2

### Summary
Добавление описания проекта в header с inline-редактированием + улучшения сайдбара при свёрнутом состоянии.

### Key Changes
- **BoardHeader** — описание проекта под названием, inline editing
- **Layout** — упрощён свёрнутый сайдбар (только иконка папки)

### Files Modified
- `retracker/src/components/board/BoardHeader.jsx`
- `retracker/src/components/layout/Layout.jsx`

### Archive Reference
📄 `memory-bank/archive/archive-project-header-description.md`
📄 `memory-bank/reflection/reflection-project-header-description.md`

---

## ReTracker: Clickable Widgets on Kanban/List — ARCHIVED ✅

### Date: 2026-02-19/20
### Complexity: Level 2-3

### Summary
Кликабельные виджеты на карточках задач в Kanban и List view — редактирование значений прямо на доске без открытия модалки. Виджет "Время в колонке" (Time in Column) с историей статусов.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Created | 3 |
| Files Modified | 7 |
| Migrations | 2 |
| Dropdown Components | 6 |

### Components Created
- `TimeInColumnSticker.jsx` — виджет времени в колонке с dropdown историей

### Components Modified
- `WidgetSticker.jsx` — добавлены inline dropdown editors для всех типов виджетов
- `TaskWidgets.jsx` — кнопка "+" для добавления виджетов, editable prop

### Database Changes
- `038_time_in_column.sql` — ENUM value + status_changed_at column + widget template
- `039_task_status_history.sql` — history table + triggers (SECURITY DEFINER)

### Key Features
- Клик на виджет → inline dropdown редактор
- Кнопка "+" при наведении для добавления новых виджетов
- Time in Column: автообновление, история статусов в dropdown
- Сортировка истории: новые сверху
- Event propagation fix: клик на виджет не открывает карточку

### Archive Reference
📄 `memory-bank/archive/archive-clickable-widgets-kanban.md`
📄 `memory-bank/reflection/reflection-clickable-widgets-kanban.md`

---

## ReTracker: Card Covers & Cover Crop — ARCHIVED ✅

### Date: 2026-02-19
### Complexity: Level 2-3

### Summary
Обложки для карточек задач в канбане: автоматическая установка при загрузке изображений, контекстное меню (установить/удалить обложку, скачать), настройка области кадрирования (drag + zoom) через модалку.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Created | 4 |
| Files Modified | 8 |
| Migrations | 1 |
| UI Iterations | 5+ |

### Components Created
- `CoverCropModal.jsx` — модалка настройки области кадрирования
- `ImageContextMenu.jsx` — контекстное меню на изображениях в чате
- `DisplaySettings.jsx` — настройки отображения доски (auto-cover)

### Hooks Created
- `useTaskCover.js` — set/remove cover, auto-set, update position

### Database Changes
- `036_task_covers.sql` — cover_file_id, cover_pinned, cover_position, RPC functions

### Key Features
- Auto-cover при загрузке изображений (настройка на уровне доски)
- Контекстное меню: "Установить обложкой", "Удалить обложку", "Скачать"
- Pinned covers не заменяются автоматически
- Drag-to-move и zoom в модалке кадрирования
- Полноширинная обложка на карточке канбана

### Archive Reference
📄 `memory-bank/archive/archive-card-covers-crop.md`
📄 `memory-bank/reflection/reflection-card-covers-crop.md`

---

## Reactions in ReadersPopover — ARCHIVED ✅

### Date: 2026-02-18
### Complexity: Level 1

Добавлено отображение эмодзи-реакций в попапе "Прочитано" — справа от имени пользователя.

**Archive:** `memory-bank/archive/archive-readers-popover-reactions.md`

---

## ReTracker: Message Read Receipts — ARCHIVED ✅

### Date: 2026-02-18

### Summary
Функциональность прочтения сообщений в чате задач (как в Telegram): галочки статуса (✓/✓✓), попап со списком прочитавших, автоматическая пометка при просмотре через IntersectionObserver, Realtime обновления.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Created | 4 |
| Files Modified | 5 |
| RPC Functions | 3 |
| UI Iterations | ~5 |

### Components Created
- `ReadIndicator.jsx` — галочка статуса прочтения
- `ReadersPopover.jsx` — попап со списком прочитавших (createPortal)

### Hooks Created
- `useCommentReads.js` — batch marking, readers fetching, Realtime subscription

### Database Changes
- `035_message_read_receipts.sql` — RPC функции, RLS политики, Realtime publication

### Key Features
- Галочки: ✓ (доставлено) / ✓✓ зелёная (прочитано)
- Клик на галочку → попап со списком читателей + время
- IntersectionObserver для автопрочтения при скролле
- Закрытие попапа при скролле
- Автор видит себя в списке прочитавших

### Archive Reference
📄 `memory-bank/archive/archive-message-read-receipts.md`
📄 `memory-bank/reflection/reflection-message-read-receipts.md`

---

## Voice Quote Playback Fix — ARCHIVED ✅

### Date: 2026-02-18

### Summary
Исправлен баг воспроизведения цитат голосовых сообщений (VoiceQuote). Две проблемы: условный рендер `<audio>` элемента терял event listeners; `setIsPlaying(true)` вызывался до успешного `audio.play()`.

### Root Cause
1. `{audioUrl && <audio />}` — пересоздание элемента при изменении audioUrl
2. Синхронный `setIsPlaying(true)` до resolve промиса `play()`

### Fix
- Audio элемент всегда рендерится: `<audio src={audioUrl || ''} />`
- `setIsPlaying(true)` только в `.then()` промиса `play()`

### Files Modified
- `retracker/src/components/comments/VoiceQuote.jsx`

### Archive Reference
📄 `memory-bank/archive/archive-voice-quote-playback-fix.md`
📄 `memory-bank/reflection/reflection-voice-quote-playback-fix.md`

---

## ReTracker: MediaGallery Refactor & Comment Improvements — ARCHIVED ✅

### Date: 2026-02-18

### Summary
Рефакторинг раздела "Медиа" в карточке задачи: отдельный таб для голосовых сообщений, переключатель вида grid/list, бейджи комментариев на изображениях, интеграция ImageViewer с комментариями и редактированием, исправления пагинации и error handling для изображений.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Modified | 5 |
| Bug Fixes | 4 |
| New Components | ~10 (sub-components) |

### Components Modified
- `MediaGallery.jsx` — voice tab, view toggle, comment badges, ImageViewer integration
- `CommentThread.jsx` — scroll preservation on pagination
- `CommentAttachments.jsx` — image error handling
- `CommentItem.jsx` — ImageThumbnail for replies
- `TaskDetailModal.jsx` — onEditAndSend prop

### Key Features
- Таб "Голосовые" для voice messages (`file_category === 'voice_message'`)
- Сортировка файлов: новые вверху
- Переключатель grid/list для фото, видео, голосовых
- Бейджи комментариев на превью изображений
- ImageViewer с комментариями при клике на изображение
- Редактирование изображений из галереи
- Улучшенная пагинация с сохранением позиции скролла

### Bug Fixes
- Optional chaining для `mediaData?.voice?.length`
- Hook initialization order
- Performance fix: ref вместо зависимости в useCallback
- Image error handling с placeholder fallback

### Archive
📄 `memory-bank/archive/archive-media-gallery-refactor.md`
📄 `memory-bank/reflection/reflection-media-gallery-refactor.md`

---

## ReTracker: Image Comments Figma-style — COMPLETED ✅

### Date: 2026-02-18

### Summary
Комментарии на изображениях в стиле Figma: кликабельные пины с координатами, resolve-статусы (как в Figma), polling каждые 2 сек для обновлений в реальном времени. Слоистая архитектура аннотаций для будущей редактируемости.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Created | 9 |
| Files Modified | 2 |
| Migrations Created | 2 |
| Lines Added | ~1200 |

### Components Created
- `ImageViewer.jsx` — полноэкранный просмотрщик с пинами комментариев
- `CommentPin.jsx` — маркер комментария на изображении
- `CommentPopover.jsx` — попап с деталями комментария и действиями
- `AnnotationRenderer.jsx` — рендер слоя аннотаций поверх изображения
- `ImageCommentBadge.jsx` — бейдж количества комментариев в чате

### Hooks Created
- `useImageComments.js` — CRUD + polling для комментариев на изображениях
- `useImageAnnotations.js` — CRUD для слоистых аннотаций

### Database Changes
- `031_image_comments.sql` — таблица image_comments с координатами и resolve-статусами
- `032_image_annotations.sql` — таблица image_annotations для хранения аннотаций как JSONB

### Key Features
- Клик на изображение в чате → открывает ImageViewer
- Режим добавления комментариев (кнопка "Комментарий")
- Пины с номерами (1, 2, 3...), resolved показываются галочкой
- Popover с редактированием, удалением, resolve/unresolve
- Фильтр resolved комментариев
- Бейдж количества комментариев на превью изображений в чате
- Polling каждые 2 сек когда viewer открыт

### Integration Points
- `CommentAttachments.jsx` — интегрирован ImageViewer для изображений
- ImageAttachment теперь показывает бейдж комментариев и открывает ImageViewer

---

## ReTracker: Voice Messages with Transcription — ARCHIVED ✅

### Date: 2026-02-17/18

### Summary
Голосовые сообщения в чате задач ReTracker: запись, воспроизведение (wavesurfer.js), транскрипция (OpenAI Whisper API), word-level timestamps, цитирование фрагментов.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Created | 9 |
| Files Modified | 8 |
| Debug Iterations | ~15 |
| Lines Added | ~2000 |

### Components Created
- `VoiceRecorder.jsx` — UI записи
- `VoiceMessagePlayer.jsx` — плеер с транскриптом
- `TranscriptDisplay.jsx` — кликабельные слова
- `VoiceQuoteSelector.jsx` — выбор фрагмента
- `VoiceQuote.jsx` — отображение цитаты

### Hooks Created
- `useVoiceRecorder.js` — MediaRecorder wrapper
- `useVoiceTranscripts.js` — CRUD транскриптов

### Database Changes
- `030_voice_messages.sql` — voice_transcripts table, file_category, voice_quote column in comments

### Edge Function
- `transcribe-audio/index.ts` — secure Whisper API calls

### Debug Fixes
- MediaRecorder timeslice removed (audio glitching)
- Edge Function refactored to direct REST API (RLS issues)
- `.single()` → `.maybeSingle()` (406 errors)
- DOM nesting fixed in formatText.jsx
- Voice quote prop chain fixed (TaskDetailModal → CommentThread → CommentItem)
- Input focus on reply/quote

### Archive Reference
📄 `memory-bank/archive/archive-voice-messages.md`
📄 `memory-bank/reflection/reflection-voice-messages.md`

---

## ReTracker: My Tasks Inline Creation — ARCHIVED ✅

### Date: 2026-02-17

### Summary
Inline-создание задач в "Моих задачах" с поддержкой задач без расположения (`board_id = NULL`), LocationPickerModal для назначения расположения, логирование изменений в Activity Log.

### Key Metrics
| Metric | Value |
|--------|-------|
| Files Created | 2 |
| Files Modified | 10 |
| Files Deleted | 1 |
| Debug Iterations | 5 |

### Components Created
- `LocationPickerModal.jsx` — модалка выбора расположения (Проект → Доска → Статус)

### Database Changes
- `029_tasks_nullable_board.sql` — nullable board_id/status_id + RLS policies

### Debug Fixes
- SQL: `creator_id` → `created_by`
- Mutation arg: `{ taskId }` → `taskId`
- Empty statuses: wrong property name
- Browser selects: created CustomSelect
- Cache invalidation: added all keys

### Archive Reference
📄 `memory-bank/archive/archive-mytasks-inline-creation.md`
📄 `memory-bank/reflection/reflection-mytasks-inline-creation.md`

---

## ReTracker: Board Header Redesign — ARCHIVED ✅

### Date: 2026-02-16

### Summary
Редизайн верхней панели доски в ReTracker: функциональный поиск задач с live-filtering и расширенными фильтрами, аватары участников проекта, кнопка избранного с optimistic update, плейсхолдеры для настроек и уведомлений.

### Key Metrics
| Metric | Value |
|--------|-------|
| Commits | 3 |
| Files Created | 7 |
| Lines Added | ~1600 |
| Debug Iterations | 1 (priority field fix) |

### Components Created
- `BoardHeader.jsx` — главный компонент панели
- `TaskSearchDropdown.jsx` — расширяющийся поиск (192px → 480px)
- `SearchFilters.jsx` — кастомные dropdown фильтры с галочками
- `MemberAvatars.jsx` — стек аватаров с "+N" overflow

### Hooks Created
- `useTaskSearch.js` — debounced поиск по title, description, comments
- `useFavoriteBoards.js` — toggle favorite с optimistic update

### Archive Reference
📄 `memory-bank/archive/archive-board-header-redesign.md`
📄 `memory-bank/reflection/reflection-board-header-redesign.md`

---

## ReTracker Chat Features — ARCHIVED ✅

### Date: 2026-02-14

### Summary
Масштабная сессия по разработке чата в ReTracker. 19 коммитов, 15+ фич: threads, polls, text formatting, media gallery, @mentions, task links (KAN-001), image annotation editor, scheduled messages, GIF search (GIPHY), sticker packs с pop-анимацией.

### Key Metrics
| Metric | Value |
|--------|-------|
| Commits | 19 |
| Files Created | ~25 |
| Lines Added | ~3500+ |
| User Iterations | 50+ |

### Archive Reference
📄 `memory-bank/archive/archive-retracker-chat-features.md`
📄 `memory-bank/reflection/reflection-retracker-chat-features.md`

---

## ReTracker Seed: Lucky Fruits Slot — ARCHIVED ✅

### Date: 2026-02-14

### Summary
20 тестовых задач по разработке слота Lucky Fruits. Node-скрипт (auth) + SQL seed. Исправлена ошибка PL/pgSQL в VALUES.

### Archive Reference
📄 `memory-bank/archive/archive-retracker-slot-seed.md`
📄 `memory-bank/reflection/reflection-retracker-slot-seed.md`

---

## ReTracker Performance Fix — ARCHIVED ✅

### Date: 2026-02-14

### Summary
Критический фикс медленной загрузки ReTracker: убран await перед fetchProfile в AuthContext. 11.3с → 0.97с (ускорение в 11 раз). Документация в systemPatterns.md, правило retracker-performance.mdc.

### Archive Reference
📄 `memory-bank/archive/archive-retracker-performance-fix.md`
📄 `memory-bank/reflection/reflection-retracker-performance-fix.md`

---

## Kanban Enhancements — ARCHIVED ✅

### Date: 2026-02-11

### Summary
Раскрывающийся чек-лист в TaskCard, кнопка "+" в колонках, редизайн CreateTaskModal под TaskDetailModal, чек-лист при создании задачи.

### Archive Reference
📄 `memory-bank/archive/archive-kanban-enhancements.md`
📄 `memory-bank/reflection/reflection-kanban-enhancements.md`

---

## Calculator Settings (PricingPage) Redesign v2 — ARCHIVED ✅

### Date: 2026-02-09

### Summary
Комплексный редизайн раздела "Calculator Settings" в админке: sidebar-layout, PairedCard (base + complexity/surcharge), ValueCard, Table view (категории как секции), редактируемые display_name, PairedEditModal. 14 итераций на основе фидбека пользователя.

### Key Changes
- `groupByItemId()` — группировка configs по item_id
- `PAIRED_CATEGORIES` — включая Concept Document
- `PairedEditModal` — редактирование пары в одном окне
- `SettingsTable` — табличный вид
- `viewMode` state — cards/table
- DB migration 053 — display_name field

### Files Modified
- `calculator/src/pages/admin/PricingPage.jsx`
- `calculator/src/hooks/usePricing.js`
- `calculator/src/hooks/useDynamicPricing.js`
- `calculator/supabase/migrations/053_dynamic_item_names.sql`

### Archive Reference
📄 `memory-bank/archive/archive-pricing-page-redesign.md`
📄 `memory-bank/reflection/reflection-pricing-page-redesign.md`

---

## User Card Redesign & Inline Editing — ARCHIVED ✅

### Date: 2026-02-09

### Summary
Редизайн Profile/Company табов в карточке юзера (AdminPanel). Инлайн-редактирование: Full Name, Phone, Role (профиль); Company Name, Phone, Country, Address (компания). Мутации: `useAdminUpdateProfile`, `useUpdateClient`. Кэш инвалидируется корректно.

### Files Modified
- `calculator/src/components/admin/UserDetailModal.jsx`
- `calculator/src/hooks/useUsers.js`
- `calculator/src/hooks/useClients.js`

### Archive Reference
📄 `memory-bank/archive/archive-user-card-inline-editing.md`
📄 `memory-bank/reflection/reflection-user-card-inline-editing.md`

---

## Notification Center — ARCHIVED ✅

### Date: 2026-02-09

### Summary
Полная система in-app уведомлений: 14 PostgreSQL триггеров, батчевые уведомления стадий через RPC, поллинг каждые 15 секунд, deep-linking в модалки проекта, карточный UI с фильтрами (All/Unread + Categories). Покрывает 3 роли: client, AM, admin. Сопутствующие фиксы: активация стадий с плейсхолдерами, z-index header'а, позиционирование иконки комментариев в TaskListRow.

### Completed Items

| Item | Status | Notes |
|------|--------|-------|
| DB: notifications table + 14 triggers | ✅ | 051_notification_center.sql |
| DB: stage batch RPC | ✅ | 052_fix_stage_notifications.sql (replaced per-row trigger) |
| DB: pg_cron cleanup (90 days) | ✅ | Удаление read notifications |
| Frontend: useNotifications hook | ✅ | Fetch, count, mark read, navigation, polling |
| UI: NotificationBell | ✅ | Badge count, dropdown toggle, immediate refetch on open |
| UI: NotificationDropdown | ✅ | Filters (read/category), separator, card list |
| UI: NotificationItem | ✅ | Card-style, rich content, emerald accents |
| Deep-linking: tasks/comments | ✅ | Query params → TaskDetailModal → CommentThread scroll |
| Deep-linking: offers/invoices/specs | ✅ | Query params → modals in ProjectPage |
| Stage fix: placeholder handling | ✅ | INSERT placeholders, UPDATE real stages |
| Stage fix: batch notifications | ✅ | Single consolidated notification for batch ops |
| Fix: supabase.rpc try/catch | ✅ | PostgrestBuilder ≠ Promise (.catch not supported) |
| UI: z-index header fix | ✅ | z-30 → z-40 (sidebar arrow overlap) |
| UI: comment icon in TaskListRow | ✅ | Moved to left, after checklist badge |
| UI: filter separation | ✅ | border-t divider between read/category chips |

### Files Created
- `calculator/supabase/migrations/051_notification_center.sql`
- `calculator/supabase/migrations/052_fix_stage_notifications.sql`
- `calculator/src/hooks/useNotifications.js`
- `calculator/src/components/notifications/NotificationBell.jsx`
- `calculator/src/components/notifications/NotificationDropdown.jsx`
- `calculator/src/components/notifications/NotificationItem.jsx`
- `calculator/src/components/notifications/index.js`

### Files Modified
- `calculator/src/components/layout/AppHeader.jsx`
- `calculator/src/hooks/useStages.js`
- `calculator/src/pages/projects/ProjectPage.jsx`
- `calculator/src/components/comments/CommentThread.jsx`
- `calculator/src/components/comments/CommentItem.jsx`
- `calculator/src/components/tasks/TaskDetailModal.jsx`
- `calculator/src/components/tasks/TaskListRow.jsx`

### Reflection Reference
📄 `memory-bank/reflection/reflection-notification-center.md`

---

## Task View Switcher — Kanban / List — ARCHIVED ✅

### Date: 2026-02-09

### Summary
Переключатель вида задач в проекте (Kanban / List). List view — Linear-style компактные строки с бейджами, группировка по статусам, сворачиваемые секции, drag-and-drop. Inline раскрытие чеклиста.

### Archive Reference
📄 `memory-bank/archive/archive-task-view-switcher.md`
📄 `memory-bank/reflection/reflection-task-view-switcher.md`

---

## Public Calculator + Dynamic Pricing — ARCHIVED ✅

### Date: 2026-02-08

### Summary
Динамические цены из Supabase вместо захардкоженных. Публичный калькулятор с анонимным доступом. Система кодов для шеринга подборок. Авто-claim при регистрации. Импорт кода для существующих пользователей.

### Archive Reference
📄 `memory-bank/archive/archive-public-calculator-dynamic-pricing.md`
📄 `memory-bank/reflection/reflection-public-calculator-dynamic-pricing.md`

---

## Concept Document — автозадача + сортировка по весам — ARCHIVED ✅

### Date: 2026-02-08

### Summary
Автоматическая задача Concept Document (шаблон + чеклист 10 пунктов + get_item_task_name). Система sort_order для управления порядком создания задач. Дефолтные веса по категориям калькулятора. UI в админке.

### Files Created
- `calculator/supabase/migrations/047_concept_document_task_template.sql`
- `calculator/supabase/migrations/048_task_sort_order.sql`

### Files Modified
- `calculator/src/hooks/useTaskSpecItemTemplates.js`
- `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx`

### Reflection Reference
📄 `memory-bank/reflection/reflection-concept-doc-task-and-sort-order.md`

---

## Concept Document в калькуляторе — ARCHIVED ✅

### Date: 2026-02-08

### Summary
Новая категория "Concept Document" в калькуляторе. Уникальная модель: $1000 + 1% от суммы остальных items. Флаговая архитектура. Двухпроходный расчёт. Оба калькулятора, спецификации, пресеты, админка.

### Completed Items

| Item | Status | Notes |
|------|--------|-------|
| Данные категории (categories.js) | ✅ | Флаги: noOrderType, noAnimation, noStyleCoeff, surchargePercent, maxQty, recommended, addonExcluded |
| Расчёты (useCalculator.js) | ✅ | Двухпроходный: regularItemsSum → surcharge items. Обновлены createInitialItemsState, updateItem, setAllOrderType, applyPreset, loadState |
| ItemRow UI | ✅ | Скрытие controls, maxQty ограничение, бейдж Recommended, surcharge "+" display |
| CategorySection headers | ✅ | Условное скрытие Type/Anim заголовков |
| SpecificationView | ✅ | Тире "—" вместо Art Only / None для noOrderType/noAnimation items |
| CalculatorPage addon filter | ✅ | Фильтрация addonExcluded items |
| CalculatorModal addon filter | ✅ | Аналогичная фильтрация |
| Пресеты | ✅ | concept_doc: 1 в Premium Flagship |
| Миграция БД | ✅ | 046_concept_document.sql (base + surcharge в price_configs) |
| Админка | ✅ | Категория Concept Document в CATEGORY_ICONS + CATEGORY_ORDER |

### Files Modified
- `calculator/src/data/categories.js`
- `calculator/src/hooks/useCalculator.js`
- `calculator/src/components/ItemRow.jsx`
- `calculator/src/components/CategorySection.jsx`
- `calculator/src/components/SpecificationView.jsx`
- `calculator/src/pages/calculator/CalculatorPage.jsx`
- `calculator/src/components/project/CalculatorModal.jsx`
- `calculator/src/data/presets.js`
- `calculator/src/pages/admin/PricingPage.jsx`

### Files Created
- `calculator/supabase/migrations/046_concept_document.sql`

### Reflection Reference
📄 `memory-bank/reflection/reflection-concept-document.md`

---

## Per-item Order Type (Art / Animation / Both) — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Переключатель типа заказа per-item (Art Only / Anim Only / Art+Anim). Глобальный дефолт. Колонка Type в спецификации. Фильтрация None для обязательной анимации.

### Completed Items

| Item | Status | Notes |
|------|--------|-------|
| Формула расчёта в useCalculator.js | ✅ | orderType в state, формула по типу, loadState/preset |
| Переключатель в ItemRow.jsx | ✅ | Сегментированные кнопки с цветами |
| Заголовки в CategorySection.jsx | ✅ | Добавлена колонка Type |
| SpecificationView.jsx | ✅ | Бейджи: нейтральный, синий, фиолетовый |
| Глобальный переключатель | ✅ | defaultOrderType + автоприменение при активации |
| Фильтрация None | ✅ | Убран для Art+Anim и Anim Only |
| Обратная совместимость | ✅ | Fallback 'art_and_anim' |

### Files Modified
- `calculator/src/hooks/useCalculator.js`
- `calculator/src/components/ItemRow.jsx`
- `calculator/src/components/CategorySection.jsx`
- `calculator/src/components/SpecificationView.jsx`
- `calculator/src/pages/calculator/CalculatorPage.jsx`
- `calculator/src/components/project/CalculatorModal.jsx`

### Archive Reference
📄 `memory-bank/archive/archive-per-item-order-type.md`
📄 `memory-bank/reflection/reflection-per-item-order-type.md`

---

## Specification Settings Inheritance — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Наследование Visual Style, Usage Rights, Payment Model из первой оплаченной спецификации проекта. Locked UI.

### Files Modified
- `calculator/src/hooks/useInheritedSettings.js` (new)
- `calculator/src/hooks/useMinimumOrder.js`
- `calculator/src/hooks/useSpecifications.js`
- `calculator/src/components/StyleSelector.jsx`
- `calculator/src/components/SettingsSection.jsx`
- `calculator/src/pages/calculator/CalculatorPage.jsx`
- `calculator/src/components/project/CalculatorModal.jsx`

---

## Minimum Order Amount — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Минимальная сумма заказа ($1000) для первого заказа в проекте. Админка: toggle + amount + message. Промо capping. Предупреждения в UI. Блокировка save.

### Archive Reference
📄 `memory-bank/archive/archive-minimum-order-amount.md`
📄 `memory-bank/reflection/reflection-minimum-order-amount.md`

---

## Project Resources Tab & UI Consistency — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Новая вкладка "Resources" в ProjectSidebar для внешних ссылок проекта. UI consistency fixes.

### Archive Reference
📄 `memory-bank/archive/archive-project-resources-tab.md`
📄 `memory-bank/reflection/reflection-project-resources-tab.md`

---

## Client Dashboard Activity — Audit Logs Integration — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Блок "Recent Activity" на клиентском дашборде переведён с синтетических данных на настоящие аудит-логи. UI обновлён до стиля админки. Блок сделан сворачиваемым.

### Completed Items

| Item | Status | Notes |
|------|--------|-------|
| useClientActivity → audit_logs | ✅ | 1 запрос вместо 4, фильтрация по user_id, исключение шума |
| ActivityItem admin-style | ✅ | Эмодзи, бейджи, humanized descriptions, кликабельные ссылки |
| Collapsible блок | ✅ | Свёрнут по умолчанию, счётчик, анимация шеврона |

### Files Modified
- `calculator/src/hooks/useClientActivity.js`
- `calculator/src/pages/dashboard/DashboardPage.jsx`

### Reflection Reference
📄 `memory-bank/reflection/reflection-client-dashboard-activity.md`

---

## Profile Improvements & Avatar System — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Полный редизайн профиля (все роли): загрузка аватара, sticky Save, кастомный Select, смена пароля, Danger Zone, доп. поля admin/AM. Аватары подтянуты во все компоненты приложения. Фикс роутинга профиля.

### Completed Items

| Item | Status | Notes |
|------|--------|-------|
| Миграция БД: phone, telegram, bio | ✅ | 042_profile_extra_fields.sql |
| AuthContext: 3 новые функции | ✅ | uploadAvatar, changePassword, deactivateAccount |
| ProfilePage: полный редизайн | ✅ | Аватар, sticky save, Select, пароль, danger zone |
| Фикс роутинга /profile | ✅ | Динамическая ссылка по роли в сайдбаре |
| AccountSwitcher: аватары и имена | ✅ | Кэш profile data в localStorage |
| CommentItem: аватары | ✅ | avatar_url из данных → UI |
| AuditLogsTable: аватары | ✅ | Десктоп + мобайл |
| AdminDashboard: аватары | ✅ | Recent Activity |

### Files Modified
- `calculator/src/contexts/AuthContext.jsx`
- `calculator/src/pages/profile/ProfilePage.jsx`
- `calculator/src/components/layout/AppSidebar.jsx`
- `calculator/src/components/admin/AccountSwitcher.jsx`
- `calculator/src/components/comments/CommentItem.jsx`
- `calculator/src/components/audit-logs/AuditLogsTable.jsx`
- `calculator/src/pages/admin/AdminDashboardPage.jsx`
- `calculator/src/hooks/useAuditLogs.js`

### Reflection Reference
📄 `memory-bank/reflection/reflection-profile-improvements.md`

---

## Promo Codes — Full Fix & Redesign — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Комплексное исправление системы промокодов: CRUD в админке, применение в калькуляторе, полный редизайн UI.

### Completed Items

| Item | Status | Notes |
|------|--------|-------|
| Bug: column name mismatch (5 полей) | ✅ | type→discount_type, value→discount_value, expires_at→valid_until и др. |
| Bug: discount_type value mapping | ✅ | percent (БД) ↔ percentage (UI) |
| Bug: калькулятор не использовал Supabase | ✅ | PromoSection переключён с hardcoded → useValidatePromoCode |
| Fix: поддержка fixed скидок в калькуляторе | ✅ | useCalculator.js — обработка обоих типов |
| Fix: `totals.discount` → `totals.discountAmount` | ✅ | CalculatorModal footer использовал несуществующее поле |
| UI: кликабельные строки таблицы | ✅ | Клик → модалка редактирования |
| UI: копирование кода промокода | ✅ | Клик на код → clipboard + "Copied!" фидбек |
| UI: toggle Active/Inactive в таблице | ✅ | Переключатель вместо бейджа |
| UI: иконка удаления + модалка подтверждения | ✅ | Корзина + DeleteConfirmModal |
| UI: редизайн модалки Create/Edit | ✅ | Секции, иконки, toggle, X-кнопка |
| UI: applied-state в PromoSection | ✅ | Зелёный блок с кодом и скидкой + Clear |
| UI: перечёркнутая цена при скидке | ✅ | Sidebar, MobileFooter, CalculatorModal |

### Files Modified
- `calculator/src/hooks/usePromoCodes.js`
- `calculator/src/pages/admin/PromoCodesPage.jsx`
- `calculator/src/components/PromoSection.jsx`
- `calculator/src/hooks/useCalculator.js`
- `calculator/src/components/Sidebar.jsx`
- `calculator/src/components/MobileFooter.jsx`
- `calculator/src/components/project/CalculatorModal.jsx`

### Reflection Reference
📄 `memory-bank/reflection/reflection-promo-codes-fix-and-ui.md`

---

## Sidebar Badge Color Fix — ARCHIVED ✅

### Date: 2026-02-07

### Summary
Цвет бейджа счётчика ожидающих инвойсов в сайдбаре: `bg-blue-500` → `bg-emerald-500`.

### Files Modified
- `calculator/src/components/layout/AppSidebar.jsx` — строка 225

---

## Audit Logs — Entity Names & Parent Context — ARCHIVED ✅

### Date: 2026-02-06

### Summary
Расширение аудит-логов: названия сущностей + родительский контекст + обогащение старых записей.

### Completed Items

| Item | Status | Notes |
|------|--------|-------|
| Humanize расширен на все поля metadata | ✅ | title, code, company_name, filename, currency, version |
| Delete-операции содержат названия | ✅ | 6 хуков: projects, specs, templates, promo, wallets, tasks |
| Parent context (project_name) | ✅ | specs, offers, tasks — все логируют project_name |
| Parent context (client_name) | ✅ | projects — логируют client_name |
| Enrichment старых записей | ✅ | enrichLogsWithParentNames — batch fetch при отображении |
| Дашборд обновлён | ✅ | Recent Activity — humanize + enrichment |
| Entity link с subtext | ✅ | AuditLogEntityLink показывает имя + контекст |

### Files Modified
- `calculator/src/lib/auditLog.js`
- `calculator/src/components/audit-logs/auditLogHumanize.js`
- `calculator/src/components/audit-logs/AuditLogEntityLink.jsx`
- `calculator/src/hooks/useAuditLogs.js`
- `calculator/src/hooks/useDashboard.js`
- `calculator/src/hooks/useProjects.js`
- `calculator/src/hooks/useSpecifications.js`
- `calculator/src/hooks/useOffers.js`
- `calculator/src/hooks/useTasks.js`
- `calculator/src/hooks/useOfferTemplates.js`
- `calculator/src/hooks/usePromoCodes.js`
- `calculator/src/hooks/useCryptoWallets.js`
- `calculator/src/pages/admin/AdminDashboardPage.jsx`

### Reflection Reference
📄 `memory-bank/reflection/reflection-audit-logs-entity-names.md`

---

## Offer Templates Admin Panel — ARCHIVED ✅

### Date: 2026-02-06

### Summary
Комплексная доработка раздела управления шаблонами оферт в админ-панели:
- Модалка настроек (описание + аудитория) вместо collapsible bar
- Удаление validity_days из UI (оферты бессрочные)
- Inline user picker для назначения аудитории (вместо dropdown)
- Grid layout top bar (центрирование Edit/Preview toggle)
- Preview — LegalDocument + подсветка переменных зелёным (HighlightText)
- Bold/Italic сквозь всю цепочку (TipTap → plain text → preview → client)
- Sticky подсказки по форматированию в редакторе
- Автоверсионирование YYYY.MM.DD HH:mm при Save

### Files Modified
- `calculator/src/pages/admin/OfferTemplateEditorPage.jsx`
- `calculator/src/pages/admin/OfferTemplatesPage.jsx`
- `calculator/src/hooks/useOfferTemplates.js`
- `calculator/src/components/admin/offer-templates/OfferPreview.jsx`
- `calculator/src/components/admin/offer-templates/OfferTemplateEditor.jsx`
- `calculator/src/components/offers/LegalTextModal.jsx`

### Archive Reference
📄 `memory-bank/archive/archive-offer-templates-admin.md`
📄 `memory-bank/reflection/reflection-offer-templates-admin.md`

---

## Terms & Conditions Modal Redesign — ARCHIVED ✅

### Date: 2026-02-06

### Summary
Полный редизайн отображения Terms & Conditions в офертах:
- Заменён инлайн-блок с прокруткой на кнопку + большую модалку
- Парсер текста превращает плоский текст оферты в стилизованный документ (секции, буллеты, подпункты)
- Обновлена модалка принятия оферты с тем же стилем
- Кнопки Print в обеих модалках

### Files Created
- `calculator/src/components/offers/LegalTextModal.jsx` — модалка + LegalDocument + parseLegalText

### Files Modified
- `calculator/src/components/offers/AcceptOfferModal.jsx` — полный редизайн
- `calculator/src/pages/offers/OfferDetailPage.jsx` — кнопка вместо инлайна
- `calculator/src/components/project/OfferModal.jsx` — кнопка вместо `<details>`
- `calculator/src/components/offers/index.js` — экспорты
- `calculator/src/lib/printUtils.js` — generic printElement(), printLegalText()

### Reflection Reference
📄 `memory-bank/reflection/reflection-terms-conditions-modal.md`

---

## Projects & Invoices UI Improvements — ARCHIVED ✅

### Date: 2026-02-05

### Summary
Комплексное улучшение UI/UX страницы проектов и инвойсов:
- Фильтрация инвойсов по клиенту, проекту и спецификации
- Редизайн карточек и таблиц проектов (переключатель вида, статистика)
- Inline редактирование названия и описания проекта
- Создание переиспользуемого компонента InlineEdit

### Files Created
- `calculator/src/components/InlineEdit.jsx` — переиспользуемый компонент inline редактирования

### Files Modified
- `calculator/src/pages/projects/ProjectsPage.jsx` — редизайн карточек и таблиц
- `calculator/src/pages/invoices/InvoicesPage.jsx` — фильтры
- `calculator/src/hooks/useProjects.js` — расширенные запросы для counts
- `calculator/src/components/project/ProjectHeader.jsx` — InlineEdit для названия

### Archive Reference
📄 `memory-bank/archive/archive-projects-ui-improvements.md`
📄 `memory-bank/reflection/reflection-projects-ui-improvements.md`

---

## Multiple Specifications Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
Исправлен критический баг: при дозаказе работ в проекте задачи не создавались для новых спецификаций. Функция `auto_create_tasks_on_first_payment()` проверяла "есть ли задачи в проекте" вместо "есть ли задачи для ЭТОЙ спецификации".

### Solution
- Добавлено поле `source_specification_id` в таблицу `tasks`
- Изменена логика проверки триггера на per-specification
- Исправлено отображение спецификации в `TaskDetailModal.jsx`
- Добавлена инвалидация кеша `['project-offers']`

### Files Modified
- `calculator/supabase/migrations/036_fix_tasks_for_multiple_specifications.sql` — миграция БД
- `calculator/src/components/tasks/TaskDetailModal.jsx` — логика определения спецификации
- `calculator/src/hooks/useInvoices.js` — инвалидация project-offers

### Archive Reference
📄 `memory-bank/archive/archive-multiple-specifications-fix.md`
📄 `memory-bank/reflection/reflection-multiple-specifications-fix.md`

---

## Kanban Drag Card Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
Исправлен визуальный баг: при перетаскивании карточки задачи в Task Board она растягивалась на всю ширину. Ghost-элемент терял CSS-контекст родительской колонки.

### Solution
- Ghost получает фиксированные размеры через `getBoundingClientRect()`
- Off-screen позиционирование (`position: fixed; top: -1000px`)
- Центрирование drag image относительно курсора

### Files Modified
- `calculator/src/components/tasks/KanbanBoard.jsx` — функция `handleDragStart()`

### Archive Reference
📄 `memory-bank/archive/archive-kanban-drag-card-fix.md`
📄 `memory-bank/reflection/reflection-kanban-drag-card-fix.md`

---

## Auto Task Names Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
Комплексное исправление системы автоматического создания задач при первой оплате проекта:
- Названия задач не соответствовали калькулятору (сырые item_id)
- Триггер не обрабатывал проекты в статусе 'draft'
- UI не обновлялся после подтверждения платежа
- Лишние UI элементы (Initialize Stages, связь со спецификацией)

### Solution
- Обновлена функция `get_item_task_name()` с правильными названиями из `categories.js`
- Обновлён триггер `auto_create_tasks_on_first_payment()` (добавлен 'draft', создание стадий)
- Добавлена инвалидация кэша `['tasks']` и `['stages']` в `useConfirmPayment`
- Удалены лишние UI элементы

### Files Modified
- `calculator/src/hooks/useInvoices.js` — инвалидация кэша tasks/stages
- `calculator/src/hooks/useProjects.js` — инвалидация при удалении
- `calculator/src/pages/projects/ProjectPage.jsx` — удалена плашка Initialize Stages
- `calculator/src/components/tasks/TaskDetailModal.jsx` — удалена секция связи
- `calculator/src/components/tasks/TaskCard.jsx` — удалены бейджи spec_item
- `calculator/supabase/migrations/028_fix_item_names_from_calculator.sql` — миграция

### Archive Reference
📄 `memory-bank/archive/archive-auto-task-names-fix.md`
📄 `memory-bank/reflection/reflection-auto-task-names-fix.md`

---

## Account Switcher Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
При переключении аккаунтов через AccountSwitcher профиль не обновлялся. Root cause — пропуск `SIGNED_IN` event препятствовал вызову `fetchProfile()` для нового пользователя.

### Solution
- Явный вызов `setUser()` и `fetchProfile()` в функции `signIn()` после успешной авторизации
- `force=true` для обхода кеша localStorage

### Files Modified
- `calculator/src/contexts/AuthContext.jsx` — добавлен явный вызов fetchProfile в signIn
- `calculator/src/components/admin/AccountSwitcher.jsx` — исправлен warning про вложенные кнопки
- `memory-bank/systemPatterns.md` — добавлена документация паттерна

### Archive Reference
📄 `memory-bank/archive/archive-account-switcher-fix.md`

---

## Auth Hanging Fix — ARCHIVED ✅

### Date: 2026-02-04

### Summary
Критический баг: приложение зависало при перезагрузке страницы. Root cause — Supabase Auth event `SIGNED_IN` срабатывает до готовности токена, запросы к базе зависали.

### Solution
- Пропуск `SIGNED_IN` event, обработка только `INITIAL_SESSION`
- Таймаут 3 секунды на запрос профиля
- Кэширование профиля в localStorage

### Files Modified
- `calculator/src/contexts/AuthContext.jsx` — основной фикс

### Archive Reference
📄 `memory-bank/archive/archive-auth-hanging-fix.md`

---

## Admin Dashboard & Users Page Improvements — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Dashboard & Users Fixes
| Item | Status | Notes |
|------|--------|-------|
| Fix invoice revenue display in dashboard | ✅ | Исправлено использование amount_usd вместо total_amount |
| Fix revenue display in Users page | ✅ | Добавлен расчет выручки для каждого пользователя |
| Improve Users table UX | ✅ | Добавлены клики на колонки для открытия разных вкладок |
| Add last_login_at tracking | ✅ | Добавлено поле и логика обновления при входе |
| Improve UserDetailModal Projects tab | ✅ | Добавлена информация о спецификациях, инвойсах, workflow |
| Fix UserDetailModal size | ✅ | Установлен фиксированный размер карточки |

### Files Created
- `calculator/supabase/migrations/026_add_last_login_at_to_profiles.sql` - Добавлено поле last_login_at

### Files Modified
- `calculator/src/hooks/useDashboard.js` - Исправлено использование amount_usd
- `calculator/src/hooks/useUsers.js` - Исправлено использование amount_usd, добавлен расчет выручки
- `calculator/src/hooks/useClientActivity.js` - Исправлено использование amount_usd
- `calculator/src/components/admin/UsersTable.jsx` - Добавлены клики на колонки
- `calculator/src/components/admin/UserDetailModal.jsx` - Фиксированный размер, улучшена вкладка Projects
- `calculator/src/pages/admin/UsersPage.jsx` - Обновлена логика открытия модальных окон
- `calculator/src/contexts/AuthContext.jsx` - Добавлена логика обновления last_login_at
- `calculator/src/lib/utils.js` - Добавлена функция formatDateTime

### Archive Reference
📄 `memory-bank/archive/archive-admin-dashboard-users-improvements.md`

---

## Task Spec Item Templates Management — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Task Templates Management System
| Item | Status | Notes |
|------|--------|-------|
| Task spec item templates table | ✅ | Таблица для управления шаблонами задач из спецификации |
| Template editing UI | ✅ | UI для редактирования всех шаблонов в админке |
| Checklist support in templates | ✅ | Возможность задавать чеклисты для шаблонов |
| Auto-create templates for all items | ✅ | Автоматическое создание шаблонов для всех пунктов калькулятора |
| Auto-create templates for new items | ✅ | Автоматическое создание шаблонов для новых пунктов при использовании |
| Task-spec connection display | ✅ | Отображение связи задач с пунктами спецификации в UI |
| Checklist access control | ✅ | Просмотр для всех, редактирование только для админа и AM |

### Files Created
- `calculator/supabase/migrations/018_task_spec_item_templates.sql` - Таблица шаблонов
- `calculator/supabase/migrations/019_update_task_creation_with_spec_templates.sql` - Обновление функции создания задач
- `calculator/supabase/migrations/020_update_checklist_policies_for_clients.sql` - RLS политики для чеклистов
- `calculator/supabase/migrations/021_add_checklist_to_task_templates.sql` - Поле checklist_items
- `calculator/supabase/migrations/022_update_task_creation_with_checklists.sql` - Создание чеклистов из шаблонов
- `calculator/supabase/migrations/023_create_all_spec_item_templates.sql` - Автоматическое создание шаблонов для всех пунктов
- `calculator/supabase/migrations/024_auto_create_template_for_new_items.sql` - Автоматическое создание для новых пунктов
- `calculator/supabase/migrations/025_update_get_item_task_name.sql` - Обновление функции get_item_task_name
- `calculator/src/hooks/useTaskSpecItemTemplates.js` - Хук для работы с шаблонами
- `calculator/src/components/admin/TemplateChecklistEditor.jsx` - Компонент для редактирования чеклистов

### Files Modified
- `calculator/src/pages/admin/TaskAutoCreationSettingsPage.jsx` - Добавлена секция управления шаблонами
- `calculator/src/components/tasks/TaskCard.jsx` - Добавлены бейджи связи со спецификацией
- `calculator/src/components/tasks/TaskDetailModal.jsx` - Добавлена информация о связи, контроль доступа к чеклистам
- `calculator/src/components/tasks/TaskChecklist.jsx` - Добавлен prop canEdit для контроля доступа

### Archive Reference
📄 `memory-bank/archive/archive-task-spec-item-templates-management.md`

---

## Project Stages Management & Offers Filtering — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Stage Management System
| Item | Status | Notes |
|------|--------|-------|
| Stage activation with cascade | ✅ | Активация всех предыдущих pending этапов |
| Stage deactivation with cascade | ✅ | Деактивация всех последующих активных этапов |
| Confirmation modal | ✅ | Модальное окно с отображением затронутых этапов |
| Role-based access | ✅ | Только админы и AM могут управлять этапами |
| Visual feedback | ✅ | Зеленый для активации, красный для деактивации |

#### Offers Filtering System
| Item | Status | Notes |
|------|--------|-------|
| Client filter component | ✅ | Компонент с поиском в реальном времени |
| Admin/AM offers view | ✅ | Отображение всех офферов для админов/AM |
| Client offers view | ✅ | Клиенты видят только свои офферы |
| AM route | ✅ | Добавлен маршрут `/am/offers` для AM |
| Search functionality | ✅ | Поиск клиентов по имени |

### Files Created
- `calculator/src/components/project/StageChangeModal.jsx` - Модальное окно подтверждения смены этапа
- `calculator/src/components/offers/ClientFilter.jsx` - Компонент фильтра клиентов с поиском

### Files Modified
- `calculator/src/hooks/useStages.js` - Добавлены функции каскадной активации/деактивации
- `calculator/src/hooks/useOffers.js` - Добавлена функция `useAllOffers()` для админов/AM
- `calculator/src/components/project/ProjectStages.jsx` - Добавлена логика клика для админов/AM
- `calculator/src/pages/projects/ProjectPage.jsx` - Интеграция модального окна
- `calculator/src/pages/offers/OffersPage.jsx` - Добавлена фильтрация по клиентам
- `calculator/src/App.jsx` - Добавлен маршрут `/am/offers`
- `calculator/src/components/layout/AppSidebar.jsx` - Добавлена ссылка "Offers" для AM
- `calculator/src/components/offers/index.js` - Добавлены экспорты новых компонентов

### Archive Reference
📄 `memory-bank/archive/archive-project-stages-management-offers-filtering.md`

---

## Invoice Rejection Logic Improvement — ARCHIVED ✅

### Date: 2026-02-03

### Completed Items

#### Invoice Rejection Logic Update
| Item | Status | Notes |
|------|--------|-------|
| Simplified rejection flow | ✅ | Always return to pending with comment |
| Removed "Reject Permanently" option | ✅ | Single "Return to Pending" option |
| Client comment display | ✅ | Yellow warning block in InvoiceModal |
| Admin comment display | ✅ | Neutral info block in InvoiceModal |
| Visual indicator in InvoiceCard | ✅ | "Needs correction" badge |
| Removed "Rejected" section | ✅ | Status no longer used |

### Files Modified
- `calculator/src/hooks/useInvoices.js` - Simplified `useRejectPayment` hook
- `calculator/src/components/project/InvoiceModal.jsx` - Updated rejection form and comment display
- `calculator/src/pages/invoices/InvoicesPage.jsx` - Removed "Rejected" section
- `calculator/src/components/invoices/InvoiceCard.jsx` - Added visual indicator

### Archive Reference
📄 `memory-bank/archive/archive-invoice-rejection-improvement.md`

---

## Payment Confirmation Flow — ARCHIVED ✅

### Date: 2026-02-02

### Completed Items

#### Payment Confirmation System
| Item | Status | Notes |
|------|--------|-------|
| Database Migration (rejected status) | ✅ | `009_invoice_rejection.sql` |
| RLS Policies for staff | ✅ | Staff can update invoice status |
| usePendingConfirmationsCount hook | ✅ | Badge count for admin/AM |
| useConfirmPayment hook | ✅ | Confirm payment flow |
| useRejectPayment hook | ✅ | Reject payment with reason |
| InvoiceModal admin UI | ✅ | Confirm/Reject buttons |
| AppSidebar badge | ✅ | Pending confirmations indicator |
| InvoicesPage status grouping | ✅ | Awaiting/Rejected sections |

#### Bug Fixes
| Item | Status | Notes |
|------|--------|-------|
| Client display in admin invoices | ✅ | Nested selects for client data |
| Invoice status categorization | ✅ | Fixed awaiting_confirmation grouping |
| Modal overlay (React Portals) | ✅ | Fixed "line of light" issue |
| Project deletion cascade | ✅ | Safe deletion helpers |
| Admin offer acceptance | ✅ | Disabled for admin role |

### Files Created
- `calculator/supabase/migrations/009_invoice_rejection.sql`
- `calculator/supabase/migrations/010_admin_delete_all.sql`

### Files Modified
- `calculator/src/hooks/useInvoices.js` - Payment confirmation hooks
- `calculator/src/components/project/InvoiceModal.jsx` - Admin confirmation UI
- `calculator/src/components/layout/AppSidebar.jsx` - Badge indicator
- `calculator/src/pages/invoices/InvoicesPage.jsx` - Status grouping
- `calculator/src/components/invoices/InvoiceCard.jsx` - Client display
- `calculator/src/components/project/OfferModal.jsx` - Admin restriction
- `calculator/src/lib/invoiceUtils.js` - Rejected status support
- `calculator/src/hooks/useProjects.js` - Safe project deletion
- Multiple modal components - React Portals fix

### Archive Reference
📄 `memory-bank/archive/archive-payment-confirmation-flow.md`

---

## Phase 2: Calculator Integration — COMPLETE

### Date: 2026-02-01

### Completed Items

#### 2.1 State Management
| Item | Status | Notes |
|------|--------|-------|
| calculatorStore.js | ✅ | Zustand with persistence |
| useProjects.js | ✅ | CRUD hooks with React Query |
| useSpecifications.js | ✅ | CRUD + finalize + version |
| useAutoSave.js | ✅ | Debounced auto-save |

#### 2.2 Projects Flow
| Item | Status | Notes |
|------|--------|-------|
| CreateProjectModal | ✅ | Modal for new project |
| ProjectCard | ✅ | Card component |
| ProjectsPage | ✅ | List with empty state |
| ProjectDetailPage | ✅ | Detail + specs list |

#### 2.3 Specifications Flow
| Item | Status | Notes |
|------|--------|-------|
| SpecificationCard | ✅ | Version, status, actions |
| FinalizeConfirmModal | ✅ | Confirmation with warning |
| SpecificationDetailPage | ✅ | Full detail view + finalize |

#### 2.4 Calculator Enhancement
| Item | Status | Notes |
|------|--------|-------|
| ProjectSelector | ✅ | Dropdown with create |
| SaveDraftButton | ✅ | Save or create project |
| DraftStatusBadge | ✅ | Status indicator |
| CalculatorPage | ✅ | Integration complete |
| Router | ✅ | New routes added |

### Build Status
```
✓ npm run build — SUCCESS
✓ 181 modules transformed
✓ 575KB bundle (gzip: 157KB)
```

### Files Created

```
src/
├── stores/
│   └── calculatorStore.js          ← Zustand store
│
├── hooks/
│   ├── useProjects.js              ← Projects CRUD
│   ├── useSpecifications.js        ← Specifications CRUD
│   └── useAutoSave.js              ← Auto-save hook
│
├── components/
│   ├── projects/
│   │   ├── CreateProjectModal.jsx
│   │   ├── ProjectCard.jsx
│   │   └── index.js
│   │
│   ├── specifications/
│   │   ├── SpecificationCard.jsx
│   │   ├── FinalizeConfirmModal.jsx
│   │   └── index.js
│   │
│   └── calculator/
│       ├── ProjectSelector.jsx
│       ├── DraftStatusBadge.jsx
│       ├── SaveDraftButton.jsx
│       └── index.js
│
├── pages/
│   ├── projects/
│   │   ├── ProjectsPage.jsx
│   │   └── ProjectDetailPage.jsx
│   │
│   └── specifications/
│       └── SpecificationDetailPage.jsx
│
└── App.jsx (updated routes)
```

### User Flow (Phase 2)

```
Dashboard → Projects (list)
                ↓
         New Project (modal)
                ↓
Calculator → Select Project → Save Draft
                ↓
         Specification saved
                ↓
Project Detail → Specifications list
                ↓
         Specification Detail
                ↓
         Finalize (modal) → Locked
```

---

## Phase 1: Foundation — COMPLETE

(см. предыдущий progress log)

---

### Next Phase

**Phase 3: Offers & Invoices**
- Offer generation from finalized specification
- Legal acceptance flow
- Invoice generation
- Payment tracking
