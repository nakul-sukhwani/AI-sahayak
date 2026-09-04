import { forwardRef, type TextareaHTMLAttributes } from 'react';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={[
          'w-full px-4 py-3 bg-white text-base text-[#191c1e] placeholder-[#737780]',
          'border border-[#E2E8F0] rounded-lg transition-colors resize-y',
          'focus:outline-none focus:ring-1 focus:border-[#001e40] focus:ring-[#001e40]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        ].join(' ')}
        {...props}
      />
    );
  }
);
