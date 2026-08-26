import { createBrowserClient } from '@supabase/ssr';

// Assumption: @supabase/ssr v0.5+ — createBrowserClient is the correct API
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
