const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTI4MiwiZXhwIjoyMTAzMzI3MjgyfQ.zpHjA-TZoLr_7GhD8cT1kfCwl8WLT2VYzxb6PwlBAFk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) {
    console.error('Auth fetch error:', authErr);
    return;
  }
  
  const { data: profileData, error: profileErr } = await supabase.from('users_profile').select('*');
  if (profileErr) {
    console.error('Profile fetch error:', profileErr);
    return;
  }

  const combined = profileData.map(p => {
    const authUser = authData.users.find(u => u.id === p.id);
    return {
      id: p.id,
      role: p.role,
      full_name: p.full_name || (authUser ? authUser.user_metadata?.full_name : null) || 'Unknown',
      email: authUser ? authUser.email : 'No email',
      providers: authUser && authUser.app_metadata ? authUser.app_metadata.providers : []
    };
  });
  
  console.log(JSON.stringify(combined, null, 2));
}
main();
