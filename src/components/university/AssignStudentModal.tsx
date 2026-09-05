'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import type { StudentAssignment } from '@/lib/university-heuristics';

interface ChallengeData {
  id: string;
  title: string;
  domain: string;
}

interface AssignStudentModalProps {
  challenge: ChallengeData | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (challengeId: string, assignment: StudentAssignment) => void;
}

const STUDY_SCOPES = [
  'Feasibility Survey & Topographical Mapping',
  'Material Testing & Laboratory Analysis',
  'Prototype Design & Engineering Simulation',
  'On-Site Field Assessment & Citizen Survey',
  'Environmental & Hydrological Impact Study',
  'Pilot Implementation & Scaled Trial',
];

export function AssignStudentModal({
  challenge,
  isOpen,
  onClose,
  onAssign,
}: AssignStudentModalProps) {
  const { toast } = useToast();
  const [leadName, setLeadName] = useState('');
  const [leadId, setLeadId] = useState('');
  const [studyScope, setStudyScope] = useState(STUDY_SCOPES[0]);
  const [priority, setPriority] = useState<'Standard' | 'High' | 'Urgent'>('Standard');
  const [deadline, setDeadline] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!challenge) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim()) {
      toast('Please enter a Student or Research Lead name.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const assignment: StudentAssignment = {
        leadName: leadName.trim(),
        leadId: leadId.trim() || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
        studyScope,
        deadline,
        priority,
        instructions: instructions.trim(),
        assignedAt: new Date().toISOString(),
      };

      onAssign(challenge.id, assignment);
      toast(`Study assigned to ${assignment.leadName} (${assignment.studyScope}).`, 'success');
      onClose();
    } catch {
      toast('Failed to record student assignment.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Study / Field Work to Student Group"
      maxWidth="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="!bg-[#001e40]"
          >
            Confirm Assignment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-[#191c1e]">
        {/* Challenge Summary Banner */}
        <div className="bg-[#f7f9fb] border border-[#E2E8F0] p-3 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-xs text-[#545f72] font-semibold uppercase tracking-wider block">
              Target Challenge
            </span>
            <p className="text-sm font-bold text-[#191c1e] line-clamp-1">{challenge.title}</p>
          </div>
          <Badge variant="default" label={challenge.domain} />
        </div>

        {/* Lead Student / Researcher Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#43474f] block mb-1">
              Student / Research Lead Name *
            </label>
            <Input
              required
              placeholder="e.g. Priya Sharma / Amit Verma"
              value={leadName}
              onChange={(e) => setLeadName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#43474f] block mb-1">
              Roll No / Student ID (Optional)
            </label>
            <Input
              placeholder="e.g. S2024-MTECH-019"
              value={leadId}
              onChange={(e) => setLeadId(e.target.value)}
            />
          </div>
        </div>

        {/* Study Scope Selection */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#43474f] block mb-1.5">
            Academic / Field Study Scope *
          </label>
          <select
            value={studyScope}
            onChange={(e) => setStudyScope(e.target.value)}
            className="w-full px-3 py-2.5 bg-white text-sm text-[#191c1e] border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:border-[#001e40] focus:ring-[#001e40]"
          >
            {STUDY_SCOPES.map((scope) => (
              <option key={scope} value={scope}>
                {scope}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline Deadline & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#43474f] block mb-1">
              Tentative Completion Deadline *
            </label>
            <Input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#43474f] block mb-1">
              Work Priority
            </label>
            <div className="flex gap-2">
              {(['Standard', 'High', 'Urgent'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPriority(p)}
                  className={[
                    'flex-1 py-2 text-xs font-semibold rounded-lg border transition-all',
                    priority === p
                      ? p === 'Urgent'
                        ? 'bg-[#fee2e2] text-[#DC2626] border-[#DC2626]'
                        : p === 'High'
                        ? 'bg-[#fef3c7] text-[#D97706] border-[#D97706]'
                        : 'bg-[#001e40] text-white border-[#001e40]'
                      : 'bg-white text-[#545f72] border-[#E2E8F0] hover:bg-[#f7f9fb]',
                  ].join(' ')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom Instructions & Field Notes */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#43474f] block mb-1">
            Custom Instructions &amp; Deliverables
          </label>
          <Textarea
            rows={3}
            placeholder="Specify equipment requirements, safety guidelines, lab tests to conduct, or survey questionnaires to administer..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
