import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPredictionDebug() {
  try {
    console.log('=== PREDICTION API DEBUG TEST ===');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Environment:', process.env.NODE_ENV || 'development');
    
    // Step 1: Check authentication
    console.log('\n1. Checking authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    if (!session) {
      console.log('⚠️  No session found. Signing in with existing user...');
      
      // Try to sign in with an existing user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test-prediction@example.com',
        password: 'password123'
      });
      
      if (signInError) {
        console.log('⚠️  Sign in failed, creating new user...');
        
        // Create a test user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'test-prediction@example.com',
          password: 'password123'
        });
        
        if (signUpError) {
          console.error('❌ Sign up error:', signUpError);
          return;
        }
        
        console.log('✅ Test user created:', signUpData.user?.email);
        
        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log('✅ Signed in successfully:', signInData.user?.email);
      }
    } else {
      console.log('✅ Already authenticated:', session.user?.email);
    }
    
    // Step 2: Get current session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession?.access_token) {
      console.error('❌ No access token available');
      return;
    }
    
    console.log('✅ Access token available');
    
    // Step 3: Test prediction API
    console.log('\n2. Testing prediction API...');
    
    const testData = {
      modelType: 'attendance_forecast',
      venue: 'Test Venue',
      eventDate: '2025-02-15',
      genre: 'rock',
      ticketPrice: 75,
      marketingBudget: 50000,
      venueCapacity: 20000
    };
    
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(`${supabaseUrl}/functions/v1/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`,
      },
      body: JSON.stringify(testData),
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📥 Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ API call successful!');
      console.log('📊 Parsed response:', JSON.stringify(result, null, 2));
      
      // Step 4: Check if data was stored in database
      console.log('\n3. Checking database storage...');
      
      const { data: requests, error: requestsError } = await supabase
        .from('prediction_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (requestsError) {
        console.error('❌ Error fetching prediction requests:', requestsError);
      } else {
        console.log('📊 Recent prediction requests:', requests?.length || 0);
        if (requests && requests.length > 0) {
          console.log('📊 Latest request:', JSON.stringify(requests[0], null, 2));
        }
      }
      
      const { data: results, error: resultsError } = await supabase
        .from('prediction_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (resultsError) {
        console.error('❌ Error fetching prediction results:', resultsError);
      } else {
        console.log('📊 Recent prediction results:', results?.length || 0);
        if (results && results.length > 0) {
          console.log('📊 Latest result:', JSON.stringify(results[0], null, 2));
        }
      }
      
    } else {
      console.error('❌ API call failed');
      
      // Try to parse error response
      try {
        const errorResult = JSON.parse(responseText);
        console.error('❌ Error details:', JSON.stringify(errorResult, null, 2));
      } catch (e) {
        console.error('❌ Could not parse error response');
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPredictionDebug(); 