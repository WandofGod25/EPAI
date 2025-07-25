# EPAI Database Schema

## Overview

The EPAI platform uses a PostgreSQL database hosted by Supabase. The database schema is designed to support the core functionality of the platform, including partner management, data ingestion, insight generation, and security.

## Tables

### Partners

The `partners` table stores information about partners using the platform.

```sql
CREATE TABLE partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Keys

The `api_keys` table stores API keys for partners.

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  key_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (partner_id)
);
```

### Models

The `models` table stores information about prediction models available to partners.

```sql
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
```

### Ingestion Events

The `ingestion_events` table stores raw event data from partners.

```sql
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
```

### Insights

The `insights` table stores generated insights.

```sql
CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id),
  model_id UUID REFERENCES models(id),
  content JSONB NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Logs

The `logs` table stores API request logs.

```sql
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
```

### Security Events

The `security_events` table stores security-related events.

```sql
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
```

## Row Level Security Policies

The EPAI platform uses PostgreSQL Row Level Security (RLS) policies to ensure partners can only access their own data.

### Partners Table

```sql
-- Partners can only view their own record
CREATE POLICY partners_select_policy ON partners
  FOR SELECT
  USING (user_id = auth.uid());

-- Partners can only update their own record
CREATE POLICY partners_update_policy ON partners
  FOR UPDATE
  USING (user_id = auth.uid());
```

### API Keys Table

```sql
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
```

### Ingestion Events Table

```sql
-- Partners can only view their own ingestion events
CREATE POLICY ingestion_events_select_policy ON ingestion_events
  FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));

-- Partners can only insert ingestion events for themselves
CREATE POLICY ingestion_events_insert_policy ON ingestion_events
  FOR INSERT
  WITH CHECK (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
```

### Insights Table

```sql
-- Partners can only view their own insights
CREATE POLICY insights_select_policy ON insights
  FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
```

### Logs Table

```sql
-- Partners can only view their own logs
CREATE POLICY logs_select_policy ON logs
  FOR SELECT
  USING (partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid()));
```

## Database Functions

The EPAI platform uses several database functions to implement business logic.

### API Key Management

```sql
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
```

### Logs Access

```sql
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
```

### Usage Statistics

```sql
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
```
