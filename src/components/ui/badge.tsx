'use client';

import type { HTMLAttributes } from 'react';

// Combined variant type: existing app variants + shadcn-style variants
type BadgeVariant =
  // Existing app variants
  | 'filed' | 'assigned' | 'in_progress' | 'proof_submitted'
  | 'resolved' | 'rejected' | 'draft'
  | 'low' | 'medium' | 'high' | 'critical'
  | 'ai' | 'neutral'
  // shadcn-style variants used by new components
  | 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  label?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  // Existing status variants
  draft:           'bg-[#e0e3e5] text-[#43474f]',
  filed:           'bg-[#dbeafe] text-[#1d4ed8]',
  assigned:        'bg-[#dbeafe] text-[#1d4ed8]',
  in_progress:     'bg-[#fef3c7] text-[#D97706]',
  proof_submitted: 'bg-[#ede9fe] text-[#7C3AED]',
  resolved:        'bg-[#d1fae5] text-[#059669]',
  rejected:        'bg-[#fee2e2] text-[#DC2626]',
  // Severity
  low:      'bg-[#d1fae5] text-[#059669]',
  medium:   'bg-[#fef3c7] text-[#D97706]',
  high:     'bg-[#fee2e2] text-[#DC2626]',
  critical: 'bg-[#DC2626] text-white',
  // Special
  ai:      'bg-[#ede9fe] text-[#7C3AED] border border-[#7C3AED]/30',
  neutral: 'bg-[#f7f9fb] text-[#43474f] border border-[#E2E8F0]',
  // shadcn-style variants
  default:     'bg-[#001e40] text-white',
  secondary:   'bg-[#e0e3e5] text-[#43474f]',
  destructive: 'bg-[#fee2e2] text-[#DC2626]',
  outline:     'bg-transparent text-[#43474f] border border-[#E2E8F0]',
};

export function Badge({ variant = 'neutral', label, children, className = '', ...props }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-full',
        'text-xs font-medium tracking-wide',
        variantStyles[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {label ?? children}
    </span>
  );
}
