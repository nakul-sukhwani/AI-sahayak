const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTI4MiwiZXhwIjoyMTAzMzI3MjgyfQ.zpHjA-TZoLr_7GhD8cT1kfCwl8WLT2VYzxb6PwlBAFk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('worker_job_reports')
    .select('*');

  if (error) {
    console.error('Error fetching worker job reports:', error);
  } else {
    console.log('Worker Job Reports in DB:', data);
  }
}
main();
