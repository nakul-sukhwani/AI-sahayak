'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Complaint } from '@/types/complaint';

interface UseComplaintsReturn {
  complaints: Complaint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useComplaints(): UseComplaintsReturn {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setComplaints((data as Complaint[]) ?? []);
    } catch {
      setError('Failed to load complaints. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { complaints, isLoading, error, refetch: fetchComplaints };
}
