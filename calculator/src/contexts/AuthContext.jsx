import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { logAuthEvent } from '../lib/auditLog';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileIsReal, setProfileIsReal] = useState(false); // true = from DB, false = fallback
  const fetchingRef = useRef(false);
  // Use sessionStorage to persist previousUserId across remounts (SPA navigation)
  const previousUserIdRef = useRef(sessionStorage.getItem('auth_previous_user_id') || null);
  const isInitialLoadRef = useRef(true);
  const fetchProfileRef = useRef(null); // Stable ref for fetchProfile
  
  // Helper to update previousUserId in both ref and sessionStorage
  const setPreviousUserId = (userId) => {
    previousUserIdRef.current = userId;
    if (userId) {
      sessionStorage.setItem('auth_previous_user_id', userId);
    } else {
      sessionStorage.removeItem('auth_previous_user_id');
    }
  };

  // Debug: test is_admin via RPC
  const debugAuth = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('debug_auth');
      console.log('🔐 DEBUG AUTH:', data, error);
      return data;
    } catch (e) {
      console.error('Debug auth failed:', e);
    }
  }, []);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId) => {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:fetchProfile:entry',message:'fetchProfile called',data:{userId,fetchingRefCurrent:fetchingRef.current,profileIsReal,profileId:profile?.id,profileRole:profile?.role},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    // Prevent duplicate fetches
    if (fetchingRef.current) {
      console.log('Profile fetch already in progress, skipping');
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:fetchProfile:skip-fetching',message:'SKIPPED: fetchingRef is true',data:{userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Only skip if we have a REAL profile (from DB, not fallback) for this user
    if (profileIsReal && profile?.id === userId) {
      console.log('Real profile already loaded, skipping fetch. Role:', profile.role);
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:fetchProfile:skip-profileIsReal',message:'SKIPPED: profileIsReal',data:{userId,profileId:profile?.id,profileRole:profile?.role},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    fetchingRef.current = true;
    console.log('Fetching profile for user:', userId);
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:fetchProfile:beforeQuery',message:'About to query profiles table',data:{userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:fetchProfile:afterQuery',message:'Query completed',data:{userId,hasData:!!data,hasError:!!error,errorMsg:error?.message||null},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      console.log('Profile query result:', { data, error });

      if (error || !data) {
        console.warn('Profile error or not found:', error?.message);
        // NEVER downgrade from admin/am to client on error
        setProfile(prev => {
          if (prev?.role === 'admin' || prev?.role === 'am') {
            console.log('⚠️ Keeping existing staff role despite error');
            return prev;
          }
          return prev || { id: userId, role: 'client', email: '' };
        });
        setProfileLoaded(true);
        fetchingRef.current = false;
        return;
      }
      
      console.log('✅ Profile loaded from DB:', data.role);
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:fetchProfile:success',message:'Profile loaded from DB',data:{userId,role:data.role,email:data.email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
      // #endregion
      setProfile(data);
      setProfileLoaded(true);
      setProfileIsReal(true);
      fetchingRef.current = false; // ВАЖНО: сбрасываем флаг после успеха

      // Debug: check RLS functions (non-blocking)
      debugAuth().catch(() => {});

      // Try to fetch client record (non-blocking)
      if (data?.role === 'client') {
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .single()
          .then(({ data: clientData }) => {
            if (clientData) {
              console.log('Client loaded:', clientData);
              setClient(clientData);
            }
          })
          .catch(() => console.warn('Client fetch failed'));
      }
    } catch (err) {
      console.error('Profile fetch failed:', err.message || err.name);
      // Если таймаут или отмена — всё равно продолжаем работу
      // NEVER downgrade from admin/am to client on error
      setProfile(prev => {
        if (prev?.role === 'admin' || prev?.role === 'am') {
          console.log('⚠️ Keeping existing staff role despite error');
          return prev;
        }
        return prev || { id: userId, role: 'client', email: '' };
      });
      setProfileLoaded(true);
    }
    
    fetchingRef.current = false;
    console.log('fetchProfile completed');
  }, [debugAuth, profile, profileIsReal]);

  // Keep ref updated with latest fetchProfile
  fetchProfileRef.current = fetchProfile;

  // Initialize auth state - runs ONCE on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.log('Supabase not configured, skipping auth');
      setLoading(false);
      return;
    }

    let isMounted = true;
    let initialSessionHandled = false;
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:useEffect:start',message:'Auth useEffect started',data:{isMounted},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
    // #endregion

    // Handler for processing session
    const handleSession = async (session, source) => {
      if (!isMounted) {
        console.log('Component unmounted, ignoring session from', source);
        return;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:handleSession',message:'Processing session',data:{source,hasSession:!!session,userId:session?.user?.id||null,initialSessionHandled,previousUserId:previousUserIdRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      const currentUserId = session?.user?.id || null;
      
      // FIX: Don't reset user state if INITIAL_SESSION comes empty but we had a valid user before
      // This happens when React remounts AuthProvider during SPA navigation
      if (!session?.user && source.includes('INITIAL_SESSION') && previousUserIdRef.current) {
        console.log('⚠️ INITIAL_SESSION with empty session but had previous user, skipping reset');
        // #region agent log
        fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:handleSession:skipEmptyInitial',message:'Skipping empty INITIAL_SESSION - had previous user',data:{source,previousUserId:previousUserIdRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'J'})}).catch(()=>{});
        // #endregion
        setLoading(false);
        return;
      }
      
      setUser(session?.user ?? null);

      if (session?.user) {
        // FIRST: Immediately load from cache to prevent role flicker and allow app to work
        const cached = localStorage.getItem(`profile_${session.user.id}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            console.log('⚡ Optimistically loaded profile from cache, role:', parsed.role);
            setProfile(parsed);
            setProfileLoaded(true);
            setProfileIsReal(true);
          } catch (e) { /* ignore parse errors */ }
        }
        
        // Set previousUserId immediately
        setPreviousUserId(currentUserId);

        // THEN: Fetch fresh profile from DB in background (NO TIMEOUT - let it complete)
        fetchProfileRef.current(session.user.id).catch((err) => {
          console.error('fetchProfile failed in handleSession:', err);
          // #region agent log
          fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:handleSession:fetchError',message:'fetchProfile error',data:{source,error:err?.message||String(err)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'I'})}).catch(()=>{});
          // #endregion
          fetchingRef.current = false;
          // Only set fallback if we don't have a cached profile
          setProfile(prev => {
            if (prev && prev.role && prev.role !== 'client') return prev; // Keep cached admin/am
            // Try cache one more time
            const c = localStorage.getItem(`profile_${currentUserId}`);
            if (c) {
              try { return JSON.parse(c); } catch (e) { /* ignore */ }
            }
            return prev || { id: currentUserId, role: 'client', email: '' };
          });
          setProfileLoaded(true);
        });
      } else {
        setProfile(null);
        setClient(null);
        setProfileLoaded(false);
        setProfileIsReal(false);
        setPreviousUserId(null);
      }

      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:handleSession:complete',message:'Session handled, setting loading=false',data:{source,hasUser:!!session?.user},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      setLoading(false);
    };

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, 'userId:', session?.user?.id);
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:onAuthStateChange',message:'Auth state change received',data:{event,hasSession:!!session,userId:session?.user?.id||null,isMounted,initialSessionHandled},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      if (!isMounted) return;
      
      // Mark that we got initial session from subscription
      if (event === 'INITIAL_SESSION') {
        initialSessionHandled = true;
        await handleSession(session, 'onAuthStateChange:INITIAL_SESSION');
        return;
      }
      
      // Handle other events (SIGNED_IN, SIGNED_OUT, etc.)
      const currentUserId = session?.user?.id || null;
      const userIdChanged = previousUserIdRef.current !== null && 
                           previousUserIdRef.current !== currentUserId &&
                           currentUserId !== null;

      // Update last_login_at on explicit sign in or account switch
      if (session?.user) {
        const shouldUpdateLoginTime = (event === 'SIGNED_IN' && !isInitialLoadRef.current) || userIdChanged;
        if (shouldUpdateLoginTime) {
          try {
            await supabase
              .from('profiles')
              .update({ last_login_at: new Date().toISOString() })
              .eq('id', currentUserId);
            console.log('✅ Updated last_login_at for user:', currentUserId);
          } catch (e) {
            console.warn('Failed to update last_login_at:', e);
          }
        }
      }

      await handleSession(session, `onAuthStateChange:${event}`);
      
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
    });

    // Also call getSession() as fallback - Supabase may not fire INITIAL_SESSION on re-subscribe
    // This handles React Strict Mode where component unmounts/remounts
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:getSession',message:'getSession result',data:{hasSession:!!session,userId:session?.user?.id||null,error:error?.message||null,initialSessionHandled,isMounted},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      
      if (error) {
        console.error('getSession error:', error);
        if (isMounted) setLoading(false);
        return;
      }
      
      // Only process if INITIAL_SESSION wasn't already handled
      if (!initialSessionHandled && isMounted) {
        console.log('getSession fallback: processing session');
        handleSession(session, 'getSession:fallback');
      }
    }).catch(err => {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'A1',location:'AuthContext.jsx:getSession:catch',message:'getSession promise rejected',data:{name:err?.name||null,message:err?.message||String(err)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      console.error('getSession failed:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      // #region agent log
      fetch('http://127.0.0.1:7245/ingest/5fb3caf2-696c-4b24-a47d-721efc0dce43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.jsx:useEffect:cleanup',message:'Cleanup called',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      isMounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount - fetchProfile accessed via stable ref

  // Sign up with email and password
  const signUp = async ({ email, password, fullName }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'client',
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Sign in with email and password
  const signIn = async ({ email, password }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last_login_at in profiles table
      if (data.user?.id) {
        try {
          await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (e) {
          console.warn('Failed to update last_login_at:', e);
        }
      }

      // Log successful login
      try {
        await logAuthEvent('login', data.user?.id);
      } catch (e) {
        console.warn('Failed to log auth event:', e);
      }

      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Sign out
  const signOut = async () => {
    setError(null);
    try {
      // Log logout before clearing user
      const currentUserId = user?.id;
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Log logout event
      try {
        await logAuthEvent('logout', currentUserId);
      } catch (e) {
        console.warn('Failed to log auth event:', e);
      }

      setUser(null);
      setProfile(null);
      setClient(null);
      setProfileLoaded(false);
      setProfileIsReal(false);
      return { error: null };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Update client record
  const updateClient = async (updates) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setClient(data);
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  // Debug log role changes
  if (profile?.role) {
    console.log('Current role:', profile.role, '| isStaff:', profile.role === 'am' || profile.role === 'admin');
  }

  const value = {
    // State
    user,
    profile,
    client,
    loading,
    error,
    profileLoaded,

    // Computed roles
    isAuthenticated: !!user,
    isClient: profile?.role === 'client',
    isAM: profile?.role === 'am',
    isAdmin: profile?.role === 'admin',
    isStaff: profile?.role === 'am' || profile?.role === 'admin',
    isConfigured: isSupabaseConfigured(),

    // Actions
    signUp,
    signIn,
    signOut,
    updateProfile,
    updateClient,
    refreshProfile,
    debugAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export default AuthContext;
