'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#001e40] text-white hover:opacity-90 border border-[#001e40]',
  secondary:
    'bg-white text-[#001e40] border border-[#001e40] hover:bg-[#f7f9fb]',
  ghost:
    'bg-transparent text-[#001e40] border border-transparent hover:bg-[#f7f9fb]',
  danger:
    'bg-[#DC2626] text-white hover:opacity-90 border border-[#DC2626]',
  outline:
    'bg-transparent text-[#001e40] border border-[#E2E8F0] hover:bg-[#f7f9fb]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
        'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#001e40]/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current/40 border-t-current rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
