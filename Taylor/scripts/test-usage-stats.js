// scripts/test-usage-stats.js
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), 'packages/admin-panel/.env') });

const {
    VITE_SUPABASE_URL: SUPABASE_URL,
    VITE_SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
} = process.env;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Error: Ensure all required environment variables are set in packages/admin-panel/.env');
    process.exit(1);
}

const TEST_USER_EMAIL = 'ange_andre25@yahoo.com';
const TEST_USER_PASSWORD = 'password12345';

// Create a Supabase admin client for setup tasks
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getTestUserSession() {
    console.log(`Getting session for test user (${TEST_USER_EMAIL})...`);

    // Try to sign in with the test user
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
    });

    if (signInError) {
        console.error('Error signing in test user:', signInError);
        throw signInError;
    }

    return signInData.session;
}

async function testUsageStats() {
    try {
        // Get a session for our test user
        const session = await getTestUserSession();
        if (!session) {
            console.error("Failed to get test user session. Aborting.");
            return;
        }

        console.log(`Got session for ${TEST_USER_EMAIL}`);
        console.log(`Access token length: ${session.access_token.length}`);

        // Call the get-usage-stats function with the session token
        console.log(`\nCalling get-usage-stats function...`);
        const response = await fetch(`${SUPABASE_URL}/functions/v1/get-usage-stats`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`Response Status: ${response.status}`);
        const responseBody = await response.json();
        console.log('Response Body:', JSON.stringify(responseBody, null, 2));

        if (response.ok) {
            console.log(`\n✅ Usage stats retrieved successfully.`);
            console.log(`Total ingestion events: ${responseBody.total_ingestion_events}`);
            console.log(`Total insights generated: ${responseBody.total_insights_generated}`);
            console.log(`Latest event timestamp: ${responseBody.latest_event_timestamp || 'N/A'}`);
        } else {
            console.error(`❌ Failed to retrieve usage stats.`);
            console.error('Error:', responseBody.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error in test script:', error);
    }
}

// Run the test
testUsageStats().catch(console.error); 