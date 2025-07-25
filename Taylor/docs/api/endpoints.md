# EPAI API Endpoints

## Overview

The EPAI API provides endpoints for data ingestion and insight retrieval. All endpoints require authentication using an API key.

## Authentication

All API requests must include an API key in the `apikey` header:

```
apikey: epai_your_api_key
```

API keys can be generated and managed in the EPAI Admin Panel under Settings.

## Rate Limiting

API endpoints are rate limited to protect the system from abuse. The default limits are:

- 120 requests per minute per API key
- 30 requests per minute per IP address

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 60
```

## Endpoints

### POST /ingest

Ingests event data for predictive analytics processing.

**Request Body:**

```json
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
```

**Response:**

```json
{
  "success": true,
  "message": "Event ingested successfully",
  "eventId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### GET /get-insights

Retrieves insights generated from ingested data.

**Query Parameters:**

- `limit` (optional): Maximum number of insights to return (default: 10, max: 100)
- `offset` (optional): Number of insights to skip (default: 0)

**Response:**

```json
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
```

## Error Handling

All errors return an appropriate HTTP status code and a JSON response with error details:

```json
{
  "error": true,
  "message": "Invalid API key",
  "code": "auth/invalid-api-key"
}
```

Common error codes:

- `auth/invalid-api-key`: The provided API key is invalid
- `auth/expired-api-key`: The provided API key has expired
- `rate-limit/exceeded`: Rate limit exceeded
- `validation/invalid-request`: The request body is invalid
