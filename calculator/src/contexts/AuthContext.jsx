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
  
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId) => {
    if (!userId || fetchingRef.current) return;
    
    fetchingRef.current = true;
    
    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!mountedRef.current) return;

      if (profileError || !data) {
        console.warn('Profile fetch error:', profileError?.message);
        // Keep existing profile if we have one with staff role
        setProfile(prev => {
          if (prev?.role === 'admin' || prev?.role === 'am') return prev;
          return prev || { id: userId, role: 'client', email: '' };
        });
        setProfileLoaded(true);
        return;
      }
      
      // Cache profile in localStorage for optimistic loading
      try {
        localStorage.setItem(`profile_${userId}`, JSON.stringify(data));
      } catch (e) { /* ignore storage errors */ }
      
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
    } catch (err) {
      console.error('Profile fetch failed:', err.message);
      if (mountedRef.current) {
        setProfile(prev => prev || { id: userId, role: 'client', email: '' });
        setProfileLoaded(true);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    mountedRef.current = true;

    // Handle session changes
    const handleSession = async (session) => {
      if (!mountedRef.current) return;
      
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Try optimistic load from cache first
        try {
          const cached = localStorage.getItem(`profile_${currentUser.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            setProfile(parsed);
            setProfileLoaded(true);
          }
        } catch (e) { /* ignore */ }
        
        // Then fetch fresh profile
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setClient(null);
        setProfileLoaded(false);
      }

      setLoading(false);
    };

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Update last_login_at
        try {
          await supabase
            .from('profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', session.user.id);
        } catch (e) { /* ignore */ }
      }
      
      await handleSession(session);
    });

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session } }) => handleSession(session))
      .catch((err) => {
        console.error('getSession error:', err);
        if (mountedRef.current) setLoading(false);
      });

    return () => {
      mountedRef.current = false;
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
      // Update cache
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
      fetchingRef.current = false; // Allow re-fetch
      await fetchProfile(user.id);
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
