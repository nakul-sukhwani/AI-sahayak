'use client';

import { useState } from 'react';
import type { Complaint } from '@/types/complaint';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { AssignWorkerModal } from '@/components/supervisor/AssignWorkerModal';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/context/LanguageContext';

interface AssignmentQueueProps {
  initialComplaints: Complaint[];
}

export function AssignmentQueue({ initialComplaints }: AssignmentQueueProps) {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  function handleAssigned() {
    if (selectedComplaint) {
      setComplaints((prev) => prev.filter((c) => c.id !== selectedComplaint.id));
      setSelectedComplaint(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">
          {t('assignment_queue')}
        </h1>
        <p className="text-sm text-[#545f72] mt-1">
          {t('select_worker_desc')}
        </p>
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-2xl p-6">
          <span className="material-symbols-outlined text-5xl text-[#c3c6d1]">assignment_turned_in</span>
          <p className="text-base font-medium text-[#191c1e] mt-3">{t('queue_empty')}</p>
          <p className="text-sm text-[#545f72] mt-1">{t('all_complaints_assigned')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map((c) => (
            <div key={c.id} className="relative group">
              <ComplaintCard complaint={c} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" onClick={() => setSelectedComplaint(c)}>
                  {t('assign')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedComplaint && (
        <AssignWorkerModal
          complaint={selectedComplaint}
          isOpen={true}
          onClose={() => setSelectedComplaint(null)}
          onAssigned={handleAssigned}
        />
      )}
    </div>
  );
}
