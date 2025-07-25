# EPAI Pilot Partner Onboarding Guide

Welcome to the Embedded Predictive Analytics Integrator (EPAI) platform pilot! This guide will walk you through the steps to get started with integrating predictive analytics into your application.

## Table of Contents

1. [Overview](#overview)
2. [Account Setup](#account-setup)
3. [Admin Panel](#admin-panel)
4. [API Key Management](#api-key-management)
5. [SDK Integration](#sdk-integration)
6. [Data Ingestion](#data-ingestion)
7. [Troubleshooting](#troubleshooting)
8. [Support](#support)

## Overview

The EPAI platform enables you to embed predictive analytics insights directly into your application with minimal effort. The platform consists of:

- **Admin Panel**: A web interface for managing your account, API keys, and viewing analytics data
- **API**: RESTful endpoints for data ingestion and retrieval
- **SDK**: A JavaScript library for embedding insights into your application

## Account Setup

Your account has already been created as part of the pilot program. You should have received an email with your login credentials:

- **Email**: The email address you provided during the pilot enrollment
- **Password**: A temporary password provided in the onboarding email
- **Admin Panel URL**: https://admin.epai.example.com

When you first log in, you'll be prompted to change your password. Choose a strong password that meets our security requirements:
- At least 8 characters
- Mix of uppercase and lowercase letters
- At least one number
- At least one special character

## Admin Panel

The Admin Panel is your command center for managing your EPAI integration:

### Navigation

- **Dashboard**: Overview of your account usage and key metrics
- **Models**: View available prediction models for your industry
- **Insights**: View generated insights from your data
- **Logs**: Review API request logs and system events
- **Settings**: Manage your API keys and account settings

## API Key Management

Your API key is required for authenticating all API requests and SDK integrations:

### Viewing Your API Key

1. Log in to the Admin Panel
2. Navigate to "Settings"
3. Your API key is displayed in the API Key section

### Regenerating Your API Key

If your API key has been compromised, you can regenerate it:

1. Log in to the Admin Panel
2. Navigate to "Settings"
3. Click "Regenerate API Key"
4. Confirm the action

**IMPORTANT**: Regenerating your API key will immediately invalidate the old key. You will need to update all applications using the API key.

## SDK Integration

### Option 1: Script Tag Integration

The simplest way to integrate the EPAI SDK is with a script tag:

```html
<div id="epai-insight-container"></div>
<script src="https://cdn.epai.example.com/sdk.js" 
        data-api-key="YOUR_API_KEY"
        data-container-id="epai-insight-container"
        data-theme="light">
</script>
```

### Option 2: NPM Package (React Integration)

For React applications, you can install our NPM package:

```bash
npm install @epai/insight-sdk
```

Then import and use the components in your React application:

```jsx
import { InsightCard } from '@epai/insight-sdk';

function App() {
  return (
    <div className="App">
      <InsightCard 
        apiKey="YOUR_API_KEY"
        theme="light"
        showConfidence={true}
      />
    </div>
  );
}
```

## Data Ingestion

To receive meaningful insights, you need to send data to the EPAI platform:

### Event Types

The platform currently supports the following event types:

1. **Lead Events**: Information about potential customer leads
2. **User Engagement**: Information about user interactions with your platform
3. **Event Attendance**: Information about event attendees and registrations

### API Endpoints

The base URL for all API endpoints is `https://api.epai.example.com/v1`.

#### Authentication

All requests must include your API key in the `apikey` header:

```
apikey: YOUR_API_KEY
```

#### Ingesting Data

POST `/ingest`

Request body:
```json
{
  "eventType": "lead",
  "data": {
    "leadId": "12345",
    "email": "customer@example.com",
    "name": "John Doe",
    "source": "website",
    "timestamp": "2024-08-01T12:34:56Z",
    "attributes": {
      "industry": "healthcare",
      "company_size": "50-100",
      "budget": "10000-50000"
    }
  }
}
```

## Troubleshooting

### Common Issues

#### API Key Invalid

If you receive a 401 Unauthorized response with "Invalid API key" message:
- Verify you're using the correct API key
- Check that the API key is included in the `apikey` header
- Ensure the API key hasn't expired or been regenerated

#### Rate Limiting

If you receive a 429 Too Many Requests response:
- Implement backoff and retry logic in your application
- Optimize your code to reduce the number of API calls
- Contact support if you need a higher rate limit

#### SDK Not Rendering

If the SDK doesn't render insights:
- Check browser console for JavaScript errors
- Verify that your API key is correct
- Ensure you've sent enough data to generate insights
- Make sure the container element exists in the DOM

## Support

During the pilot program, you have access to dedicated support:

- **Email**: pilot-support@epai.example.com
- **Phone**: +1 (555) 123-4567
- **Office Hours**: Monday-Friday, 9 AM - 5 PM EST

We aim to respond to all support requests within 4 business hours.

### Reporting Bugs

When reporting bugs, please include:
1. Detailed steps to reproduce the issue
2. Screenshots if applicable
3. Browser and operating system information
4. API request and response data (with sensitive information redacted)

### Feature Requests

We welcome your feedback and feature requests! Please email pilot-feedback@epai.example.com with your suggestions.

## Feedback and Next Steps

Your feedback is crucial to the success of the EPAI platform. Throughout the pilot, you'll be asked to participate in:

- Weekly check-in calls
- Feature feedback surveys
- Usage data collection (anonymized)
- Final pilot review session

After the pilot period concludes, you'll have the option to:
1. Continue as a paying customer (with a pilot participant discount)
2. Discontinue use of the platform
3. Discuss custom pricing and features based on your specific needs

Thank you for participating in our pilot program! 