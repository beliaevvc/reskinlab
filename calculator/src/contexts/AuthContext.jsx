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
  
  const mountedRef = useRef(true);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId, force = false) => {
    if (!userId) return null;
    
    try {
      // Try cache first for instant UI
      if (!force) {
        try {
          const cached = localStorage.getItem(`profile_${userId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (mountedRef.current) {
              setProfile(parsed);
              setProfileLoaded(true);
            }
          }
        } catch (e) { /* ignore */ }
      }

      // Query with timeout to prevent hanging
      let data = null;
      let profileError = null;
      
      try {
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Profile query timeout')), 3000)
        );
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        data = result.data;
        profileError = result.error;
      } catch (timeoutErr) {
        console.warn('[Auth] Profile query timeout, using cached data');
        // If we have cached profile, just return - it's already set
        if (mountedRef.current) {
          setProfileLoaded(true);
        }
        return null;
      }

      if (!mountedRef.current) return null;

      if (profileError || !data) {
        console.warn('Profile fetch error:', profileError?.message);
        setProfile(prev => {
          if (prev?.role === 'admin' || prev?.role === 'am') return prev;
          return prev || { id: userId, role: 'client', email: '' };
        });
        setProfileLoaded(true);
        return null;
      }
      
      // Cache profile
      try {
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
      } catch (e) { /* ignore */ }
      
      setProfile(data);
      setProfileLoaded(true);

      // Fetch client record if role is client (non-blocking)
      if (data?.role === 'client') {
        supabase
          .from('clients')
          .select('*')
          .eq('user_id', userId)
          .single()
          .then(({ data: clientData }) => {
            if (clientData && mountedRef.current) {
              setClient(clientData);
            }
          })
          .catch(() => {});
      }
      
      return data;
    } catch (err) {
      console.error('Profile fetch failed:', err.message);
      if (mountedRef.current) {
        setProfile(prev => prev || { id: userId, role: 'client', email: '' });
        setProfileLoaded(true);
      }
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;
    let initialized = false;

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      
      // SIGNED_IN event causes hanging queries - skip profile fetch for this event
      // Profile is loaded explicitly in signIn() function instead
      if (event === 'SIGNED_IN') {
        // Just set user from session, don't fetch profile here
        if (session?.user) {
          setUser(session.user);
        }
        return;
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed');
        return;
      }
      
      // Handle session for INITIAL_SESSION and SIGNED_OUT
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setClient(null);
        setProfileLoaded(false);
      }

      if (mountedRef.current && !initialized) {
        initialized = true;
        setLoading(false);
        console.log('[Auth] Initialization completed via onAuthStateChange');
      }
    });

    // Get initial session as backup
    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (!mountedRef.current || initialized) return;
        
        console.log('[Auth] getSession:', session?.user?.id || 'no user');
        
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchProfile(currentUser.id);
        }

        if (mountedRef.current && !initialized) {
          initialized = true;
          setLoading(false);
          console.log('[Auth] Initialization completed via getSession');
        }
      })
      .catch((err) => {
        console.error('[Auth] getSession error:', err);
        if (mountedRef.current && !initialized) {
          initialized = true;
          setLoading(false);
        }
      });

    // Safety timeout
    const timeout = setTimeout(() => {
      if (mountedRef.current && !initialized) {
        console.warn('[Auth] Safety timeout - forcing loading=false');
        initialized = true;
        setLoading(false);
      }
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up
  const signUp = async ({ email, password, fullName }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: 'client' },
        },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Sign in
  const signIn = async ({ email, password }) => {
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Explicitly update user and fetch profile after successful sign in
      // This is needed because SIGNED_IN event is skipped to prevent hanging queries
      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id, true); // force=true to bypass cache
      }

      // Log successful login
      try {
        await logAuthEvent('login', data.user?.id);
      } catch (e) { /* ignore */ }

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
      const currentUserId = user?.id;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Log logout
      try {
        await logAuthEvent('logout', currentUserId);
      } catch (e) { /* ignore */ }

      // Clear localStorage cache
      if (currentUserId) {
        try {
          localStorage.removeItem(`profile_${currentUserId}`);
        } catch (e) { /* ignore */ }
      }

      setUser(null);
      setProfile(null);
      setClient(null);
      setProfileLoaded(false);
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
      try {
        localStorage.setItem(`profile_${user.id}`, JSON.stringify(data));
      } catch (e) { /* ignore */ }
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

  // Refresh profile
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, true);
    }
  };

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
