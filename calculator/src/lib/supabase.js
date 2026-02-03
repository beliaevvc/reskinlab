import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// #region agent log
const __agentShortUrl = (url) => {
  try {
    const u = new URL(url);
    return `${u.pathname}${u.search || ''}`;
  } catch {
    return String(url);
  }
};

const __agentFetch = (url, options = {}) => {
  const shortUrl = __agentShortUrl(url);
  const method = options?.method || 'GET';
  const hasSignal = !!options?.signal;
  const signalAborted = !!options?.signal?.aborted;

  fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'S1',
      location: 'supabase.js:globalFetch:start',
      message: 'fetch start',
      data: { shortUrl, method, hasSignal, signalAborted },
      timestamp: Date.now(),
    }),
  }).catch(() => {});

  return fetch(url, options)
    .then((res) => {
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'S1',
          location: 'supabase.js:globalFetch:ok',
          message: 'fetch ok',
          data: { shortUrl, status: res.status },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      return res;
    })
    .catch((err) => {
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'S1',
          location: 'supabase.js:globalFetch:error',
          message: 'fetch error',
          data: { shortUrl, name: err?.name || null, message: err?.message || String(err) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      throw err;
    });
};
// #endregion

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase environment variables. Please check .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    // Настройки Realtime
    realtime: {
      params: {
        eventsPerSecond: 1,
      },
    },
    global: {
      fetch: __agentFetch,
    },
  }
);

// КРИТИЧЕСКИ ВАЖНО: Отключаем Realtime - он блокирует HTTP запросы при перезагрузке
supabase.realtime.disconnect();

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseAnonKey.includes('placeholder')
  );
};
