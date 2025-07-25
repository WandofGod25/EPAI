import fetch from 'node-fetch';

// Constants
const API_BASE_URL = 'https://rxeqkrfldtywkhnxcoys.supabase.co';
const FUNCTIONS_URL = `${API_BASE_URL}/functions/v1`;

async function testSqlInjection() {
  console.log('Testing SQL injection protection...');
  
  // SQL injection attempt in the API key
  const sqlInjectionPayload = "' OR 1=1; --";
  
  try {
    const response = await fetch(`${FUNCTIONS_URL}/ingest-v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': sqlInjectionPayload
      },
      body: JSON.stringify({
        eventType: "user_profile_update",
        payload: {
          userId: "test-user",
          firstName: "Test",
          lastName: "User"
        }
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());
    
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    if (response.status === 401) {
      console.log('SQL injection attempt correctly rejected with 401');
    } else {
      console.log(`SQL injection not handled correctly (status: ${response.status})`);
    }
  } catch (error) {
    console.error('Error testing SQL injection protection:', error);
  }
}

// Run the test
testSqlInjection(); 