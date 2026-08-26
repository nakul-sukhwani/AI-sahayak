'use client';

import { useState } from 'react';
import type { Complaint } from '@/types/complaint';
import { ComplaintCard } from '@/components/complaints/ComplaintCard';
import { AssignWorkerModal } from '@/components/supervisor/AssignWorkerModal';
import { Button } from '@/components/ui/Button';

interface AssignmentQueueProps {
  initialComplaints: Complaint[];
}

export function AssignmentQueue({ initialComplaints }: AssignmentQueueProps) {
  const [complaints, setComplaints] = useState<Complaint[]>(initialComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  function handleAssigned() {
    if (selectedComplaint) {
      setComplaints(prev => prev.filter(c => c.id !== selectedComplaint.id));
      setSelectedComplaint(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {complaints.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-[#c3c6d1]">assignment_turned_in</span>
          <p className="text-base font-medium text-[#191c1e] mt-3">Queue empty</p>
          <p className="text-sm text-[#545f72] mt-1">All complaints have been assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {complaints.map(c => (
            <div key={c.id} className="relative group">
              <ComplaintCard complaint={c} />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" onClick={() => setSelectedComplaint(c)}>
                  Assign
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
