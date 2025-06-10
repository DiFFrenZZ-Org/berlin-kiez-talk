
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  user_role: 'seller' | 'buyer';
  borough: string | null;
  subscription_tier: 'basic' | 'pro' | 'premium' | null;
  subscription_active: boolean | null;
  verified_local: boolean | null;
  reputation_score: number | null;
  is_super_admin?: boolean;
}

// Auth state cleanup utility
const cleanupAuthState = () => {
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (
    supabaseUser: User,
    meta: { nickname?: string; user_role?: 'seller' | 'buyer' | 'super_admin'; borough?: string } = {}
  ) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', supabaseUser.id)
        .single();

      if (!data) {
        // Check if this user should be a super admin
        const isAdmin = supabaseUser.email === 'turquinjl@gmail.com';
        
        await supabase.from('profiles').insert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          nickname: meta.nickname ?? (isAdmin ? 'SuperAdmin' : null),
          user_role: isAdmin ? 'super_admin' : (meta.user_role ?? 'buyer'),
          borough: meta.borough ?? (isAdmin ? 'Berlin' : null),
        });
      }
    } catch (err) {
      console.error('ensureProfile error:', err);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Defer profile fetching to prevent deadlocks
        setTimeout(() => {
          fetchProfile(session.user.id, session.user);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, supabaseUser?: User) => {
    try {
      console.log('Fetching profile for user:', userId);

      // First get the user profile
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      if (!profileData && supabaseUser) {
        await ensureProfile(supabaseUser, {
          nickname: supabaseUser.user_metadata?.nickname,
          user_role: supabaseUser.user_metadata?.user_role,
          borough: supabaseUser.user_metadata?.borough,
        });

        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        profileData = data as any;
      }

      // Check if user is super admin
      const { data: isSuperAdmin, error: superAdminError } = await supabase
        .rpc('is_super_admin', { user_id: userId });

      if (superAdminError) {
        console.error('Super admin check error:', superAdminError);
      }

      const enrichedProfile: UserProfile = {
        ...profileData,
        is_super_admin: isSuperAdmin || false
      };

      console.log('Profile fetched successfully:', enrichedProfile);
      setProfile(enrichedProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: {
    nickname: string;
    user_role: 'seller' | 'buyer';
    borough?: string;
  }) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out during signup failed (expected):', err);
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      console.log('Sign up result:', data, error);
      if (data.user && !error) {
        await ensureProfile(data.user, userData);
      }
      return { data, error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        console.log('Sign out during signin failed (expected):', err);
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Sign in result:', data, error);

      if (data.user && !error) {
        await ensureProfile(data.user);
        // Force page reload for clean state
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }

      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Clean up auth state
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      // Force page reload for clean state
      window.location.href = '/';
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  return {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };
};
