# EPAI SDK Component Reference

## InsightCard

The `InsightCard` component displays a predictive analytics insight in a card format.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | string | required | Your EPAI API key |
| `insightId` | string | required | ID of the insight to display |
| `theme` | string | 'light' | Theme ('light' or 'dark') |
| `showConfidence` | boolean | true | Whether to show confidence score |
| `showTitle` | boolean | true | Whether to show the insight title |
| `compact` | boolean | false | Whether to use compact layout |
| `className` | string | '' | Additional CSS class for the card |
| `style` | object | {} | Additional inline styles for the card |
| `onLoad` | function | undefined | Callback function called when the insight is loaded |
| `onError` | function | undefined | Callback function called when an error occurs |

### Examples

#### Basic Usage

```jsx
import { InsightCard } from '@epai/insight-sdk';

function App() {
  return (
    <InsightCard 
      apiKey="epai_your_api_key"
      insightId="123e4567-e89b-12d3-a456-426614174000"
    />
  );
}
```

#### With Custom Styling

```jsx
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
```

#### With Event Handlers

```jsx
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
```

## SDK Loader

The SDK Loader is a standalone script that automatically initializes and renders insights based on data attributes.

### Usage

```html
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
```

### Data Attributes

| Attribute | Description |
|-----------|-------------|
| `data-api-key` | Your EPAI API key |
| `data-insight-id` | ID of the insight to display |
| `data-theme` | Theme ('light' or 'dark') |
| `data-show-confidence` | Whether to show confidence score ('true' or 'false') |
| `data-show-title` | Whether to show the insight title ('true' or 'false') |
| `data-compact` | Whether to use compact layout ('true' or 'false') |

### Manual Initialization

You can manually initialize the SDK and render insights:

```html
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
```

### API

The SDK Loader exposes the following methods:

#### init()

Initializes the SDK and automatically renders insights in containers with data attributes.

```javascript
window.EPAI.init();
```

#### renderInsight(options)

Renders an insight into a specific container.

```javascript
window.EPAI.renderInsight({
  container: document.getElementById('custom-container'),
  apiKey: 'epai_your_api_key',
  insightId: '123e4567-e89b-12d3-a456-426614174000',
  theme: 'light',
  showConfidence: true,
  showTitle: true,
  compact: false
});
```

#### getInsight(options)

Fetches an insight without rendering it.

```javascript
window.EPAI.getInsight({
  apiKey: 'epai_your_api_key',
  insightId: '123e4567-e89b-12d3-a456-426614174000'
}).then(insight => {
  console.log('Insight:', insight);
}).catch(error => {
  console.error('Error:', error);
});
```
