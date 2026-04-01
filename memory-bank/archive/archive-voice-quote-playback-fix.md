# TASK ARCHIVE: Voice Quote Playback Fix

## METADATA
| Field | Value |
|-------|-------|
| Task ID | voice-quote-playback-fix |
| Date | 2026-02-18 |
| Complexity | Level 1 (Bug Fix) |
| Status | ✅ COMPLETED |
| Reflection | `memory-bank/reflection/reflection-voice-quote-playback-fix.md` |

---

## SUMMARY

Исправлен критический баг в компоненте `VoiceQuote.jsx`: цитаты голосовых сообщений перестали воспроизводиться после оптимизаций загрузки ассетов. Debug-режим с runtime логами позволил быстро локализовать две связанные проблемы.

---

## PROBLEM

После оптимизации загрузки голосовых сообщений и изображений (batched queries, prefetching) возникла регрессия:
- При клике на play в VoiceQuote звук не воспроизводился
- UI показывал "playing", но аудио не играло
- Логи показывали ошибку `AbortError: play() was interrupted by pause()`

---

## ROOT CAUSE

### Bug 1: Conditional Audio Element Rendering
```jsx
// ПРОБЛЕМА: элемент пересоздаётся при изменении audioUrl
{audioUrl && <audio ref={audioRef} src={audioUrl} />}
```
- При изменении `audioUrl` React удалял и создавал новый `<audio>` элемент
- Event listeners (`timeupdate`, `ended`) терялись
- Ref указывал на несуществующий или новый элемент

### Bug 2: Premature State Update
```jsx
// ПРОБЛЕМА: состояние менялось до начала воспроизведения
audio.play()
setIsPlaying(true) // Выполняется сразу, не дожидаясь play()
```
- `audio.play()` в современных браузерах возвращает Promise
- При быстром повторном клике `pause()` вызывался до завершения `play()`
- Браузер отклонял Promise с `AbortError`

---

## SOLUTION

### Fix 1: Always Render Audio Element
```jsx
// ИСПРАВЛЕНИЕ: элемент всегда существует
<audio ref={audioRef} src={audioUrl || ''} preload="metadata" />
```

### Fix 2: Handle play() Promise
```jsx
// ИСПРАВЛЕНИЕ: состояние меняется только после успешного play()
const playPromise = audio.play()
if (playPromise !== undefined) {
  playPromise.then(() => {
    setIsPlaying(true)
  }).catch(() => {
    setIsPlaying(false)
  })
} else {
  setIsPlaying(true)
}
```

---

## FILES MODIFIED

| File | Changes |
|------|---------|
| `retracker/src/components/comments/VoiceQuote.jsx` | Audio element always rendered; play() Promise handling |

---

## VERIFICATION

Debug logs подтвердили исправление:

**До исправления (строка 79):**
```json
{"message":"Play FAILED","data":{"error":"The play() request was interrupted by a call to pause()"}}
```

**После исправления (строка 80):**
```json
{"message":"Play started successfully","data":{"currentTime":1.534543}}
```

**Полный цикл воспроизведения (строки 81-93):**
- `timeUpdate` события с `currentTime` от 1.70 до 4.62
- `Stopping at end` когда `currentTime >= voiceQuote.end`

---

## LESSONS LEARNED

1. **Conditional Rendering + Refs** — опасная комбинация; для элементов с refs лучше всегда рендерить и менять props
2. **audio.play() is async** — всегда обрабатывать Promise для корректного управления состоянием
3. **Debug Mode Value** — runtime логи эффективнее статического анализа для медиа-багов

---

## RELATED CONTEXT

Этот баг возник после оптимизации загрузки в той же debug-сессии:
- Batched queries для file metadata
- Prefetched signed URLs
- Оптимизации ускорили загрузку, но изменили timing получения `audioUrl`

---

## INSTRUMENTATION REMOVED

Все debug логи удалены из:
- `VoiceQuote.jsx`
- `CommentAttachments.jsx`
- `AudioWavePlayer.jsx`
- `VoiceMessagePlayer.jsx`
- `useVoiceTranscripts.js`

---

## METRICS

| Metric | Value |
|--------|-------|
| Debug Iterations | 2 |
| Time to Fix | ~15 min |
| Lines Changed | ~10 |
| Files Modified | 1 |
