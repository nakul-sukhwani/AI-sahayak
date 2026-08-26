'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Complaint } from '@/types/complaint';

interface UseWorkerAssignmentsReturn {
  assignments: Complaint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWorkerAssignments(): UseWorkerAssignmentsReturn {
  const [assignments, setAssignments] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
        .eq('assigned_to', user.id)
        .in('status', ['assigned', 'in_progress', 'proof_submitted'])
        .order('assigned_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAssignments((data as Complaint[]) ?? []);
    } catch {
      setError('Failed to load assignments. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { assignments, isLoading, error, refetch: fetch };
}
