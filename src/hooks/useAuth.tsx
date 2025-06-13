import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  id: string;
  email: string;
  nickname: string | null;
  user_role: "seller" | "buyer" | "super_admin";
  borough: string | null;
  subscription_tier: "basic" | "pro" | "premium" | null;
  subscription_active: boolean | null;
  verified_local: boolean | null;
  reputation_score: number | null;
  is_super_admin?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Auth-state cleanup utility                                                */
/* -------------------------------------------------------------------------- */

const cleanupAuthState = () => {
  Object.keys(localStorage).forEach((k) => {
    if (k.startsWith("supabase.auth.") || k.includes("sb-")) localStorage.removeItem(k);
  });
  Object.keys(sessionStorage).forEach((k) => {
    if (k.startsWith("supabase.auth.") || k.includes("sb-")) sessionStorage.removeItem(k);
  });
};

/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* -------------------------- ensureProfile helper ------------------------ */
  const ensureProfile = useCallback(
    async (
      supabaseUser: User,
      meta: {
        nickname?: string;
        user_role?: "seller" | "buyer" | "super_admin";
        borough?: string;
      } = {}
    ) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", supabaseUser.id)
          .single();

        if (!data) {
          const isAdmin = supabaseUser.email === "turquinjl@gmail.com";
          await supabase.from("profiles").insert({
            id: supabaseUser.id,
            email: supabaseUser.email,
            nickname: meta.nickname ?? (isAdmin ? "SuperAdmin" : null),
            user_role: isAdmin ? "super_admin" : meta.user_role ?? "buyer",
            borough: meta.borough ?? (isAdmin ? "Berlin" : null),
          });
        }
      } catch (err) {
        console.error("ensureProfile error:", err);
      }
    },
    []
  );

  /* ----------------------------- fetchProfile ---------------------------- */
  const fetchProfile = useCallback(
    async (userId: string, supabaseUser?: User) => {
      try {
        const {
          data: profileDataRaw,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        let profileData = profileDataRaw as UserProfile | null;

        if (profileError) throw profileError;

        if (!profileData && supabaseUser) {
          await ensureProfile(supabaseUser, {
            nickname: supabaseUser.user_metadata?.nickname,
            user_role: supabaseUser.user_metadata?.user_role,
            borough: supabaseUser.user_metadata?.borough,
          });

          const { data } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          profileData = data as UserProfile;
        }

        const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
          user_id: userId,
        });

        setProfile({
          ...profileData,
          is_super_admin: isSuperAdmin ?? false,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    },
    [ensureProfile]
  );

  /* ------------------------------ on mount -------------------------------- */
  useEffect(() => {
    /* auth listener */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_evt, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id, session.user);
        else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    /* load existing session */
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id, session.user);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  /* ------------------------------- API ----------------------------------- */
  const signUp = async (
    email: string,
    password: string,
    userData: { nickname: string; user_role: "seller" | "buyer"; borough?: string }
  ) => {
    cleanupAuthState();
    await supabase.auth.signOut({ scope: "global" }).catch(() => {});

    const redirect = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirect, data: userData },
    });

    if (data.user && !error) await ensureProfile(data.user, userData);
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    cleanupAuthState();
    await supabase.auth.signOut({ scope: "global" }).catch(() => {});

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user && !error) await ensureProfile(data.user);

    /* hard reload for a clean state */
    if (!error) setTimeout(() => (window.location.href = "/"), 100);
    return { data, error };
  };

  const signOut = async () => {
    cleanupAuthState();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/";
    return { error };
  };

  return { user, profile, loading, signUp, signIn, signOut };
};
