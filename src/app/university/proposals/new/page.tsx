import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProposalForm } from '@/components/university/ProposalForm';

export const metadata = {
  title: 'Submit Proposal | Nagrik Seva',
};

export default async function NewProposalPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge_id: string; university_id: string }>;
}) {
  const { challenge_id, university_id } = await searchParams;

  if (!challenge_id || !university_id) {
    redirect('/university/inbox');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch challenge title for display
  const { data: challenge } = await supabase
    .from('challenges')
    .select('title')
    .eq('id', challenge_id)
    .single();

  return (
    <div className="space-y-6">
      <ProposalForm 
        challengeId={challenge_id} 
        universityId={university_id}
        challengeTitle={challenge?.title}
      />
    </div>
  );
}
