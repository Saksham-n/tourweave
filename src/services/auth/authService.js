import { supabase } from '../../config/supabase';

/**
 * Register a new user with email, password, and display name.
 * @param {string} email 
 * @param {string} password 
 * @param {string} displayName 
 * @returns {Promise<{ user: any, error: any }>}
 */
export const registerWithEmail = async (email, password, displayName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  return { user: data?.user, error };
};

/**
 * Login an existing user with email and password.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{ user: any, session: any, error: any }>}
 */
export const loginWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data?.user, session: data?.session, error };
};

/**
 * Logout the current user.
 * @returns {Promise<{ error: any }>}
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Get the currently logged-in user.
 * @returns {Promise<{ user: any, error: any }>}
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

/**
 * Login with Google OAuth.
 * @returns {Promise<{ error: any }>}
 */
export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    }
  });

  return { error };
};

/**
 * Send a Magic Link OTP to the provided email address.
 * @param {string} email 
 * @returns {Promise<{ error: any }>}
 */
export const loginWithMagicLink = async (email) => {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    }
  });

  return { error };
};
