type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-7 h-7 border-2',
  lg: 'w-10 h-10 border-[3px]',
};

export function Spinner({ size = 'md', label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={['inline-flex items-center justify-center', className].join(' ')}>
      <span
        className={[
          'rounded-full border-[#E2E8F0] border-t-[#001e40] animate-spin',
          sizeClasses[size],
        ].join(' ')}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f9fb]">
      <Spinner size="lg" />
    </div>
  );
}
