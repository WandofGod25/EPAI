# EPAI Testing and Simulation Guide

This guide provides step-by-step instructions for testing the EPAI (Embedded Predictive Analytics Integrator) platform.

## Current Environment Setup

The testing environment has been set up with the following components:

1. **Supabase Local Development**: Running at http://127.0.0.1:54321
2. **Admin Panel**: Running at http://localhost:5173
3. **Test User**: Created with email `ange_andre25@yahoo.com` and password `Taylortest`

## Testing the Admin Panel

### Step 1: Access the Admin Panel

1. Open your browser and navigate to http://localhost:5173
2. You should see the login page

### Step 2: Login with Test Credentials

1. Enter the following credentials:
   - Email: `ange_andre25@yahoo.com`
   - Password: `Taylortest`
2. Click the "Login" button
3. You should be redirected to the dashboard

### Step 3: Explore the Admin Panel

1. **Dashboard**: Verify that you can see usage statistics and insights
2. **Models**: Check the available models
3. **Logs**: View API logs
4. **Settings**: Check your API key

## Testing the SDK Integration

### Step 1: View the Integration Page

1. In the Admin Panel, navigate to the "Integration" page
2. Copy the script tag provided for SDK integration

### Step 2: Test the SDK with the Test HTML Page

1. Open the `test-login.html` file in your browser
2. Click the "Login" button to test authentication
3. Verify that you can successfully authenticate with the provided credentials

## Testing the API Directly

### Step 1: Use the API Key

1. Get your API key from the Settings page in the Admin Panel
2. Use this API key for direct API testing

### Step 2: Test Data Ingestion

1. Send a POST request to `http://127.0.0.1:54321/functions/v1/ingest-v2` with:
   - Header: `apikey: epai_test_api_key_for_simulation`
   - Body: Sample event data in JSON format

### Step 3: Test Insight Retrieval

1. Send a POST request to `http://127.0.0.1:54321/functions/v1/get-public-insight` with:
   - Header: `apikey: epai_test_api_key_for_simulation`
   - Body: `{ "insight_id": "1" }`

## Testing Security Features

### Step 1: Test API Key Validation

1. Send a request with an invalid API key
2. Verify that you receive a 401 Unauthorized response

### Step 2: Test Rate Limiting

1. Send multiple requests in quick succession
2. Verify that rate limiting is applied after exceeding the limit

## Troubleshooting

### Common Issues and Solutions

1. **Login Issues**:
   - Ensure Supabase is running (`supabase status`)
   - Check that the test user was created successfully
   - Verify the correct URL is being used (http://localhost:5173)

2. **API Key Issues**:
   - If the API key doesn't work, try regenerating it in the Settings page
   - Ensure you're using the correct header format (`apikey: your_key`)

3. **Database Schema Issues**:
   - If you encounter database schema errors, try running `supabase db reset`
   - Check the migration files for any conflicts

### Logs and Debugging

1. **Supabase Logs**: Check the Supabase logs for any backend errors
2. **Browser Console**: Check the browser console for frontend errors
3. **Network Tab**: Inspect API requests in the browser's network tab

## Next Steps

After completing these tests, you should have a good understanding of how the EPAI platform works. You can now:

1. Customize the platform for your specific needs
2. Add more test data for comprehensive testing
3. Prepare for deployment to a production environment

## Reference

- **Supabase Studio**: http://127.0.0.1:54323
- **Admin Panel**: http://localhost:5173
- **API Base URL**: http://127.0.0.1:54321/functions/v1
- **Test User**: ange_andre25@yahoo.com / Taylortest
- **Test API Key**: epai_test_api_key_for_simulation 