import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials (from the .env file)
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function checkProductionModels() {
  console.log('🔍 Checking Production environment with correct anon key...\n');
  console.log(`URL: ${PROD_URL}`);
  
  try {
    // Check models table
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*');

    if (modelsError) {
      console.error('❌ Error fetching models:', modelsError);
      return;
    }

    console.log(`📊 Found ${models.length} models in production:`);
    
    if (models.length === 0) {
      console.log('   No models found');
    } else {
      models.forEach((model, index) => {
        console.log(`\n   Model ${index + 1}:`);
        console.log(`     ID: ${model.id}`);
        console.log(`     Name: ${model.model_name || model.name}`);
        console.log(`     Description: ${model.description}`);
        console.log(`     Version: ${model.model_version || 'v1.0'}`);
        console.log(`     Status: ${model.status}`);
        console.log(`     Partner ID: ${model.partner_id}`);
        console.log(`     Created: ${model.created_at}`);
      });
    }

    // Check partners table too
    console.log('\n👥 Checking partners table...');
    const { data: partners, error: partnersError } = await supabase
      .from('partners')
      .select('*');

    if (partnersError) {
      console.error('❌ Error fetching partners:', partnersError);
      return;
    }

    console.log(`📊 Found ${partners.length} partners in production:`);
    
    if (partners.length === 0) {
      console.log('   No partners found');
    } else {
      partners.forEach((partner, index) => {
        console.log(`\n   Partner ${index + 1}:`);
        console.log(`     ID: ${partner.id}`);
        console.log(`     Name: ${partner.name}`);
        console.log(`     User ID: ${partner.user_id}`);
        console.log(`     Created: ${partner.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkProductionModels(); 