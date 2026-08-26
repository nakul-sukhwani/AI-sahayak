import type { ComplaintSeverity } from '@/types/complaint';

export const SEVERITIES: { value: ComplaintSeverity; label: string; description: string }[] = [
  { value: 'low',      label: 'Low',      description: 'Cosmetic issue, no immediate risk' },
  { value: 'medium',   label: 'Medium',   description: 'Moderate inconvenience, needs attention' },
  { value: 'high',     label: 'High',     description: 'Significant daily impact' },
  { value: 'critical', label: 'Critical', description: 'Immediate safety hazard' },
];

export const SEVERITY_COLORS: Record<ComplaintSeverity, string> = {
  low:      '#059669',
  medium:   '#D97706',
  high:     '#DC2626',
  critical: '#991b1b',
};
