import type { Metadata } from 'next';
import { ComplaintForm } from '@/components/complaints/ComplaintForm';

export const metadata: Metadata = {
  title: 'Report Issue',
  description: 'File a new civic complaint with AI-powered analysis and smart routing.',
};

export default function NewComplaintPage() {
  return (
    <div className="py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[#191c1e] tracking-tight">Report an Issue</h1>
        <p className="text-sm text-[#545f72] mt-1">
          Capture a photo and our AI will classify and route your complaint automatically.
        </p>
      </div>
      <ComplaintForm />
    </div>
  );
}
