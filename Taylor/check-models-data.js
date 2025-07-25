import { createClient } from '@supabase/supabase-js';

// Local Supabase credentials
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkModelsData() {
  console.log('🔍 Checking models table data...\n');

  try {
    // Check the models table structure
    console.log('📋 Models table structure:');
    const { data: tableInfo, error: tableError } = await supabase
      .from('models')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Error getting table structure:', tableError);
      return;
    }

    // Get all models
    const { data: models, error: modelsError } = await supabase
      .from('models')
      .select('*');

    if (modelsError) {
      console.error('❌ Error fetching models:', modelsError);
      return;
    }

    console.log(`📊 Found ${models.length} models in the database:`);
    
    if (models.length === 0) {
      console.log('   No models found - the table is empty');
    } else {
      models.forEach((model, index) => {
        console.log(`\n   Model ${index + 1}:`);
        console.log(`     ID: ${model.id}`);
        console.log(`     Name: ${model.model_name}`);
        console.log(`     Description: ${model.description}`);
        console.log(`     Version: ${model.model_version}`);
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

    console.log(`📊 Found ${partners.length} partners in the database:`);
    
    if (partners.length === 0) {
      console.log('   No partners found - the table is empty');
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

checkModelsData(); 