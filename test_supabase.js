import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lucpmecyfkgdcwpditzs.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1Y3BtZWN5ZmtnZGN3cGRpdHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4ODQxOTUsImV4cCI6MjA4NjQ2MDE5NX0.TuQYOT2sQoo5U6gLIJfHRx5IHz0oS69uGp6CdesMyv0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('quiz_submissions').select('*');
  console.log('Quiz submissions:', data);
  console.log('Error:', error);

  const { data: hwData, error: hwError } = await supabase.from('homework_submissions').select('*');
  console.log('HW submissions:', hwData);
}

check();
