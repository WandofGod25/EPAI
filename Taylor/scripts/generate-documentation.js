#!/usr/bin/env node

/**
 * EPAI Documentation Generator
 * 
 * This script generates comprehensive documentation for the EPAI platform.
 * It creates:
 * 1. API documentation with OpenAPI specs
 * 2. SDK integration guide
 * 3. Architecture documentation
 * 4. Security documentation
 * 
 * Usage:
 * node scripts/generate-documentation.js
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Configuration
const CONFIG = {
  outputDir: path.join(process.cwd(), 'docs'),
  apiDocsDir: path.join(process.cwd(), 'docs', 'api'),
  sdkDocsDir: path.join(process.cwd(), 'docs', 'sdk'),
  architectureDocsDir: path.join(process.cwd(), 'docs', 'architecture'),
  securityDocsDir: path.join(process.cwd(), 'docs', 'security'),
};

// Helper function for logging
function log(message, type = 'info') {
  const prefix = {
    info: chalk.blue('ℹ'),
    success: chalk.green('✓'),
    error: chalk.red('✗'),
    warning: chalk.yellow('⚠'),
    step: chalk.cyan('➤'),
  };
  
  console.log(`${prefix[type]} ${message}`);
}

// Helper function to write to file
function writeToFile(filePath, content) {
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, content);
  log(`File written: ${filePath}`, 'success');
  return filePath;
}

// Function to generate API documentation
function generateApiDocs() {
  log('Generating API documentation...', 'step');
  
  // Ensure API docs directory exists
  if (!fs.existsSync(CONFIG.apiDocsDir)) {
    fs.mkdirSync(CONFIG.apiDocsDir, { recursive: true });
  }
  
  // Generate OpenAPI specification
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'EPAI API',
      version: '1.0.0',
      description: 'API documentation for the Embedded Predictive Analytics Integrator',
    },
    servers: [
      {
        url: 'https://api.epai.example.com',
        description: 'Production server',
      },
      {
        url: 'https://staging-api.epai.example.com',
        description: 'Staging server',
      },
    ],
    paths: {
      '/ingest': {
        post: {
          summary: 'Ingest event data',
          description: 'Ingests event data for predictive analytics processing',
          tags: ['Data Ingestion'],
          security: [
            {
              ApiKeyAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/IngestionEvent',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Event successfully ingested',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: {
                        type: 'boolean',
                        example: true,
                      },
                      message: {
                        type: 'string',
                        example: 'Event ingested successfully',
                      },
                      eventId: {
                        type: 'string',
                        format: 'uuid',
                        example: '123e4567-e89b-12d3-a456-426614174000',
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Invalid request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '429': {
              description: 'Too many requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/get-insights': {
        get: {
          summary: 'Get insights',
          description: 'Retrieves insights generated from ingested data',
          tags: ['Insights'],
          security: [
            {
              ApiKeyAuth: [],
            },
          ],
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of insights to return',
              schema: {
                type: 'integer',
                default: 10,
                minimum: 1,
                maximum: 100,
              },
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Number of insights to skip',
              schema: {
                type: 'integer',
                default: 0,
                minimum: 0,
              },
            },
          ],
          responses: {
            '200': {
              description: 'Insights retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      insights: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Insight',
                        },
                      },
                      count: {
                        type: 'integer',
                        example: 10,
                      },
                      total: {
                        type: 'integer',
                        example: 42,
                      },
                    },
                  },
                },
              },
            },
            '401': {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            '429': {
              description: 'Too many requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        IngestionEvent: {
          type: 'object',
          required: ['event_type', 'data', 'source', 'version'],
          properties: {
            event_type: {
              type: 'string',
              description: 'Type of event being ingested',
              example: 'page_view',
              enum: ['page_view', 'user_engagement', 'event_attendance', 'custom'],
            },
            data: {
              type: 'object',
              description: 'Event data',
              additionalProperties: true,
            },
            source: {
              type: 'string',
              description: 'Source of the event',
              example: 'web_app',
            },
            version: {
              type: 'string',
              description: 'Version of the event schema',
              example: '1.0.0',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata for the event',
              additionalProperties: true,
            },
          },
        },
        Insight: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            model_id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            content: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  example: 'Attendance Forecast',
                },
                description: {
                  type: 'string',
                  example: 'Based on current registrations, expect 85% attendance',
                },
                confidence: {
                  type: 'number',
                  format: 'float',
                  example: 0.92,
                },
                recommendation: {
                  type: 'string',
                  example: 'Consider sending a reminder email 24 hours before the event',
                },
              },
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-08-01T12:00:00Z',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Invalid API key',
            },
            code: {
              type: 'string',
              example: 'auth/invalid-api-key',
            },
          },
        },
      },
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'apikey',
        },
      },
    },
  };
  
  // Write OpenAPI spec to file
  writeToFile(
    path.join(CONFIG.apiDocsDir, 'openapi.json'),
    JSON.stringify(openApiSpec, null, 2)
  );
  
  // Generate API endpoints documentation
  const apiEndpointsDoc = `# EPAI API Endpoints

## Overview

The EPAI API provides endpoints for data ingestion and insight retrieval. All endpoints require authentication using an API key.

## Authentication

All API requests must include an API key in the \`apikey\` header:

\`\`\`
apikey: epai_your_api_key
\`\`\`

API keys can be generated and managed in the EPAI Admin Panel under Settings.

## Rate Limiting

API endpoints are rate limited to protect the system from abuse. The default limits are:

- 120 requests per minute per API key
- 30 requests per minute per IP address

Rate limit headers are included in all responses:

\`\`\`
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 60
\`\`\`

## Endpoints

### POST /ingest

Ingests event data for predictive analytics processing.

**Request Body:**

\`\`\`json
{
  "event_type": "page_view",
  "data": {
    "url": "https://example.com/product/123",
    "referrer": "https://example.com",
    "title": "Product Page",
    "user_agent": "Mozilla/5.0...",
    "session_id": "abc123"
  },
  "source": "web_app",
  "version": "1.0.0"
}
\`\`\`

**Response:**

\`\`\`json
{
  "success": true,
  "message": "Event ingested successfully",
  "eventId": "123e4567-e89b-12d3-a456-426614174000"
}
\`\`\`

### GET /get-insights

Retrieves insights generated from ingested data.

**Query Parameters:**

- \`limit\` (optional): Maximum number of insights to return (default: 10, max: 100)
- \`offset\` (optional): Number of insights to skip (default: 0)

**Response:**

\`\`\`json
{
  "insights": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "model_id": "123e4567-e89b-12d3-a456-426614174001",
      "content": {
        "title": "Attendance Forecast",
        "description": "Based on current registrations, expect 85% attendance",
        "confidence": 0.92,
        "recommendation": "Consider sending a reminder email 24 hours before the event"
      },
      "created_at": "2024-08-01T12:00:00Z"
    }
  ],
  "count": 1,
  "total": 42
}
\`\`\`

## Error Handling

All errors return an appropriate HTTP status code and a JSON response with error details:

\`\`\`json
{
  "error": true,
  "message": "Invalid API key",
  "code": "auth/invalid-api-key"
}
\`\`\`

Common error codes:

- \`auth/invalid-api-key\`: The provided API key is invalid
- \`auth/expired-api-key\`: The provided API key has expired
- \`rate-limit/exceeded\`: Rate limit exceeded
- \`validation/invalid-request\`: The request body is invalid
`;
  
  writeToFile(
    path.join(CONFIG.apiDocsDir, 'endpoints.md'),
    apiEndpointsDoc
  );
  
  // Generate API usage examples
  const apiExamplesDoc = `# EPAI API Usage Examples

## JavaScript / Node.js

### Ingesting an Event

\`\`\`javascript
const apiKey = 'epai_your_api_key';
const apiUrl = 'https://api.epai.example.com';

async function ingestEvent() {
  const event = {
    event_type: 'page_view',
    data: {
      url: 'https://example.com/product/123',
      referrer: 'https://example.com',
      title: 'Product Page',
      user_agent: 'Mozilla/5.0...',
      session_id: 'abc123'
    },
    source: 'web_app',
    version: '1.0.0'
  };

  try {
    const response = await fetch(\`\${apiUrl}/ingest\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('Event ingested successfully:', data);
  } catch (error) {
    console.error('Error ingesting event:', error);
  }
}

ingestEvent();
\`\`\`

### Retrieving Insights

\`\`\`javascript
const apiKey = 'epai_your_api_key';
const apiUrl = 'https://api.epai.example.com';

async function getInsights() {
  try {
    const response = await fetch(\`\${apiUrl}/get-insights?limit=5\`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('Insights retrieved successfully:', data);
  } catch (error) {
    console.error('Error retrieving insights:', error);
  }
}

getInsights();
\`\`\`

## Python

### Ingesting an Event

\`\`\`python
import requests
import json

api_key = 'epai_your_api_key'
api_url = 'https://api.epai.example.com'

def ingest_event():
    event = {
        'event_type': 'page_view',
        'data': {
            'url': 'https://example.com/product/123',
            'referrer': 'https://example.com',
            'title': 'Product Page',
            'user_agent': 'Mozilla/5.0...',
            'session_id': 'abc123'
        },
        'source': 'web_app',
        'version': '1.0.0'
    }

    headers = {
        'Content-Type': 'application/json',
        'apikey': api_key
    }

    try:
        response = requests.post(f'{api_url}/ingest', headers=headers, data=json.dumps(event))
        response.raise_for_status()
        data = response.json()
        print('Event ingested successfully:', data)
    except requests.exceptions.RequestException as e:
        print('Error ingesting event:', e)

ingest_event()
\`\`\`

### Retrieving Insights

\`\`\`python
import requests

api_key = 'epai_your_api_key'
api_url = 'https://api.epai.example.com'

def get_insights():
    headers = {
        'Content-Type': 'application/json',
        'apikey': api_key
    }

    try:
        response = requests.get(f'{api_url}/get-insights?limit=5', headers=headers)
        response.raise_for_status()
        data = response.json()
        print('Insights retrieved successfully:', data)
    except requests.exceptions.RequestException as e:
        print('Error retrieving insights:', e)

get_insights()
\`\`\`

## cURL

### Ingesting an Event

\`\`\`bash
curl -X POST 'https://api.epai.example.com/ingest' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: epai_your_api_key' \\
  -d '{
    "event_type": "page_view",
    "data": {
      "url": "https://example.com/product/123",
      "referrer": "https://example.com",
      "title": "Product Page",
      "user_agent": "Mozilla/5.0...",
      "session_id": "abc123"
    },
    "source": "web_app",
    "version": "1.0.0"
  }'
\`\`\`

### Retrieving Insights

\`\`\`bash
curl -X GET 'https://api.epai.example.com/get-insights?limit=5' \\
  -H 'Content-Type: application/json' \\
  -H 'apikey: epai_your_api_key'
\`\`\`
`;
  
  writeToFile(
    path.join(CONFIG.apiDocsDir, 'examples.md'),
    apiExamplesDoc
  );
  
  log('API documentation generated successfully', 'success');
}

// Function to generate SDK documentation
function generateSdkDocs() {
  log('Generating SDK documentation...', 'step');
  
  // Ensure SDK docs directory exists
  if (!fs.existsSync(CONFIG.sdkDocsDir)) {
    fs.mkdirSync(CONFIG.sdkDocsDir, { recursive: true });
  }
  
  // Generate SDK integration guide
  const sdkIntegrationGuide = `# EPAI SDK Integration Guide

## Overview

The EPAI SDK allows you to embed predictive analytics insights directly into your application. The SDK provides React components and a standalone script for easy integration.

## Installation

### React Component

Install the SDK package:

\`\`\`bash
npm install @epai/insight-sdk
# or
yarn add @epai/insight-sdk
# or
pnpm add @epai/insight-sdk
\`\`\`

### Script Tag

Add the SDK loader script to your HTML:

\`\`\`html
<script src="https://api.epai.example.com/functions/v1/sdk-loader.js"></script>
\`\`\`

## Usage

### React Component

Import and use the InsightCard component:

\`\`\`jsx
import { InsightCard } from '@epai/insight-sdk';

function App() {
  return (
    <div>
      <h1>My Application</h1>
      <InsightCard 
        apiKey="epai_your_api_key"
        insightId="123e4567-e89b-12d3-a456-426614174000"
        theme="light"
        showConfidence={true}
      />
    </div>
  );
}
\`\`\`

### Script Tag

Add a container element with data attributes:

\`\`\`html
<div id="insight-container" 
     data-api-key="epai_your_api_key" 
     data-insight-id="123e4567-e89b-12d3-a456-426614174000"
     data-theme="light"
     data-show-confidence="true">
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.EPAI.init();
  });
</script>
\`\`\`

## API Reference

### InsightCard Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`apiKey\` | string | required | Your EPAI API key |
| \`insightId\` | string | required | ID of the insight to display |
| \`theme\` | string | 'light' | Theme ('light' or 'dark') |
| \`showConfidence\` | boolean | true | Whether to show confidence score |
| \`showTitle\` | boolean | true | Whether to show the insight title |
| \`compact\` | boolean | false | Whether to use compact layout |

### Script Tag Data Attributes

| Attribute | Description |
|-----------|-------------|
| \`data-api-key\` | Your EPAI API key |
| \`data-insight-id\` | ID of the insight to display |
| \`data-theme\` | Theme ('light' or 'dark') |
| \`data-show-confidence\` | Whether to show confidence score ('true' or 'false') |
| \`data-show-title\` | Whether to show the insight title ('true' or 'false') |
| \`data-compact\` | Whether to use compact layout ('true' or 'false') |

## Customization

### Custom Styling

You can customize the appearance of the InsightCard component using CSS variables:

\`\`\`css
:root {
  --epai-primary-color: #4f46e5;
  --epai-text-color: #1f2937;
  --epai-background-color: #ffffff;
  --epai-border-color: #e5e7eb;
  --epai-border-radius: 8px;
  --epai-font-family: 'Inter', sans-serif;
}
\`\`\`

### Custom Themes

The SDK includes two built-in themes: 'light' and 'dark'. You can switch between them using the \`theme\` prop or \`data-theme\` attribute.

## Examples

### Basic Example

\`\`\`jsx
import { InsightCard } from '@epai/insight-sdk';

function App() {
  return (
    <div>
      <InsightCard 
        apiKey="epai_your_api_key"
        insightId="123e4567-e89b-12d3-a456-426614174000"
      />
    </div>
  );
}
\`\`\`

### Custom Theme Example

\`\`\`jsx
import { InsightCard } from '@epai/insight-sdk';
import './custom-theme.css';

function App() {
  return (
    <div>
      <InsightCard 
        apiKey="epai_your_api_key"
        insightId="123e4567-e89b-12d3-a456-426614174000"
        theme="dark"
        showConfidence={false}
        compact={true}
      />
    </div>
  );
}
\`\`\`

### Multiple Insights Example

\`\`\`jsx
import { InsightCard } from '@epai/insight-sdk';

function Dashboard() {
  const insights = [
    '123e4567-e89b-12d3-a456-426614174000',
    '123e4567-e89b-12d3-a456-426614174001',
    '123e4567-e89b-12d3-a456-426614174002',
  ];

  return (
    <div className="dashboard">
      <h1>Analytics Dashboard</h1>
      <div className="insights-grid">
        {insights.map(insightId => (
          <InsightCard 
            key={insightId}
            apiKey="epai_your_api_key"
            insightId={insightId}
          />
        ))}
      </div>
    </div>
  );
}
\`\`\`

## Troubleshooting

### Common Issues

#### API Key Errors

If you see an error related to your API key:

1. Check that your API key is valid and has not expired
2. Ensure you're using the correct API key format (starts with \`epai_\`)
3. Verify that your API key has permission to access insights

#### Insight Not Found

If an insight is not displayed:

1. Verify that the insight ID is correct
2. Check that the insight exists in your account
3. Ensure your API key has permission to access the insight

#### CORS Errors

If you see CORS-related errors:

1. Ensure your domain is allowed in the EPAI Admin Panel
2. Check that you're using the correct API URL
3. Verify that your browser supports CORS

### Support

If you encounter any issues with the SDK, please contact support at support@epai.example.com.
`;
  
  writeToFile(
    path.join(CONFIG.sdkDocsDir, 'integration-guide.md'),
    sdkIntegrationGuide
  );
  
  // Generate SDK component reference
  const sdkComponentReference = `# EPAI SDK Component Reference

## InsightCard

The \`InsightCard\` component displays a predictive analytics insight in a card format.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`apiKey\` | string | required | Your EPAI API key |
| \`insightId\` | string | required | ID of the insight to display |
| \`theme\` | string | 'light' | Theme ('light' or 'dark') |
| \`showConfidence\` | boolean | true | Whether to show confidence score |
| \`showTitle\` | boolean | true | Whether to show the insight title |
| \`compact\` | boolean | false | Whether to use compact layout |
| \`className\` | string | '' | Additional CSS class for the card |
| \`style\` | object | {} | Additional inline styles for the card |
| \`onLoad\` | function | undefined | Callback function called when the insight is loaded |
| \`onError\` | function | undefined | Callback function called when an error occurs |

### Examples

#### Basic Usage

\`\`\`jsx
import { InsightCard } from '@epai/insight-sdk';

function App() {
  return (
    <InsightCard 
      apiKey="epai_your_api_key"
      insightId="123e4567-e89b-12d3-a456-426614174000"
    />
  );
}
\`\`\`

#### With Custom Styling

\`\`\`jsx
import { InsightCard } from '@epai/insight-sdk';

function App() {
  return (
    <InsightCard 
      apiKey="epai_your_api_key"
      insightId="123e4567-e89b-12d3-a456-426614174000"
      theme="dark"
      className="my-custom-card"
      style={{ maxWidth: '400px' }}
    />
  );
}
\`\`\`

#### With Event Handlers

\`\`\`jsx
import { InsightCard } from '@epai/insight-sdk';

function App() {
  const handleInsightLoad = (insight) => {
    console.log('Insight loaded:', insight);
  };

  const handleInsightError = (error) => {
    console.error('Error loading insight:', error);
  };

  return (
    <InsightCard 
      apiKey="epai_your_api_key"
      insightId="123e4567-e89b-12d3-a456-426614174000"
      onLoad={handleInsightLoad}
      onError={handleInsightError}
    />
  );
}
\`\`\`

## SDK Loader

The SDK Loader is a standalone script that automatically initializes and renders insights based on data attributes.

### Usage

\`\`\`html
<script src="https://api.epai.example.com/functions/v1/sdk-loader.js"></script>

<div id="insight-container" 
     data-api-key="epai_your_api_key" 
     data-insight-id="123e4567-e89b-12d3-a456-426614174000">
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    window.EPAI.init();
  });
</script>
\`\`\`

### Data Attributes

| Attribute | Description |
|-----------|-------------|
| \`data-api-key\` | Your EPAI API key |
| \`data-insight-id\` | ID of the insight to display |
| \`data-theme\` | Theme ('light' or 'dark') |
| \`data-show-confidence\` | Whether to show confidence score ('true' or 'false') |
| \`data-show-title\` | Whether to show the insight title ('true' or 'false') |
| \`data-compact\` | Whether to use compact layout ('true' or 'false') |

### Manual Initialization

You can manually initialize the SDK and render insights:

\`\`\`html
<div id="custom-container"></div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize the SDK
    window.EPAI.init();
    
    // Render an insight into a specific container
    window.EPAI.renderInsight({
      container: document.getElementById('custom-container'),
      apiKey: 'epai_your_api_key',
      insightId: '123e4567-e89b-12d3-a456-426614174000',
      theme: 'dark',
      showConfidence: false
    });
  });
</script>
\`\`\`

### API

The SDK Loader exposes the following methods:

#### init()

Initializes the SDK and automatically renders insights in containers with data attributes.

\`\`\`javascript
window.EPAI.init();
\`\`\`

#### renderInsight(options)

Renders an insight into a specific container.

\`\`\`javascript
window.EPAI.renderInsight({
  container: document.getElementById('custom-container'),
  apiKey: 'epai_your_api_key',
  insightId: '123e4567-e89b-12d3-a456-426614174000',
  theme: 'light',
  showConfidence: true,
  showTitle: true,
  compact: false
});
\`\`\`

#### getInsight(options)

Fetches an insight without rendering it.

\`\`\`javascript
window.EPAI.getInsight({
  apiKey: 'epai_your_api_key',
  insightId: '123e4567-e89b-12d3-a456-426614174000'
}).then(insight => {
  console.log('Insight:', insight);
}).catch(error => {
  console.error('Error:', error);
});
\`\`\`
`;
  
  writeToFile(
    path.join(CONFIG.sdkDocsDir, 'component-reference.md'),
    sdkComponentReference
  );
  
  log('SDK documentation generated successfully', 'success');
}

// Function to generate architecture documentation
function generateArchitectureDocs() {
  log('Generating architecture documentation...', 'step');
  
  // Ensure architecture docs directory exists
  if (!fs.existsSync(CONFIG.architectureDocsDir)) {
    fs.mkdirSync(CONFIG.architectureDocsDir, { recursive: true });
  }
  
  // Generate system architecture overview
  const systemArchitectureOverview = `# EPAI System Architecture

## Overview

The Embedded Predictive Analytics Integrator (EPAI) is a platform that enables partners to integrate predictive analytics capabilities into their applications. The platform consists of several components that work together to ingest data, generate insights, and deliver those insights to partner applications.

## Architecture Diagram

\`\`\`
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Partner App    │     │  Admin Panel    │     │  SDK            │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Layer                                │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐│
│  │ Ingest      │  │ API Key     │  │ Get Insights│  │ Get      ││
│  │ Endpoint    │  │ Management  │  │ Endpoint    │  │ Models   ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘│
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                       Database Layer                           │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────┐ │
│  │ Partners    │  │ API Keys    │  │ Insights    │  │ Models │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────┘ │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Ingestion   │  │ Logs        │  │ Security    │            │
│  │ Events      │  │             │  │ Events      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└────────────────────────────┬───────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────┐
│                     Processing Layer                           │
│                                                                │
│  ┌─────────────────────┐      ┌─────────────────────┐         │
│  │ Orchestrator        │      │ Prediction Models   │         │
│  └─────────────────────┘      └─────────────────────┘         │
└────────────────────────────────────────────────────────────────┘
\`\`\`

## Components

### Frontend Components

#### Admin Panel

The Admin Panel is a React application that provides partners with a user interface to manage their account, view insights, and access their API key. It includes:

- Authentication (login/signup)
- Dashboard with usage statistics
- API key management
- Logs viewer
- Models viewer
- Insights viewer
- SDK integration guide

#### SDK

The SDK is a JavaScript library that partners can use to embed insights into their applications. It includes:

- React components for embedding insights
- Standalone script for non-React applications
- API client for fetching insights

### Backend Components

#### API Layer

The API layer consists of Supabase Edge Functions that handle requests from the frontend and partner applications:

- **Ingest Endpoint**: Receives event data from partner applications
- **API Key Management**: Handles API key generation and validation
- **Get Insights Endpoint**: Returns insights for a partner
- **Get Models Endpoint**: Returns available models for a partner

#### Database Layer

The database layer is a PostgreSQL database hosted by Supabase. It includes the following tables:

- **Partners**: Information about partners
- **API Keys**: API keys for partners
- **Insights**: Generated insights
- **Models**: Available prediction models
- **Ingestion Events**: Raw event data from partners
- **Logs**: API request logs
- **Security Events**: Security-related events

#### Processing Layer

The processing layer handles the generation of insights from ingested data:

- **Orchestrator**: Coordinates the processing of ingested data
- **Prediction Models**: Generate insights from ingested data

## Data Flow

1. **Data Ingestion**:
   - Partner applications send event data to the Ingest Endpoint
   - The Ingest Endpoint validates and stores the data in the Ingestion Events table
   - The Orchestrator is triggered by a new event

2. **Insight Generation**:
   - The Orchestrator selects an appropriate prediction model
   - The prediction model processes the event data
   - The generated insight is stored in the Insights table

3. **Insight Delivery**:
   - Partner applications request insights using the SDK
   - The SDK calls the Get Insights Endpoint
   - The Get Insights Endpoint returns insights for the partner
   - The SDK renders the insights in the partner application

## Security Architecture

The EPAI platform implements several security measures:

- **Authentication**: JWT-based authentication for the Admin Panel
- **API Key Authentication**: API key authentication for partner applications
- **Row Level Security**: PostgreSQL Row Level Security (RLS) policies ensure partners can only access their own data
- **API Key Hashing**: API keys are stored as bcrypt hashes
- **Rate Limiting**: API endpoints are rate limited to prevent abuse
- **Security Event Logging**: Security-related events are logged for auditing
- **Data Sanitization**: Sensitive data is masked in logs and error messages
- **Security Headers**: Security headers are added to all responses

## Deployment Architecture

The EPAI platform is deployed using Supabase:

- **Database**: PostgreSQL database hosted by Supabase
- **Edge Functions**: Serverless functions hosted by Supabase
- **Authentication**: Supabase Auth for user authentication
- **Storage**: Supabase Storage for static assets
- **Realtime**: Supabase Realtime for real-time updates (future)
`;
  
  writeToFile(
    path.join(CONFIG.architectureDocsDir, 'system-overview.md'),
    systemArchitectureOverview
  );
  
  // Generate database schema documentation
  const databaseSchemaDoc = `# EPAI Database Schema

## Overview

The EPAI platform uses a PostgreSQL database hosted by Supabase. The database schema is designed to support the core functionality of the platform, including partner management, data ingestion, insight generation, and security.

## Tables

### Partners

The \`partners\` table stores information about partners using the platform.

\`\`\`sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### API Keys

The \`api_keys\` table stores API keys for partners.

\`\`\`sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  key_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (partner_id)
);
\`\`\`

### Models

The \`models\` table stores information about prediction models available to partners.

\`\`\`sql
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Ingestion Events

The \`ingestion_events\` table stores raw event data from partners.

\`\`\`sql
CREATE TABLE ingestion_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  event_type TEXT NOT NULL,
  data JSONB NOT NULL,
  source TEXT NOT NULL,
  version TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Insights

The \`insights\` table stores generated insights.

\`\`\`sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  model_id UUID REFERENCES models(id),
  content JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Logs

The \`logs\` table stores API request logs.

\`\`\`sql
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status INTEGER NOT NULL,
  duration INTEGER,
  request_body JSONB,
  response_body JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

### Security Events

The \`security_events\` table stores security-related events.

\`\`\`sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  partner_id UUID REFERENCES partners(id),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`

## Row Level Security Policies

The EPAI platform uses PostgreSQL Row Level Security (RLS) policies to ensure partners can only access their own data.

### Partners Table

\`\`\`sql
-- Partners can only view their own record
CREATE POLICY partners_select_policy ON partners
  FOR SELECT
  USING (user_id = auth.uid());

-- Partners can only update their own record
CREATE POLICY partners_update_policy ON partners
  FOR UPDATE
  USING (user_id = auth.uid());
\`\`\`

### API Keys Table

\`\`\`sql
-- Partners can only view their own API keys
CREATE POLICY api_keys_select_policy ON api_keys
  FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Partners can only update their own API keys
CREATE POLICY api_keys_update_policy ON api_keys
  FOR UPDATE
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Partners can only insert API keys for themselves
CREATE POLICY api_keys_insert_policy ON api_keys
  FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
\`\`\`

### Ingestion Events Table

\`\`\`sql
-- Partners can only view their own ingestion events
CREATE POLICY ingestion_events_select_policy ON ingestion_events
  FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Partners can only insert ingestion events for themselves
CREATE POLICY ingestion_events_insert_policy ON ingestion_events
  FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
\`\`\`

### Insights Table

\`\`\`sql
-- Partners can only view their own insights
CREATE POLICY insights_select_policy ON insights
  FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
\`\`\`

### Logs Table

\`\`\`sql
-- Partners can only view their own logs
CREATE POLICY logs_select_policy ON logs
  FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
\`\`\`

## Database Functions

The EPAI platform uses several database functions to implement business logic.

### API Key Management

\`\`\`sql
-- Get API key for partner
CREATE OR REPLACE FUNCTION get_api_key_for_partner()
RETURNS TABLE(api_key_id UUID, created_at TIMESTAMP WITH TIME ZONE, expires_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT ak.id, ak.created_at, ak.expires_at
  FROM api_keys ak
  JOIN partners p ON ak.partner_id = p.id
  WHERE p.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Regenerate API key for partner
CREATE OR REPLACE FUNCTION regenerate_api_key_for_partner()
RETURNS TABLE(api_key TEXT) AS $$
DECLARE
  v_partner_id UUID;
  v_api_key TEXT;
  v_api_key_hash TEXT;
BEGIN
  -- Get the partner ID for the current user
  SELECT id INTO v_partner_id
  FROM partners
  WHERE user_id = auth.uid();
  
  -- Generate a new API key
  v_api_key := 'epai_' || encode(gen_random_bytes(24), 'base64');
  -- Hash the API key for storage
  v_api_key_hash := crypt(v_api_key, gen_salt('bf'));
  
  -- Update or insert the API key
  INSERT INTO api_keys (partner_id, key_hash, expires_at)
  VALUES (v_partner_id, v_api_key_hash, NOW() + INTERVAL '90 days')
  ON CONFLICT (partner_id)
  DO UPDATE SET
    key_hash = v_api_key_hash,
    expires_at = NOW() + INTERVAL '90 days';
  
  -- Return the plaintext key (only time it's available)
  RETURN QUERY SELECT v_api_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

### Logs Access

\`\`\`sql
-- Get logs for partner
CREATE OR REPLACE FUNCTION get_logs_for_partner(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  endpoint TEXT,
  method TEXT,
  status INTEGER,
  duration INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT l.id, l.endpoint, l.method, l.status, l.duration, l.created_at
  FROM logs l
  JOIN partners p ON l.partner_id = p.id
  WHERE p.user_id = auth.uid()
  ORDER BY l.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`

### Usage Statistics

\`\`\`sql
-- Get usage statistics for partner
CREATE OR REPLACE FUNCTION get_partner_usage_summary(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  date DATE,
  event_count INTEGER,
  insight_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT date::DATE
    FROM generate_series(
      CURRENT_DATE - (p_days - 1) * INTERVAL '1 day',
      CURRENT_DATE,
      INTERVAL '1 day'
    ) AS date
  ),
  events AS (
    SELECT
      DATE(ie.created_at) AS date,
      COUNT(*) AS event_count
    FROM ingestion_events ie
    JOIN partners p ON ie.partner_id = p.id
    WHERE
      p.user_id = auth.uid() AND
      ie.created_at >= CURRENT_DATE - p_days * INTERVAL '1 day'
    GROUP BY DATE(ie.created_at)
  ),
  insights AS (
    SELECT
      DATE(i.created_at) AS date,
      COUNT(*) AS insight_count
    FROM insights i
    JOIN partners p ON i.partner_id = p.id
    WHERE
      p.user_id = auth.uid() AND
      i.created_at >= CURRENT_DATE - p_days * INTERVAL '1 day'
    GROUP BY DATE(i.created_at)
  )
  SELECT
    d.date,
    COALESCE(e.event_count, 0) AS event_count,
    COALESCE(i.insight_count, 0) AS insight_count
  FROM dates d
  LEFT JOIN events e ON d.date = e.date
  LEFT JOIN insights i ON d.date = i.date
  ORDER BY d.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
\`\`\`
`;
  
  writeToFile(
    path.join(CONFIG.architectureDocsDir, 'database-schema.md'),
    databaseSchemaDoc
  );
  
  log('Architecture documentation generated successfully', 'success');
}

// Function to generate security documentation
function generateSecurityDocs() {
  log('Generating security documentation...', 'step');
  
  // Ensure security docs directory exists
  if (!fs.existsSync(CONFIG.securityDocsDir)) {
    fs.mkdirSync(CONFIG.securityDocsDir, { recursive: true });
  }
  
  // Generate security overview
  const securityOverview = `# EPAI Security Overview

## Introduction

This document provides an overview of the security measures implemented in the EPAI platform. It covers authentication, authorization, data protection, API security, and monitoring.

## Authentication & Authorization

### User Authentication

The EPAI platform uses Supabase Auth for user authentication, which provides:

- Secure password hashing using bcrypt
- Email verification
- Password reset functionality
- JWT-based session management
- Protection against common attacks (brute force, CSRF, etc.)

### API Key Authentication

API keys are used to authenticate partner applications:

- Format: \`epai_[32+ random characters]\`
- Stored as bcrypt hashes in the database
- Automatic expiration after 90 days
- Required rotation after 180 days
- Rate limited to prevent brute force attacks

### Authorization

The EPAI platform uses PostgreSQL Row Level Security (RLS) policies to ensure partners can only access their own data:

- Partners can only view and modify their own data
- API keys are scoped to a specific partner
- Edge Functions validate permissions before processing requests
- Security-critical operations use SECURITY DEFINER functions

## Data Protection

### Data Encryption

All data in the EPAI platform is encrypted:

- Data at rest is encrypted (PostgreSQL/Supabase)
- Data in transit is encrypted using TLS 1.2+
- API keys are stored as bcrypt hashes
- Sensitive data is masked in logs and error messages

### Data Sanitization

The platform implements data sanitization to protect sensitive information:

- Automatic masking of emails, API keys, and other sensitive data
- Configurable sanitization rules
- Sanitization applied to logs, error messages, and API responses

### Data Retention

The platform implements data retention policies:

- Configurable retention periods for different data types
- Automatic purging of expired data
- Audit trail for all data deletion actions
- GDPR "right to be forgotten" support
- CCPA data anonymization support

## API Security

### Rate Limiting

All API endpoints are rate limited to prevent abuse:

- IP-based rate limiting (default: 30 requests/minute)
- API key-based rate limiting (default: 120 requests/minute)
- Endpoint-specific limits for sensitive operations
- Automatic blocking of suspicious activity

### Input Validation

All input is validated before processing:

- Zod schemas validate all incoming data
- Strong typing throughout the codebase
- Validation errors return detailed information in development, generic in production

### Security Headers

All responses include security headers:

- Content-Security-Policy
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- X-Frame-Options: DENY
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- Referrer-Policy: strict-origin-when-cross-origin

## Monitoring & Logging

### Security Event Logging

All security events are logged:

- Authentication attempts (successful and failed)
- API key usage
- Rate limit violations
- Security-critical operations
- Data access and modification

### Suspicious Activity Detection

The platform monitors for suspicious activity:

- Multiple failed authentication attempts
- Unusual API usage patterns
- Rate limit violations
- Access attempts from unusual locations

### Alerting

The platform includes alerting for security events:

- Real-time alerts for critical security events
- Daily security summary
- Configurable alert thresholds
- Multiple notification channels (email, Slack)

## Security Best Practices

### For Developers

- Never log API keys, even partially
- Always use the \`extractApiKey\` function to get the API key from a request
- Use the \`validateApiKey\` function to validate API keys
- Always use RLS policies to restrict data access
- Use \`SECURITY DEFINER\` functions for operations that need elevated privileges
- Use the \`createSecureErrorResponse\` function to create error responses
- Never expose stack traces or internal error details in production

### For Administrators

- Use the \`setup-prod-env.js\` script to configure the production environment
- Store all secrets in environment variables
- Rotate API keys and credentials regularly
- Monitor the \`security_events\` table for suspicious activity
- Have an incident response plan ready

## Security Roadmap

### Short-term (1-3 months)

- Complete third-party penetration testing
- Implement GDPR/CCPA compliance mechanisms
- Expand automated security testing in CI/CD

### Medium-term (3-6 months)

- Implement multi-factor authentication
- Add IP allowlisting for API access
- Implement more granular permission controls

### Long-term (6-12 months)

- Obtain security certifications (SOC 2, ISO 27001)
- Implement advanced threat detection
- Conduct regular security training for team members
`;
  
  writeToFile(
    path.join(CONFIG.securityDocsDir, 'overview.md'),
    securityOverview
  );
  
  // Generate security checklist
  const securityChecklist = `# EPAI Security Checklist

## Pre-Deployment Security Checklist

### Authentication & Authorization

- [ ] All authentication endpoints protected against brute force attacks
- [ ] Password requirements enforced (minimum length, complexity)
- [ ] API keys stored as bcrypt hashes
- [ ] API key expiration implemented
- [ ] Row Level Security (RLS) policies in place for all tables
- [ ] Security-critical database functions use SECURITY DEFINER

### API Security

- [ ] Rate limiting implemented for all endpoints
- [ ] Input validation in place for all endpoints
- [ ] Security headers added to all responses
- [ ] CORS configured correctly
- [ ] Error responses do not leak sensitive information

### Data Protection

- [ ] Sensitive data identified and protected
- [ ] Data sanitization implemented for logs and error messages
- [ ] Data retention policies configured
- [ ] GDPR/CCPA compliance mechanisms in place

### Monitoring & Logging

- [ ] Security event logging implemented
- [ ] Alerting configured for critical security events
- [ ] Audit logging in place for sensitive operations
- [ ] Log retention policies configured

### Infrastructure Security

- [ ] Production environment isolated from development/staging
- [ ] Database backups configured and tested
- [ ] Disaster recovery plan in place
- [ ] Secrets management configured correctly

## Incident Response Checklist

### Initial Response

- [ ] Identify and isolate affected systems
- [ ] Preserve evidence
- [ ] Notify security team
- [ ] Determine severity and impact

### Investigation

- [ ] Review security logs
- [ ] Identify entry point and attack vector
- [ ] Determine scope of compromise
- [ ] Document timeline of events

### Containment & Eradication

- [ ] Contain the incident
- [ ] Remove malicious code or unauthorized access
- [ ] Patch vulnerabilities
- [ ] Reset compromised credentials

### Recovery

- [ ] Restore systems from clean backups
- [ ] Verify system integrity
- [ ] Monitor for signs of continued compromise
- [ ] Return to normal operations

### Post-Incident

- [ ] Document lessons learned
- [ ] Update security controls
- [ ] Conduct training if necessary
- [ ] Review and update incident response plan

## Security Testing Checklist

### Authentication Testing

- [ ] Test password requirements
- [ ] Test account lockout after failed attempts
- [ ] Test password reset functionality
- [ ] Test session management
- [ ] Test API key authentication

### Authorization Testing

- [ ] Test access controls for different user roles
- [ ] Test RLS policies
- [ ] Test API endpoint permissions
- [ ] Test for horizontal privilege escalation
- [ ] Test for vertical privilege escalation

### Input Validation Testing

- [ ] Test for SQL injection
- [ ] Test for XSS vulnerabilities
- [ ] Test for CSRF vulnerabilities
- [ ] Test file upload security
- [ ] Test for command injection

### API Security Testing

- [ ] Test rate limiting
- [ ] Test input validation
- [ ] Test error handling
- [ ] Test CORS configuration
- [ ] Test security headers

### Data Protection Testing

- [ ] Test data encryption
- [ ] Test data sanitization
- [ ] Test data retention policies
- [ ] Test GDPR/CCPA compliance mechanisms
`;
  
  writeToFile(
    path.join(CONFIG.securityDocsDir, 'checklist.md'),
    securityChecklist
  );
  
  log('Security documentation generated successfully', 'success');
}

// Main function
function main() {
  log('EPAI Documentation Generator', 'info');
  log('=========================', 'info');
  
  try {
    // Ensure output directory exists
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    // Generate API documentation
    generateApiDocs();
    
    // Generate SDK documentation
    generateSdkDocs();
    
    // Generate architecture documentation
    generateArchitectureDocs();
    
    // Generate security documentation
    generateSecurityDocs();
    
    // Generate index file
    const indexContent = `# EPAI Documentation

## Overview

Welcome to the EPAI (Embedded Predictive Analytics Integrator) documentation. This documentation provides comprehensive information about the EPAI platform, including API reference, SDK integration guide, architecture overview, and security information.

## Contents

### API Documentation

- [API Endpoints](api/endpoints.md)
- [OpenAPI Specification](api/openapi.json)
- [API Usage Examples](api/examples.md)

### SDK Documentation

- [SDK Integration Guide](sdk/integration-guide.md)
- [Component Reference](sdk/component-reference.md)

### Architecture Documentation

- [System Overview](architecture/system-overview.md)
- [Database Schema](architecture/database-schema.md)

### Security Documentation

- [Security Overview](security/overview.md)
- [Security Checklist](security/checklist.md)

## Getting Started

1. Sign up for an EPAI account at [https://app.epai.example.com](https://app.epai.example.com)
2. Get your API key from the Settings page
3. Start sending data using the [API](api/endpoints.md) or integrate the [SDK](sdk/integration-guide.md) into your application

## Support

If you need help with the EPAI platform, please contact us at support@epai.example.com.
`;
    
    writeToFile(
      path.join(CONFIG.outputDir, 'index.md'),
      indexContent
    );
    
    log('\nDocumentation generated successfully!', 'success');
    log(`Documentation saved to ${CONFIG.outputDir}`, 'info');
  } catch (error) {
    log(`Documentation generation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the main function
main();
