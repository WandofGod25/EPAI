import { createClient } from '@supabase/supabase-js';

// Production Supabase credentials
const PROD_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const PROD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZXFrcmZsZHR5d2tobnhjb3lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjE2ODksImV4cCI6MjA2NDk5NzY4OX0.tuxYU6EkZNOUmvS3hqANwO9Ee10DaZFO_rAb2uXo4fU';

const supabase = createClient(PROD_URL, PROD_ANON_KEY);

async function endToEndTest() {
  console.log('🧪 Running comprehensive end-to-end tests...\n');

  const results = {
    authentication: false,
    models: false,
    insights: false,
    logs: false,
    apiKeys: false,
    usageStats: false
  };

  try {
    // Test 1: Authentication
    console.log('1. 🔐 Testing Authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'ange_andre25@yahoo.com',
      password: 'Taylortest'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError);
    } else {
      console.log('✅ Authentication successful');
      console.log(`   User ID: ${authData.user.id}`);
      results.authentication = true;
    }

    // Test 2: Models API
    console.log('\n2. 🤖 Testing Models API...');
    const { data: modelsData, error: modelsError } = await supabase.functions.invoke('get-models');

    if (modelsError) {
      console.error('❌ Models API failed:', modelsError);
    } else {
      console.log('✅ Models API successful');
      console.log(`   Models returned: ${modelsData.models ? modelsData.models.length : 0}`);
      if (modelsData.models && modelsData.models.length > 0) {
        modelsData.models.forEach((model, index) => {
          console.log(`   ${index + 1}. ${model.model_name} (${model.model_version})`);
        });
      }
      results.models = true;
    }

    // Test 3: Insights API
    console.log('\n3. 📊 Testing Insights API...');
    const { data: insightsData, error: insightsError } = await supabase.functions.invoke('get-insights');

    if (insightsError) {
      console.error('❌ Insights API failed:', insightsError);
    } else {
      console.log('✅ Insights API successful');
      console.log(`   Insights returned: ${insightsData.insights ? insightsData.insights.length : 0}`);
      if (insightsData.insights && insightsData.insights.length > 0) {
        insightsData.insights.forEach((insight, index) => {
          console.log(`   ${index + 1}. ${insight.model_name} - ${JSON.stringify(insight.prediction_output)}`);
        });
      }
      results.insights = true;
    }

    // Test 4: Logs API
    console.log('\n4. 📋 Testing Logs API...');
    const { data: logsData, error: logsError } = await supabase.functions.invoke('get-partner-logs');

    if (logsError) {
      console.error('❌ Logs API failed:', logsError);
    } else {
      console.log('✅ Logs API successful');
      console.log(`   Logs returned: ${logsData.logs ? logsData.logs.length : 0}`);
      if (logsData.logs && logsData.logs.length > 0) {
        logsData.logs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.method} ${log.path} (${log.status_code})`);
        });
      }
      results.logs = true;
    }

    // Test 5: API Key Management
    console.log('\n5. 🔑 Testing API Key Management...');
    const { data: apiKeyData, error: apiKeyError } = await supabase.functions.invoke('api-key-manager', {
      body: { action: 'get' }
    });

    if (apiKeyError) {
      console.error('❌ API Key Management failed:', apiKeyError);
    } else {
      console.log('✅ API Key Management successful');
      console.log(`   API Key: ${apiKeyData.api_key ? 'Present' : 'Missing'}`);
      results.apiKeys = true;
    }

    // Test 6: Usage Stats API
    console.log('\n6. 📈 Testing Usage Stats API...');
    const { data: usageData, error: usageError } = await supabase.functions.invoke('get-usage-stats');

    if (usageError) {
      console.error('❌ Usage Stats API failed:', usageError);
    } else {
      console.log('✅ Usage Stats API successful');
      console.log(`   Usage data: ${JSON.stringify(usageData)}`);
      results.usageStats = true;
    }

    // Test 7: Direct Database Access (for verification)
    console.log('\n7. 🗄️ Testing Direct Database Access...');
    
    // Test models table
    const { data: dbModels, error: dbModelsError } = await supabase
      .from('models')
      .select('*');
    
    if (dbModelsError) {
      console.error('❌ Models table access failed:', dbModelsError);
    } else {
      console.log(`✅ Models table: ${dbModels.length} models found`);
    }

    // Test insights table
    const { data: dbInsights, error: dbInsightsError } = await supabase
      .from('insights')
      .select('*');
    
    if (dbInsightsError) {
      console.error('❌ Insights table access failed:', dbInsightsError);
    } else {
      console.log(`✅ Insights table: ${dbInsights.length} insights found`);
    }

    // Test logs table
    const { data: dbLogs, error: dbLogsError } = await supabase
      .from('logs')
      .select('*');
    
    if (dbLogsError) {
      console.error('❌ Logs table access failed:', dbLogsError);
    } else {
      console.log(`✅ Logs table: ${dbLogs.length} logs found`);
    }

    // Summary
    console.log('\n📊 END-TO-END TEST SUMMARY');
    console.log('========================');
    console.log(`🔐 Authentication: ${results.authentication ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🤖 Models API: ${results.models ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📊 Insights API: ${results.insights ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📋 Logs API: ${results.logs ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔑 API Key Management: ${results.apiKeys ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📈 Usage Stats API: ${results.usageStats ? '✅ PASS' : '❌ FAIL'}`);

    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = (passedTests / totalTests) * 100;

    console.log(`\n🎯 Overall Success Rate: ${successRate.toFixed(1)}% (${passedTests}/${totalTests})`);

    if (successRate === 100) {
      console.log('\n🎉 ALL TESTS PASSED! The admin panel is fully functional.');
      console.log('💡 You can now use the admin panel with confidence.');
    } else {
      console.log('\n⚠️ Some tests failed. Please review the errors above.');
    }

  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

endToEndTest(); 