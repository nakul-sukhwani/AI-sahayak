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
        'bg-white border border-[#E2E8F0] rounded-xl shadow-sm',
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

export function CardHeader({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['flex flex-col space-y-1.5 p-6', className].join(' ')} {...props} />
  );
}

export function CardTitle({ className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={['text-lg font-semibold leading-none tracking-tight text-[#191c1e]', className].join(' ')}
      {...props}
    />
  );
}

export function CardDescription({ className = '', ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={['text-sm text-[#545f72]', className].join(' ')} {...props} />
  );
}

export function CardContent({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={['p-6 pt-0', className].join(' ')} {...props} />;
}

export function CardFooter({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={['flex items-center p-6 pt-0', className].join(' ')} {...props} />
  );
}
