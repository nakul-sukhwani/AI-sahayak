'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
      <span className="material-symbols-outlined text-5xl text-[#DC2626] mb-4">error</span>
      <h2 className="text-xl font-semibold text-[#191c1e] mb-2">Something went wrong!</h2>
      <p className="text-sm text-[#545f72] mb-6 max-w-md">
        An unexpected error occurred while loading this page. Please try again or contact support if the issue persists.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
