# EPAI SDK Integration Guide

## Overview

The EPAI SDK allows you to embed predictive analytics insights directly into your application. The SDK provides React components and a standalone script for easy integration.

## Installation

### React Component

Install the SDK package:

```bash
npm install @epai/insight-sdk
# or
yarn add @epai/insight-sdk
# or
pnpm add @epai/insight-sdk
```

### Script Tag

Add the SDK loader script to your HTML:

```html
<script src="https://api.epai.example.com/functions/v1/sdk-loader.js"></script>
```

## Usage

### React Component

Import and use the InsightCard component:

```jsx
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
```

### Script Tag

Add a container element with data attributes:

```html
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
```

## API Reference

### InsightCard Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | string | required | Your EPAI API key |
| `insightId` | string | required | ID of the insight to display |
| `theme` | string | 'light' | Theme ('light' or 'dark') |
| `showConfidence` | boolean | true | Whether to show confidence score |
| `showTitle` | boolean | true | Whether to show the insight title |
| `compact` | boolean | false | Whether to use compact layout |

### Script Tag Data Attributes

| Attribute | Description |
|-----------|-------------|
| `data-api-key` | Your EPAI API key |
| `data-insight-id` | ID of the insight to display |
| `data-theme` | Theme ('light' or 'dark') |
| `data-show-confidence` | Whether to show confidence score ('true' or 'false') |
| `data-show-title` | Whether to show the insight title ('true' or 'false') |
| `data-compact` | Whether to use compact layout ('true' or 'false') |

## Customization

### Custom Styling

You can customize the appearance of the InsightCard component using CSS variables:

```css
:root {
  --epai-primary-color: #4f46e5;
  --epai-text-color: #1f2937;
  --epai-background-color: #ffffff;
  --epai-border-color: #e5e7eb;
  --epai-border-radius: 8px;
  --epai-font-family: 'Inter', sans-serif;
}
```

### Custom Themes

The SDK includes two built-in themes: 'light' and 'dark'. You can switch between them using the `theme` prop or `data-theme` attribute.

## Examples

### Basic Example

```jsx
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
```

### Custom Theme Example

```jsx
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
```

### Multiple Insights Example

```jsx
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
```

## Troubleshooting

### Common Issues

#### API Key Errors

If you see an error related to your API key:

1. Check that your API key is valid and has not expired
2. Ensure you're using the correct API key format (starts with `epai_`)
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
