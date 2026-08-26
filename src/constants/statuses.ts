import type { ComplaintStatus } from '@/types/complaint';

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  draft:           'Draft',
  filed:           'Filed',
  assigned:        'Assigned',
  in_progress:     'In Progress',
  proof_submitted: 'Proof Submitted',
  resolved:        'Resolved',
  rejected:        'Rejected',
};

export const STATUS_ICONS: Record<ComplaintStatus, string> = {
  draft:           'edit_note',
  filed:           'assignment',
  assigned:        'assignment_ind',
  in_progress:     'construction',
  proof_submitted: 'photo_camera',
  resolved:        'check_circle',
  rejected:        'cancel',
};

export const STATUS_ORDER: ComplaintStatus[] = [
  'draft', 'filed', 'assigned', 'in_progress', 'proof_submitted', 'resolved',
];
