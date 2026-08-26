'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, id, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[#191c1e]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#545f72]">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          className={[
            'w-full px-4 py-3 bg-white text-base text-[#191c1e] placeholder-[#737780]',
            'border rounded-lg transition-colors',
            'focus:outline-none focus:ring-1',
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]'
              : 'border-[#E2E8F0] focus:border-[#001e40] focus:ring-[#001e40]',
            leftIcon ? 'pl-10' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p role="alert" className="text-xs text-[#DC2626]">{error}</p>}
      {hint && !error && <p className="text-xs text-[#545f72]">{hint}</p>}
    </div>
  );
});
