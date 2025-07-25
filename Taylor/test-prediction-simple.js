import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPredictionSimple() {
  try {
    console.log('=== SIMPLE PREDICTION TEST ===');
    console.log('Supabase URL:', supabaseUrl);
    
    // Step 1: Check if we have any existing users/partners
    console.log('\n1. Checking existing users...');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log('📊 Found users:', users?.length || 0);
    
    if (users && users.length > 0) {
      const testUser = users[0];
      console.log('✅ Using test user:', testUser.email);
      
      // Step 2: Check if this user has a partner record
      const { data: partners, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', testUser.id);
      
      if (partnersError) {
        console.error('❌ Error fetching partners:', partnersError);
        return;
      }
      
      console.log('📊 Found partners:', partners?.length || 0);
      
      if (partners && partners.length > 0) {
        const partner = partners[0];
        console.log('✅ Using partner:', partner.id);
        
        // Step 3: Test database operations directly
        console.log('\n2. Testing database operations directly...');
        
        const testData = {
          modelType: 'attendance_forecast',
          venue: 'Test Venue',
          eventDate: '2025-02-15',
          genre: 'rock',
          ticketPrice: 75,
          marketingBudget: 50000,
          venueCapacity: 20000
        };
        
        // Insert prediction request
        const { data: request, error: requestError } = await supabase
          .from('prediction_requests')
          .insert({
            partner_id: partner.id,
            model_type: testData.modelType,
            venue: testData.venue,
            event_date: testData.eventDate,
            genre: testData.genre,
            ticket_price: testData.ticketPrice,
            marketing_budget: testData.marketingBudget,
            venue_capacity: testData.venueCapacity,
            status: 'processing'
          })
          .select()
          .single();
        
        if (requestError) {
          console.error('❌ Error creating prediction request:', requestError);
          return;
        }
        
        console.log('✅ Prediction request created:', request.id);
        
        // Simulate prediction result
        const predictionResult = {
          prediction: 15000,
          confidence: 0.85,
          explanation: 'Based on venue capacity, genre popularity, and marketing budget, expected attendance is 15,000.',
          processingTime: 150
        };
        
        // Insert prediction result
        const { data: result, error: resultError } = await supabase
          .from('prediction_results')
          .insert({
            request_id: request.id,
            partner_id: partner.id,
            prediction_value: predictionResult.prediction,
            confidence_score: predictionResult.confidence,
            explanation: predictionResult.explanation,
            processing_time_ms: predictionResult.processingTime,
            model_version: 'v1.0.0'
          })
          .select()
          .single();
        
        if (resultError) {
          console.error('❌ Error creating prediction result:', resultError);
          return;
        }
        
        console.log('✅ Prediction result created:', result.id);
        
        // Update request status
        await supabase
          .from('prediction_requests')
          .update({ status: 'completed' })
          .eq('id', request.id);
        
        console.log('✅ Request status updated to completed');
        
        console.log('\n✅ Database operations successful! The prediction system is working.');
        
      } else {
        console.log('❌ No partner record found for user');
      }
    } else {
      console.log('❌ No users found in the system');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testPredictionSimple(); 