import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <Spinner size="lg" />
      <p className="text-sm text-[#545f72] mt-4 font-medium">Loading...</p>
    </div>
  );
}
