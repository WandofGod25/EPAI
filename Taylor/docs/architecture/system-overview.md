# EPAI System Architecture

## Overview

The Embedded Predictive Analytics Integrator (EPAI) is a platform that enables partners to integrate predictive analytics capabilities into their applications. The platform consists of several components that work together to ingest data, generate insights, and deliver those insights to partner applications.

## Architecture Diagram

```
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
```

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
