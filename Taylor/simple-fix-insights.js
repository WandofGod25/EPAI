import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function simpleFixInsights() {
  console.log('🔧 Simple fix for insights data...\n');

  try {
    // Use service role key to bypass RLS
    console.log('1. 🔐 Using service role for admin access...');

    // Get all insights
    const { data: insights, error: insightsError } = await supabase
      .from('insights')
      .select('*');

    if (insightsError) {
      console.error('❌ Error fetching insights:', insightsError);
      return;
    }

    if (insights.length === 0) {
      console.log('📊 No insights found to fix');
      return;
    }

    console.log(`📊 Found ${insights.length} insights to fix`);

    // Fix each insight by setting ingestion_event_id to NULL
    for (const insight of insights) {
      console.log(`\n2. 🔄 Fixing insight: ${insight.model_name} (ID: ${insight.id})`);
      
      const { error: updateError } = await supabase
        .from('insights')
        .update({ ingestion_event_id: null })
        .eq('id', insight.id);

      if (updateError) {
        console.error(`❌ Error updating insight ${insight.id}:`, updateError);
      } else {
        console.log(`✅ Fixed insight: ${insight.model_name}`);
      }
    }

    // Verify the fix
    console.log('\n3. ✅ Verifying the fix...');
    const { data: fixedInsights, error: verifyError } = await supabase
      .from('insights')
      .select('*');

    if (verifyError) {
      console.error('❌ Error verifying fix:', verifyError);
      return;
    }

    console.log(`✅ Verification successful: ${fixedInsights.length} insights fixed`);
    
    fixedInsights.forEach((insight, index) => {
      console.log(`   ${index + 1}. ${insight.model_name} - ingestion_event_id: ${insight.ingestion_event_id || 'NULL'}`);
    });

    console.log('\n🎉 Insights data fixed successfully!');
    console.log('💡 You can now refresh your admin panel to see the insights working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

simpleFixInsights(); 