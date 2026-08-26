'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import type { UserRole } from '@/types/user';

interface UseAuthReturn {
  user: ReturnType<typeof useSupabase>['user'];
  profile: ReturnType<typeof useSupabase>['profile'];
  role: UserRole | null;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<string | null>;
  verifyOtp: (phone: string, token: string) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const ROLE_REDIRECTS: Record<UserRole, string> = {
  citizen: '/dashboard',
  worker: '/worker',
  supervisor: '/supervisor',
  officer: '/supervisor/verify',
  admin: '/admin',
};

export function useAuth(): UseAuthReturn {
  const { supabase, user, profile, isLoading } = useSupabase();
  const router = useRouter();
  const [_pending, setPending] = useState(false); // tracks in-flight calls

  async function sendOtp(phone: string): Promise<string | null> {
    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: 'sms' },
      });
      if (error) return 'Failed to send OTP. Please try again.';
      return null;
    } catch {
      return 'Something went wrong. Please try again.';
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(phone: string, token: string): Promise<string | null> {
    setPending(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) return 'Invalid OTP. Please try again.';

      // Role-based redirect
      if (data.user) {
        const { data: profileData } = await supabase
          .from('users_profile')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = (profileData?.role as UserRole) ?? 'citizen';
        router.push(ROLE_REDIRECTS[role]);
        router.refresh();
      }
      return null;
    } catch {
      return 'Something went wrong. Please try again.';
    } finally {
      setPending(false);
    }
  }



  async function signInWithGoogle(): Promise<string | null> {
    setPending(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) return error.message;
      return null; // Redirect happens automatically
    } catch {
      return 'Something went wrong. Please try again.';
    } finally {
      setPending(false);
    }
  }

  async function signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      // Sign out failure is non-critical — redirect anyway
      router.push('/login');
    }
  }

  return {
    user,
    profile,
    role: (profile?.role as UserRole) ?? null,
    isLoading,
    sendOtp,
    verifyOtp,
    signInWithGoogle,
    signOut,
  };
}
