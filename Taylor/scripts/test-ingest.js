// scripts/test-ingest.js
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as gen_random_uuid } from 'uuid';

// Load variables from multiple .env files
dotenv.config({ path: path.resolve(process.cwd(), 'packages/admin-panel/.env') });

const {
    VITE_SUPABASE_URL: SUPABASE_URL,
    VITE_SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY,
} = process.env;

const INGEST_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/ingest-v2`;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Error: Ensure all required environment variables are set in packages/admin-panel/.env');
    process.exit(1);
}

const TEST_USER_EMAIL = 'ange_andre25@yahoo.com';
const TEST_USER_PASSWORD = 'password12345';

// Create a Supabase admin client for setup tasks
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Test payloads for different event types
const testPayloads = {
    user_profile_update: {
        eventType: 'user_profile_update',
        payload: {
            userId: `test-user-${Date.now()}`,
            email: 'test.user@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'Marketing Manager',
            company: 'Acme Inc.',
            lastSeenAt: new Date().toISOString()
        }
    },
    event_details_update: {
        eventType: 'event_details_update',
        payload: {
            eventId: `test-event-${Date.now()}`,
            eventName: 'Product Launch Webinar',
            startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
            location: 'https://webinar.example.com/live',
            capacity: 500,
            category: 'Webinar'
        }
    },
    sales_transaction: {
        eventType: 'sales_transaction',
        payload: {
            transactionId: `test-txn-${Date.now()}`,
            userId: `test-user-${Date.now()}`,
            eventId: `test-event-${Date.now()}`,
            productId: 'ticket-general-admission',
            value: 49.99,
            currency: 'USD',
            quantity: 1,
            transactionAt: new Date().toISOString()
        }
    },
    user_engagement: {
        eventType: 'user_engagement',
        payload: {
            userId: `test-user-${Date.now()}`,
            engagementType: 'email_open',
            resourceId: `email-campaign-${Date.now()}`,
            eventId: `test-event-${Date.now()}`,
            engagementAt: new Date().toISOString(),
            duration: 45,
            metadata: { referrer: 'marketing-email' }
        }
    },
    event_attendance: {
        eventType: 'event_attendance',
        payload: {
            eventId: `test-event-${Date.now()}`,
            actualAttendees: 425,
            registeredAttendees: 500,
            attendanceRate: 0.85,
            recordedAt: new Date().toISOString(),
            demographicBreakdown: { industry: { tech: 250, finance: 175 } }
        }
    }
};

async function getOrCreateTestUser() {
    console.log(`Ensuring test user (${TEST_USER_EMAIL}) exists...`);

    // Correct way to find a user by email using the admin client
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
        throw new Error(`Failed to list users: ${listError.message}`);
    }

    const user = users.find(u => u.email === TEST_USER_EMAIL);

    if (user) {
        console.log('Test user already exists.');
        return user;
    }

    console.log('Test user not found, creating new one...');
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
        email_confirm: true,
    });

    if (error) {
        throw new Error(`Failed to create test user: ${error.message}`);
    }
    
    // The handle_new_user trigger should create the corresponding partner and API key
    console.log('Test user created successfully. Waiting for trigger to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Add a 2-second delay

    return newUser.user;
}

async function ensurePartnerAndKey(userId) {
    console.log(`Ensuring partner and API key exist for user ${userId}...`);

    let { data: partner, error: partnerError } = await supabaseAdmin
        .from('partners')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (partnerError && partnerError.code !== 'PGRST116') { // PGRST116 is "exact-single-row-not-found"
        throw new Error(`Error checking for partner: ${partnerError.message}`);
    }

    if (!partner) {
        console.log('No partner found for user, creating one...');
        const { data: newPartner, error: createError } = await supabaseAdmin
            .from('partners')
            .insert({ user_id: userId, name: 'Test Runner Partner' })
            .select('id')
            .single();

        if (createError) throw new Error(`Failed to create partner: ${createError.message}`);
        partner = newPartner;

        console.log(`Partner ${partner.id} created.`);
    } else {
        console.log(`Partner ${partner.id} already exists.`);
    }

    // Now check for an API key
    let { data: apiKeyData, error: keyError } = await supabaseAdmin
        .from('api_keys')
        .select('api_key')
        .eq('partner_id', partner.id)
        .single();

    if (keyError && keyError.code !== 'PGRST116') {
        throw new Error(`Error checking for API key: ${keyError.message}`);
    }

    if (!apiKeyData) {
        console.log('No API key found, creating one...');
        const { data: newKey, error: createKeyError } = await supabaseAdmin
            .from('api_keys')
            .insert({ partner_id: partner.id, api_key: gen_random_uuid() })
            .select('api_key')
            .single();

        if (createKeyError) throw new Error(`Failed to create API key: ${createKeyError.message}`);
        apiKeyData = newKey;
        console.log('API key created.');
    } else {
        console.log('API key already exists.');
    }

    return apiKeyData.api_key;
}

async function testEventType(apiKey, eventType) {
    console.log(`\n==== Testing ${eventType} event type ====`);
    const payload = testPayloads[eventType];
    
    console.log(`Sending ${eventType} payload to Ingest function...`);
    
    const response = await fetch(INGEST_FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    console.log(`Response Status: ${response.status}`);
    const responseBody = await response.json();
    console.log('Response Body:', responseBody);

    if (response.status === 201 && responseBody.eventId) {
        console.log(`✅ ${eventType} event successfully ingested. Event ID: ${responseBody.eventId}`);
        if (responseBody.insightId) {
            console.log(`✅ Insight generated. Insight ID: ${responseBody.insightId}`);
            const verificationSuccess = await verifyData(responseBody.eventId, responseBody.insightId);
            if (verificationSuccess) {
                console.log(`✅ Database verification passed for ${eventType} event.`);
                return true;
            } else {
                console.error(`❌ Database verification failed for ${eventType} event.`);
                return false;
            }
        } else {
            console.log(`⚠️ No insight was generated for ${eventType} event.`);
            return true; // Still consider it a success if the event was ingested
        }
    } else {
        console.error(`❌ Failed to ingest ${eventType} event.`);
        console.error('Response Body:', responseBody);
        return false;
    }
}

async function runTest() {
    try {
        const testUser = await getOrCreateTestUser();
        if (!testUser) {
            console.error("Failed to get or create a test user. Aborting.");
            return;
        }

        const apiKeyToTest = await ensurePartnerAndKey(testUser.id);
        if (!apiKeyToTest) {
            console.error("Failed to get API key for the test user. Aborting.");
            return;
        }
        
        console.log(`\nRunning tests for all event types using API key for ${TEST_USER_EMAIL}...`);
        
        // Test all event types
        const eventTypes = Object.keys(testPayloads);
        const results = {};
        
        for (const eventType of eventTypes) {
            results[eventType] = await testEventType(apiKeyToTest, eventType);
        }
        
        // Print summary
        console.log("\n==== TEST SUMMARY ====");
        let allPassed = true;
        for (const [eventType, passed] of Object.entries(results)) {
            console.log(`${passed ? '✅' : '❌'} ${eventType}: ${passed ? 'PASSED' : 'FAILED'}`);
            if (!passed) allPassed = false;
        }
        
        if (allPassed) {
            console.log('\n🎉 ✅✅✅ ALL TESTS PASSED! ✅✅✅ 🎉');
            console.log('All event types were successfully ingested and processed.');
            console.log(`\nTo see the results in the UI, log in with:\n  Email: ${TEST_USER_EMAIL}\n  Password: ${TEST_USER_PASSWORD}`);
        } else {
            console.error('\n❌ SOME TESTS FAILED. Please check the logs above for details.');
        }
    } catch (error) {
        console.error('\n❌ An error occurred during the test run:', error);
    }
}

async function verifyData(eventId, insightId) {
    let eventVerified = false;
    let insightVerified = false;

    try {
        console.log(`\n-- Verifying Ingestion Event ${eventId}...`);
        const { data: event, error: eventError } = await supabaseAdmin
            .from('ingestion_events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (eventError) throw new Error(`Error fetching event: ${eventError.message}`);
        
        if (event) {
            console.log('  ✅ Found ingestion event.');
            if (event.payload.eventType) {
                console.log(`  ✅ Event type: ${event.payload.eventType}`);
                eventVerified = true;
            } else {
                console.error('  ❌ Event payload missing eventType!');
            }
        } else {
            console.error('  ❌ Ingestion event not found in database!');
        }

        console.log(`\n-- Verifying Insight ${insightId}...`);
        const { data: insight, error: insightError } = await supabaseAdmin
            .from('insights')
            .select('*')
            .eq('id', insightId)
            .single();
        
        if (insightError) throw new Error(`Error fetching insight: ${insightError.message}`);

        if (insight) {
            console.log('  ✅ Found insight.');
            if (insight.ingestion_event_id === eventId) {
                console.log(`  ✅ Insight is correctly linked to event ${eventId}.`);
                if (insight.prediction_output) {
                     console.log('  ✅ Insight contains a prediction output.');
                     insightVerified = true;
                } else {
                    console.error('  ❌ Insight is missing prediction output!');
                }
            } else {
                 console.error(`  ❌ Insight is NOT linked to the correct event! Expected: ${eventId}, Got: ${insight.ingestion_event_id}`);
            }
        } else {
            console.error('  ❌ Insight not found in database!');
        }
    } catch (error) {
        console.error('\n❌ An error occurred during database verification:', error);
        return false;
    }

    return eventVerified && insightVerified;
}

runTest(); 