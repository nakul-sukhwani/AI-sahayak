import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  padding = 'md',
  hover = false,
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={[
        'bg-white border border-[#E2E8F0] rounded-xl',
        paddingClasses[padding],
        hover
          ? 'transition-shadow duration-200 hover:shadow-sm hover:border-[#c3c6d1] cursor-pointer'
          : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
