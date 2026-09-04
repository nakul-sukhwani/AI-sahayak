import type { LabelHTMLAttributes } from 'react';

export function Label({ className = '', ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={['text-sm font-medium text-[#191c1e] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className].join(' ')}
      {...props}
    />
  );
}
