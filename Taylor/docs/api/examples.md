# EPAI API Usage Examples

## JavaScript / Node.js

### Ingesting an Event

```javascript
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
    const response = await fetch(`${apiUrl}/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      },
      body: JSON.stringify(event)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Event ingested successfully:', data);
  } catch (error) {
    console.error('Error ingesting event:', error);
  }
}

ingestEvent();
```

### Retrieving Insights

```javascript
const apiKey = 'epai_your_api_key';
const apiUrl = 'https://api.epai.example.com';

async function getInsights() {
  try {
    const response = await fetch(`${apiUrl}/get-insights?limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Insights retrieved successfully:', data);
  } catch (error) {
    console.error('Error retrieving insights:', error);
  }
}

getInsights();
```

## Python

### Ingesting an Event

```python
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
```

### Retrieving Insights

```python
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
```

## cURL

### Ingesting an Event

```bash
curl -X POST 'https://api.epai.example.com/ingest' \
  -H 'Content-Type: application/json' \
  -H 'apikey: epai_your_api_key' \
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
```

### Retrieving Insights

```bash
curl -X GET 'https://api.epai.example.com/get-insights?limit=5' \
  -H 'Content-Type: application/json' \
  -H 'apikey: epai_your_api_key'
```
