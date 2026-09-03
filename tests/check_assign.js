const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTI4MiwiZXhwIjoyMTAzMzI3MjgyfQ.zpHjA-TZoLr_7GhD8cT1kfCwl8WLT2VYzxb6PwlBAFk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const id = '77ad4139-ed39-4c99-a64e-b26c2d48a5d0';
  const assigned_to = '00000000-0000-0000-0000-000000000001';
  const assigned_by = '00000000-0000-0000-0000-000000000004';
  
  const { data, error } = await supabase
      .from('complaints')
      .update({
        assigned_to,
        assigned_by,
        assigned_at: new Date().toISOString(),
        status: 'assigned',
        status_updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'filed')
      .select()
      .single();

  console.log(data, error);
}
main();
