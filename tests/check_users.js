const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTI4MiwiZXhwIjoyMTAzMzI3MjgyfQ.zpHjA-TZoLr_7GhD8cT1kfCwl8WLT2VYzxb6PwlBAFk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data } = await supabase.from('users_profile').select('id, role');
  console.log('users_profile:', data);
  const { data: w } = await supabase.from('workers').select('user_id');
  console.log('workers:', w);
}
main();
