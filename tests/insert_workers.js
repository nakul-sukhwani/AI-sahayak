const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTI4MiwiZXhwIjoyMTAzMzI3MjgyfQ.zpHjA-TZoLr_7GhD8cT1kfCwl8WLT2VYzxb6PwlBAFk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const workersData = [
    { user_id: '335e50a3-9bfc-444a-bfb4-8f75e46389ab', area_name: 'Koramangala', department: 'General', is_available: true, max_concurrent_tasks: 3 },
    { user_id: '373bb794-d9d6-472b-a015-38183dabb952', area_name: 'Indiranagar', department: 'Roads & Infrastructure', is_available: true, max_concurrent_tasks: 3 },
    { user_id: '0dcfc51e-c4e4-4d16-bcf8-00342b263e16', area_name: 'Jayanagar', department: 'Roads & Infrastructure', is_available: true, max_concurrent_tasks: 3 }
  ];
  
  const { error } = await supabase.from('workers').insert(workersData);
  console.log(error);
}
main();
