'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { MiniMap } from '@/components/ui/minimap';
import { useToast } from '@/components/ui/toast';
import { useLanguage } from '@/context/LanguageContext';
import type { Complaint } from '@/types/complaint';

interface Worker {
  user_id: string;
  department: string;
  is_available: boolean;
  users_profile: {
    full_name: string | null;
    display_name: string | null;
  } | null;
}

interface AssignWorkerModalProps {
  complaint: Complaint;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export function AssignWorkerModal({ complaint, isOpen, onClose, onAssigned }: AssignWorkerModalProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function fetchWorkers() {
      setIsLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from('workers')
          .select(`user_id, department, is_available, users_profile:user_id ( full_name, display_name )`);

        if (complaint.ai_suggested_department) {
          query = query.eq('department', complaint.ai_suggested_department);
        }

        const { data, error } = await query;
        if (error) throw error;
        setWorkers((data as unknown as Worker[]) ?? []);
      } catch {
        toast('Failed to load workers', 'error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkers();
  }, [isOpen, complaint.ai_suggested_department, toast]);

  if (!isOpen) return null;

  async function handleAssign() {
    if (!selectedWorkerId) {
      toast('Please select a worker', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: selectedWorkerId }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Assignment failed');
      
      toast('Worker assigned successfully', 'success');
      onAssigned();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Assignment failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#001e40]/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#191c1e]">{t('assign_worker')}</h2>
          <button onClick={onClose} className="p-1 text-[#737780] hover:text-[#191c1e] rounded-md transition-colors">
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto">
          {complaint.latitude && complaint.longitude && (
            <div className="mb-4">
              <MiniMap lat={complaint.latitude} lng={complaint.longitude} className="h-28" />
              {complaint.address && (
                <p className="text-xs text-[#545f72] mt-1.5 px-1 truncate">
                  <span className="material-symbols-outlined text-[10px] align-middle mr-1">location_on</span>
                  {complaint.address}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-[#545f72] mb-4">{t('select_worker_desc')} ({complaint.ai_suggested_department ?? 'Any'})</p>

          {isLoading ? (
            <div className="py-8 flex justify-center"><Spinner size="md" /></div>
          ) : workers.length === 0 ? (
            <div className="text-center py-6 text-sm text-[#737780]">{t('no_workers_found')}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {workers.map((w) => {
                const name = w.users_profile?.full_name ?? w.users_profile?.display_name ?? 'Unknown Worker';
                return (
                  <label key={w.user_id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedWorkerId === w.user_id ? 'border-[#001e40] bg-[#f7f9fb]' : 'border-[#E2E8F0] hover:border-[#001e40]/50'}`}>
                    <input type="radio" name="worker" value={w.user_id} checked={selectedWorkerId === w.user_id} onChange={() => setSelectedWorkerId(w.user_id)} className="mt-1" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#191c1e]">{name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${w.is_available ? 'bg-[#059669]' : 'bg-[#D97706]'}`} />
                        <span className="text-xs text-[#545f72]">{w.is_available ? t('available') : t('busy')}</span>
                        <span className="text-xs text-[#c3c6d1]">•</span>
                        <span className="text-xs text-[#545f72]">{w.department}</span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3 bg-[#f7f9fb]">
          <button onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-[#545f72] hover:text-[#191c1e]">{t('cancel')}</button>
          <Button onClick={handleAssign} isLoading={isSubmitting} disabled={!selectedWorkerId || isLoading}>{t('assign')}</Button>
        </div>
      </div>
    </div>
  );
}
