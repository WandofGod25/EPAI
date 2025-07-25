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

async function testPredictionAPI() {
  try {
    console.log('Testing prediction API...');
    
    // First, let's check if we can authenticate
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth error:', authError);
      return;
    }
    
    if (!session) {
      console.log('No session found. Let\'s sign in...');
      
      // Try to sign in with a test user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (signInError) {
        console.error('Sign in error:', signInError);
        return;
      }
      
      console.log('Signed in successfully:', signInData.user?.email);
    } else {
      console.log('Already authenticated:', session.user?.email);
    }
    
    // Get the current session
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    
    if (!currentSession?.access_token) {
      console.error('No access token available');
      return;
    }
    
    console.log('Access token available, testing prediction API...');
    
    // Test prediction data
    const testData = {
      modelType: 'attendance_forecast',
      venue: 'Test Venue',
      eventDate: '2025-02-15',
      genre: 'rock',
      ticketPrice: 75,
      marketingBudget: 50000,
      venueCapacity: 20000
    };
    
    console.log('Sending test data:', testData);
    
    const response = await fetch(`${supabaseUrl}/functions/v1/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentSession.access_token}`,
      },
      body: JSON.stringify(testData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('Parsed response:', JSON.stringify(result, null, 2));
    } else {
      console.error('API call failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testPredictionAPI(); 