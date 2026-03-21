import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch and merge the custom Postgres Role into our base Supabase user object
  const hydrateUserRole = async (baseUser) => {
    if (!baseUser) return null;
    try {
      const { data } = await supabase.from('profiles').select('role').eq('id', baseUser.id).single();
      return { ...baseUser, role: data?.role || 'user' };
    } catch (err) {
      return { ...baseUser, role: 'user' };
    }
  };

  useEffect(() => {
    // 1. Get initial session on mount
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) console.error('Error getting session:', error);
      setSession(session);
      const hydratedUser = await hydrateUserRole(session?.user);
      setUser(hydratedUser);
      setLoading(false);
    });

    // 2. Listen to auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const hydratedUser = await hydrateUserRole(session?.user);
      setUser(hydratedUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};
