# Data Modeling

This document defines the core data schemas for the Embedded Predictive Analytics Integrator (EPAI) system. The schemas are designed for use with Supabase's PostgreSQL database.

## 1. `partners`

Stores information about the client platforms that are integrating with EPAI.

```sql
CREATE TABLE partners (
    partner_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    partner_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- API Key is generated separately but associated with the partner.
    -- We will store a hashed version of the key for security.
    api_key_hash TEXT UNIQUE NOT NULL
);

-- Index for quickly looking up partners by email
CREATE INDEX idx_partners_contact_email ON partners(contact_email);

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before any update on the partners table
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON partners
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
```

## 2. `prediction_logs`

Logs every prediction request made to the system. This table is critical for billing, monitoring, and debugging. It is designed to be append-heavy.

```sql
CREATE TABLE prediction_logs (
    log_id BIGSERIAL PRIMARY KEY,
    request_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Foreign key to the partner who made the request
    partner_id UUID NOT NULL REFERENCES partners(partner_id),
    
    -- Foreign key to the model that was used
    model_id UUID NOT NULL REFERENCES model_configs(model_id),
    
    -- The full input data sent by the partner
    request_payload JSONB NOT NULL,
    
    -- The prediction output from the model
    prediction_response JSONB,
    
    -- Status of the request
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'error', 'pending')),
    
    -- Store any error message if the status is 'error'
    error_message TEXT,
    
    -- How long the prediction took in milliseconds
    duration_ms INTEGER
);

-- Indexes for common query patterns
CREATE INDEX idx_prediction_logs_partner_id ON prediction_logs(partner_id);
CREATE INDEX idx_prediction_logs_model_id ON prediction_logs(model_id);
CREATE INDEX idx_prediction_logs_request_timestamp ON prediction_logs(request_timestamp);
```

## 3. `model_configs`

Stores configuration and metadata about the predictive models available to the system. This allows for dynamic model selection and management.

```sql
CREATE TABLE model_configs (
    model_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    model_name VARCHAR(255) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    
    -- A human-readable description of the model
    description TEXT,
    
    -- The identifier for the model on the serving platform (e.g., Hugging Face model ID)
    endpoint_identifier VARCHAR(255) UNIQUE NOT NULL,
    
    -- Is the model available for use?
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- JSONB to store any other arbitrary metadata, e.g., sample input, performance metrics
    metadata JSONB
);

-- Unique constraint on name and version
ALTER TABLE model_configs ADD CONSTRAINT model_name_version_unique UNIQUE (model_name, model_version);

-- Trigger to update the updated_at timestamp
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON model_configs
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
```

## 4. Ingestion & API Schemas

These schemas define the public contract for our API. We'll use JSON Schema to formally define the expected structure of incoming data. This ensures clarity for our partners and allows for robust validation.

### 4.1. Generic Prediction Request Schema

This is the wrapper schema for any prediction request. It authenticates the partner and specifies which model to use, along with the model-specific input data.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Generic Prediction Request",
  "description": "The standard wrapper for all prediction requests to the EPAI.",
  "type": "object",
  "properties": {
    "model_name": {
      "description": "The name of the predictive model to use.",
      "type": "string",
      "examples": ["lead-score-predictor", "event-attendance-forecaster"]
    },
    "model_version": {
      "description": "The specific version of the model to use.",
      "type": "string",
      "examples": ["1.0.0", "1.2.1"]
    },
    "payload": {
      "description": "The input data for the model. The structure of this object is defined by the specific model's input schema.",
      "type": "object"
    }
  },
  "required": ["model_name", "model_version", "payload"]
}
```

### 4.2. Example Model Input Schema: `lead-score-predictor v1.0.0`

This is an example schema for a specific model. Each model version will have a corresponding input schema.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Lead Score Predictor Input",
  "description": "Input schema for the lead-score-predictor model, version 1.0.0.",
  "type": "object",
  "properties": {
    "lead_source": {
      "type": "string",
      "enum": ["web-form", "referral", "cold-call", "advertisement"]
    },
    "deal_size": {
      "type": "number",
      "minimum": 0
    },
    "interaction_count": {
      "description": "Number of interactions (emails, calls, meetings) with the lead.",
      "type": "integer",
      "minimum": 0
    },
    "company_size": {
      "type": "integer",
      "description": "Number of employees in the lead's company.",
      "minimum": 1
    }
  },
  "required": ["lead_source", "deal_size", "interaction_count"]
}
```

## 5. Model Output Data Structure

This section defines the standardized structure for the output of all predictive models. This consistency is crucial for the UI SDK and for partners consuming the API directly.

### 5.1. Standard Prediction Response

```json
{
  "model_name": "lead-score-predictor",
  "model_version": "1.0.0",
  "prediction_id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "timestamp": "2024-06-01T12:00:00Z",
  "insight": {
    "type": "categorical_risk",
    "value": "High",
    "confidence": 0.88,
    "details": {
      "score": 92,
      "risk_factors": ["low_interaction_count", "small_company_size"]
    }
  },
  "explanation": "The lead is rated as 'High' risk due to a low number of interactions and the small size of their company."
}
```

**Key Fields:**
- **`prediction_id`**: A unique identifier for this specific prediction, linking back to the `prediction_logs` table.
- **`insight.type`**: A machine-readable category for the insight (e.g., `categorical_risk`, `timeseries_forecast`, `numeric_value`). This allows the UI SDK to select an appropriate visualization.
- **`insight.value`**: The primary prediction outcome.
- **`insight.confidence`**: A numeric value (0-1) indicating the model's confidence in the prediction.
- **`insight.details`**: An object containing additional, model-specific data points.
- **`explanation`**: A human-readable string explaining the prediction drivers, intended for display in the UI. 