'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user';

interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | null>(null);

export function useSupabase(): SupabaseContextType {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error('useSupabase must be used within SupabaseProvider');
  return ctx;
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchProfile(user.id);
      else setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (nextUser) fetchProfile(nextUser.id);
        else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data as UserProfile);
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SupabaseContext.Provider value={{ supabase, user, profile, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}
