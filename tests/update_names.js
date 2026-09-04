const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTI4MiwiZXhwIjoyMTAzMzI3MjgyfQ.zpHjA-TZoLr_7GhD8cT1kfCwl8WLT2VYzxb6PwlBAFk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  await supabase.from('users_profile').update({ full_name: 'Raju Nair', display_name: 'Raju' }).eq('id', '335e50a3-9bfc-444a-bfb4-8f75e46389ab');
  await supabase.from('users_profile').update({ full_name: 'Suresh Kumar', display_name: 'Suresh' }).eq('id', '373bb794-d9d6-472b-a015-38183dabb952');
  await supabase.from('users_profile').update({ full_name: 'Anand Krishnan', display_name: 'Anand' }).eq('id', '0dcfc51e-c4e4-4d16-bcf8-00342b263e16');
  console.log('updated names');
}
main();
