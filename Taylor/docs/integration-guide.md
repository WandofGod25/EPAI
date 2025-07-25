# EPAI Integration Guide

This guide will help you integrate the Embedded Predictive Analytics Integrator (EPAI) platform into your application.

## Overview

EPAI consists of two main components:
1. **Data Ingestion API** - Send your data to EPAI for analysis
2. **UI Embedding SDK** - Display generated insights in your application

## Prerequisites

- An EPAI account with API key
- Basic knowledge of JavaScript and REST APIs

## Step 1: Data Ingestion

First, you'll need to send data to EPAI using the Data Ingestion API.

### Authentication

All API requests require your API key, which should be included in the `apikey` header:

```javascript
const response = await fetch('https://your-supabase-url.supabase.co/functions/v1/ingest-v2', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'your_epai_api_key'  // API key should be sent in 'apikey' header
  },
  body: JSON.stringify({
    eventType: 'event_registration',
    payload: {
      // Your event data here
    }
  })
});
```

### Event Types

EPAI supports the following event types:

#### 1. Event Registration
```javascript
{
  "eventType": "event_registration",
  "payload": {
    "eventId": "evt-123",
    "eventName": "Annual Conference",
    "eventDate": "2024-12-10",
    "venue": {
      "name": "Convention Center",
      "capacity": 1000
    },
    "category": "Conference",
    "registrations": [
      {
        "userId": "user-123",
        "registrationDate": "2024-09-15",
        "ticketType": "VIP"
      }
    ]
  }
}
```

#### 2. User Profile Update
```javascript
{
  "eventType": "user_profile_update",
  "payload": {
    "userId": "user-123",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "preferences": {
      "eventTypes": ["Conference", "Workshop"],
      "communications": ["email", "push"]
    },
    "updateDate": "2024-09-16"
  }
}
```

#### 3. User Engagement
```javascript
{
  "eventType": "user_engagement",
  "payload": {
    "userId": "user-123",
    "contentId": "content-456",
    "contentType": "email",
    "action": "open",
    "duration": 45,
    "timestamp": "2024-09-16T14:32:10Z"
  }
}
```

#### 4. Event Attendance
```javascript
{
  "eventType": "event_attendance",
  "payload": {
    "eventId": "evt-123",
    "attendees": [
      {
        "userId": "user-123",
        "checkInTime": "2024-12-10T09:15:00Z",
        "checkOutTime": "2024-12-10T17:30:00Z"
      }
    ],
    "totalRegistered": 850,
    "totalAttended": 723
  }
}
```

### Response Handling

A successful response will have a 201 status code and a body like this:

```javascript
{
  "status": "success",
  "message": "Event ingested",
  "eventId": "e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6"
}
```

Handle errors appropriately:

```javascript
if (!response.ok) {
  const error = await response.json();
  console.error('Error ingesting data:', error);
}
```

## Step 2: Embedding Insights

After you've sent data to EPAI, you can display insights using the UI Embedding SDK.

### Option 1: Script Tag Integration

Add the EPAI SDK to your HTML:

```html
<script 
  src="https://your-supabase-url.supabase.co/storage/v1/object/public/sdk/epai-sdk.iife.js" 
  data-epai-api-key="your_epai_api_key" 
  data-epai-url="https://your-supabase-url.supabase.co"
  data-epai-theme="light"
></script>

<!-- Create a container for your insight -->
<div id="insight-container"></div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // Wait for SDK to initialize
    setTimeout(() => {
      // Render an insight
      window.epaiInsightSDK.renderInsight({
        insightId: 'your-insight-id',
        containerId: 'insight-container',
        showConfidence: true,
        showTitle: true,
        compact: false
      });
    }, 500);
  });
</script>
```

### Option 2: NPM Package Integration

If you prefer to use NPM:

```bash
npm install @epai/insight-sdk
```

Then import and use the SDK:

```javascript
import { InsightCard } from '@epai/insight-sdk';

function App() {
  return (
    <div>
      <InsightCard
        apiKey="your_epai_api_key"
        supabaseUrl="https://your-supabase-url.supabase.co"
        insightId="your-insight-id"
        showConfidence={true}
        showTitle={true}
        theme="light"
      />
    </div>
  );
}
```

### Customization Options

The SDK supports several customization options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showConfidence` | boolean | `true` | Whether to show the confidence score |
| `showTitle` | boolean | `true` | Whether to show the insight title |
| `compact` | boolean | `false` | Whether to use the compact layout |
| `theme` | string | `'light'` | Color theme ('light' or 'dark') |

## Step 3: Monitoring & Management

Use the EPAI Admin Panel to monitor your integration:

1. Log in to your EPAI account at https://your-supabase-url.supabase.co
2. Navigate to the "Logs" page to see your API requests
3. Check the "Insights" page to view generated insights
4. Use the "Settings" page to manage your API keys

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check your API key is correct and included in the `apikey` header
2. **400 Bad Request**: Ensure your event data follows the correct schema
3. **429 Too Many Requests**: You've exceeded the rate limit, try again later
4. **Insight Not Found**: The insight ID may be incorrect or the insight hasn't been generated yet

### Support

If you need assistance, contact support at support@epai.example.com or join our Slack community. 