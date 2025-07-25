import { createClient } from '@supabase/supabase-js';

// Local Supabase credentials
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Production Supabase credentials (from the cleanup files)
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

async function checkEnvironment(url, key, name) {
  console.log(`\n🔍 Checking ${name} environment...`);
  console.log(`   URL: ${url}`);
  
  const supabase = createClient(url, key);
  
  try {
    // Check models table
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*');

    if (modelsError) {
      console.error(`   ❌ Error fetching models from ${name}:`, modelsError);
      return;
    }

    console.log(`   📊 Found ${models.length} models in ${name}:`);
    
    if (models.length === 0) {
      console.log(`      No models found`);
    } else {
      models.forEach((model, index) => {
        console.log(`      ${index + 1}. ${model.model_name || model.name} (${model.model_version || 'v1.0'})`);
      });
    }

    // Check partners table
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*');

    if (partnersError) {
      console.error(`   ❌ Error fetching partners from ${name}:`, partnersError);
      return;
    }

    console.log(`   👥 Found ${partners.length} partners in ${name}`);

  } catch (error) {
    console.error(`   ❌ Unexpected error with ${name}:`, error);
  }
}

async function checkBothEnvironments() {
  console.log('🚀 Checking both Local and Production environments...\n');
  
  await checkEnvironment(LOCAL_URL, LOCAL_KEY, 'LOCAL');
  await checkEnvironment(PROD_URL, PROD_KEY, 'PRODUCTION');
  
  console.log('\n💡 This will help us understand which environment your frontend is connecting to.');
}

checkBothEnvironments(); 