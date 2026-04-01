# TASK ARCHIVE: Voice Messages with Transcription

## METADATA
- **Task ID:** voice-messages
- **Date Started:** 2026-02-17
- **Date Completed:** 2026-02-18
- **Complexity Level:** 3-4
- **Commit:** `7cb2688`

---

## SUMMARY

Реализована полноценная система голосовых сообщений в чате задач ReTracker:
- Запись голоса через MediaRecorder API
- Воспроизведение через wavesurfer.js с визуализацией waveform
- Транскрипция через OpenAI Whisper API (Supabase Edge Function)
- Word-level timestamps с кликабельными словами
- Цитирование фрагментов голосового с таймкодами

---

## REQUIREMENTS

### Functional
1. Запись голосовых сообщений в комментариях
2. Воспроизведение с waveform визуализацией
3. Транскрипция по кнопке "Расшифровать"
4. Синхронизированный текст с подсветкой текущего слова
5. Выбор фрагмента на waveform и ответ на него
6. Отображение цитаты голосового в ответе

### Non-Functional
- Использовать существующий OpenAI API key пользователя
- Хранить аудио в Supabase Storage
- Не создавать новые файлы при цитировании — только таймкоды

---

## IMPLEMENTATION

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  VoiceRecorder  │────▶│  Supabase        │────▶│  AudioWavePlayer│
│  (MediaRecorder)│     │  Storage         │     │  (wavesurfer.js)│
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │  Edge Function   │────▶│  OpenAI Whisper │
                        │  transcribe-audio│     │  API            │
                        └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  voice_transcripts│
                        │  (PostgreSQL)    │
                        └──────────────────┘
```

### Database Schema

```sql
-- New table
CREATE TABLE voice_transcripts (
  id UUID PRIMARY KEY,
  file_id UUID REFERENCES task_files(id),
  text TEXT NOT NULL,
  words JSONB,  -- [{word, start, end}, ...]
  language TEXT,
  duration_seconds NUMERIC,
  status TEXT,  -- pending, processing, completed, failed
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Modified tables
ALTER TABLE task_files ADD COLUMN file_category TEXT DEFAULT 'attachment';
ALTER TABLE comments ADD COLUMN voice_quote JSONB;
-- voice_quote: {file_id, start, end, text}
```

### Components Created

| Component | Purpose |
|-----------|---------|
| `VoiceRecorder.jsx` | Recording UI with timer, send/cancel |
| `VoiceMessagePlayer.jsx` | Playback with transcript display |
| `TranscriptDisplay.jsx` | Clickable words with current-word highlight |
| `VoiceQuoteSelector.jsx` | Region selection modal |
| `VoiceQuote.jsx` | Quote display in comment with playback |

### Hooks Created

| Hook | Purpose |
|------|---------|
| `useVoiceRecorder.js` | MediaRecorder API wrapper, blob handling |
| `useVoiceTranscripts.js` | CRUD for transcripts, transcribe mutation |

### Edge Function

`supabase/functions/transcribe-audio/index.ts`:
- Receives `file_id`, `path`, `bucket`, `filename` from frontend
- Downloads audio via direct Storage REST API
- Creates pending transcript record via REST API
- Calls OpenAI Whisper API with `verbose_json` + `word` timestamps
- Updates transcript with results

---

## KEY DECISIONS

### 1. Direct REST API in Edge Function
**Why:** Supabase JS client inside Edge Functions has issues with RLS even with service_role.  
**Solution:** Use direct `fetch()` with service_role_key for Storage and DB operations.

### 2. No timeslice in MediaRecorder
**Why:** `timeslice` parameter creates fragmented WebM that glitches during playback.  
**Solution:** Record as single blob without timeslice.

### 3. Store only timestamps for quotes
**Why:** Avoid duplicating audio files.  
**Solution:** `voice_quote` stores `{file_id, start, end, text}` — playback seeks to original file.

### 4. Unified visual style
**Why:** Voice messages looked different from regular audio.  
**Solution:** Same container, header with mic icon + "Голосовое сообщение".

---

## DEBUG FIXES

| Issue | Solution |
|-------|----------|
| Audio looping/glitching | Removed `timeslice` from `mediaRecorder.start()` |
| 403 on Edge Function | Disabled JWT verification in Supabase Dashboard |
| `task_files` permission denied | Refactored to pass metadata from frontend |
| 406 on empty transcript | Changed `.single()` to `.maybeSingle()` |
| DOM nesting warnings | Changed `<p>` to `<div>` in formatText.jsx |
| Quote not working | Added prop chain: TaskDetailModal → CommentThread → CommentItem |
| No focus on reply | Added `focus()` method to CommentInput ref |

---

## TESTING

### Manual Testing Performed
- [x] Record voice message → uploads correctly
- [x] Playback with waveform → no glitches
- [x] Transcribe button → calls Edge Function
- [x] Transcript with word timestamps → words are clickable
- [x] Select region → shows text for selection
- [x] Send reply with quote → quote saved to DB
- [x] Quote playback → plays only selected fragment
- [x] Click quote → scrolls to original message
- [x] Reply focus → input gets focus

---

## FILES

### Created
```
retracker/src/components/comments/VoiceRecorder.jsx
retracker/src/components/comments/VoiceMessagePlayer.jsx
retracker/src/components/comments/TranscriptDisplay.jsx
retracker/src/components/comments/VoiceQuoteSelector.jsx
retracker/src/components/comments/VoiceQuote.jsx
retracker/src/hooks/useVoiceRecorder.js
retracker/src/hooks/useVoiceTranscripts.js
retracker/supabase/functions/transcribe-audio/index.ts
retracker/supabase/migrations/030_voice_messages.sql
```

### Modified
```
retracker/src/components/comments/CommentInput.jsx
retracker/src/components/comments/CommentAttachments.jsx
retracker/src/components/comments/CommentItem.jsx
retracker/src/components/comments/CommentThread.jsx
retracker/src/components/comments/AudioWavePlayer.jsx
retracker/src/components/tasks/TaskDetailModal.jsx
retracker/src/hooks/useComments.js
retracker/src/utils/formatText.jsx
```

---

## LESSONS LEARNED

1. **Supabase Edge Functions + RLS** — prefer direct REST API with service_role for server-side ops
2. **MediaRecorder timeslice** — don't use for single-file recordings
3. **React Query `.single()` vs `.maybeSingle()`** — use latter for optional data
4. **Deep prop drilling** — document the chain, consider context for complex cases

---

## REFERENCES

- **Reflection:** `memory-bank/reflection/reflection-voice-messages.md`
- **Migration:** `retracker/supabase/migrations/030_voice_messages.sql`
- **Edge Function:** `retracker/supabase/functions/transcribe-audio/index.ts`
- **OpenAI Whisper API:** https://platform.openai.com/docs/guides/speech-to-text

---

## METRICS

| Metric | Value |
|--------|-------|
| Files Created | 9 |
| Files Modified | 8 |
| Debug Iterations | ~15 |
| Lines Added | ~2000 |
