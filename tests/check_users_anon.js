const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3NTEyODIsImV4cCI6MjEwMzMyNzI4Mn0.TPIAosDSW8EFPwbQnt2gV4CspzK5TBNWlFQ4rtTBcY4';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('users_profile').select('id, role');
  console.log('users_profile (anon):', data, error);
}
main();
