import { createClient } from '@supabase/supabase-js';
import { generateComplaintPDF } from '../src/lib/pdf';

const supabaseUrl = 'https://iaaxnojhnjgtnzdrllhg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhYXhub2pobmpndG56ZHJsbGhnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzc1MTI4MiwiZXhwIjoyMTAzMzI3MjgyfQ.zpHjA-TZoLr_7GhD8cT1kfCwl8WLT2VYzxb6PwlBAFk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: complaint } = await supabase.from('complaints').select('*').limit(1).single();
  
  try {
    const pdfBytes = await generateComplaintPDF({
      complaint,
      citizenName: 'Test Citizen',
      officerName: null,
      appUrl: 'http://localhost:3000'
    });
    console.log('PDF generated successfully, size:', pdfBytes.length);
  } catch (error) {
    console.error('Error generating PDF:', error);
  }
}
main();
