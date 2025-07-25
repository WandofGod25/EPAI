# EPAI Penetration Testing Guide

This guide provides instructions for preparing and conducting penetration testing for the EPAI platform.

## Prerequisites

Before starting the penetration testing process, ensure you have the following:

1. **Environment Setup:**
   - Local development environment with Docker running
   - Supabase CLI installed (`npm install -g supabase`)
   - Node.js 18+ installed

2. **Credentials:**
   - Supabase URL and Service Role Key for your test environment
   - These should be configured in `scripts/test.env`

## Running the Penetration Testing Preparation

### Step 1: Configure Environment Variables

Create or update the `scripts/test.env` file with your Supabase credentials:

```
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 2: Run the Preparation Script

Execute the following command to run the penetration testing preparation:

```bash
npm run run-pentest
```

This script will:
1. Apply all necessary database migrations
2. Create test users with different roles
3. Generate test data (models, logs, events, insights)
4. Configure security settings for testing
5. Generate comprehensive documentation

### Step 3: Review Generated Documentation

After running the script, check the `pentest-prep` directory for the following files:

- `pentest_scope.md`: Defines the scope of the penetration test
- `test_environment.md`: Details of the test environment and test accounts
- `security_configuration.md`: Security settings for the penetration test
- `pentest_checklist.md`: Comprehensive checklist for penetration testing
- `preparation_summary.md`: Summary of all preparation steps

## Conducting the Penetration Test

### Step 1: Share Documentation with Testing Team

Provide the penetration testing team with:
- The generated documentation from the `pentest-prep` directory
- Access credentials from `test_environment.md`
- The penetration testing checklist

### Step 2: Schedule and Coordinate Testing

- Agree on a testing window with the penetration testing team
- Ensure all stakeholders are aware of the testing schedule
- Prepare for potential service disruptions during testing

### Step 3: Monitor During Testing

During the penetration test:
- Monitor the `security_events` table for suspicious activity
- Keep an eye on logs and error rates
- Be available to assist the testing team if they encounter issues

### Step 4: Review Results

After the penetration test is complete:
1. Review the findings report from the testing team
2. Prioritize issues based on severity
3. Create tickets for all identified vulnerabilities
4. Develop a remediation plan

## Database Schema for Security Testing

The following database tables are particularly relevant for security testing:

### Security Events Table

The `security_events` table logs all security-related events:

```sql
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  event_type TEXT NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB
);
```

### API Keys Table

The `api_keys` table stores API keys with secure hashing:

```sql
ALTER TABLE public.api_keys
  ADD COLUMN api_key_hash TEXT,
  ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
  ADD COLUMN last_used_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
```

### Rate Limiting Configuration

The `rate_limit_config` table stores rate limiting settings:

```sql
CREATE TABLE public.rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_limit INTEGER NOT NULL DEFAULT 30,
  api_key_limit INTEGER NOT NULL DEFAULT 120,
  burst_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(endpoint, method)
);
```

## Security Functions

The following PostgreSQL functions are available for security operations:

### API Key Validation

```sql
-- Function to validate API keys with security logging
CREATE OR REPLACE FUNCTION public.validate_api_key(p_api_key TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_partner_id UUID;
  v_key_hash TEXT;
  v_key_expired BOOLEAN;
BEGIN
  -- Find the partner ID for the given API key
  SELECT 
    partner_id,
    expires_at < NOW() AS key_expired
  INTO 
    v_partner_id,
    v_key_expired
  FROM public.api_keys
  WHERE api_key = p_api_key
    AND is_active = TRUE
  LIMIT 1;
  
  -- If the key is expired, log it and return null
  IF v_key_expired THEN
    INSERT INTO public.security_events (
      event_type,
      partner_id,
      details
    ) VALUES (
      'api_key.expired',
      v_partner_id,
      jsonb_build_object('api_key_prefix', substring(p_api_key, 1, 8))
    );
    RETURN NULL;
  END IF;
  
  -- If the key doesn't exist, log it and return null
  IF v_partner_id IS NULL THEN
    INSERT INTO public.security_events (
      event_type,
      details
    ) VALUES (
      'api_key.invalid',
      jsonb_build_object('api_key_prefix', substring(p_api_key, 1, 8))
    );
    RETURN NULL;
  END IF;
  
  -- Update last_used_at
  UPDATE public.api_keys
  SET last_used_at = NOW()
  WHERE partner_id = v_partner_id;
  
  -- Log successful API key use
  INSERT INTO public.security_events (
    event_type,
    partner_id,
    details
  ) VALUES (
    'api_key.use',
    v_partner_id,
    jsonb_build_object('api_key_prefix', substring(p_api_key, 1, 8))
  );
  
  RETURN v_partner_id;
END;
$$;
```

### Security Event Logging

```sql
-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_details JSONB DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_partner_id UUID;
  v_event_id UUID;
BEGIN
  -- Get current user ID if authenticated
  v_user_id := auth.uid();
  
  -- Get partner ID if user is authenticated
  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_partner_id
    FROM public.partners
    WHERE user_id = v_user_id;
  END IF;
  
  -- Insert security event
  INSERT INTO public.security_events (
    event_type, 
    user_id, 
    partner_id, 
    ip_address, 
    user_agent, 
    details
  ) VALUES (
    p_event_type,
    v_user_id,
    v_partner_id,
    p_ip_address,
    p_user_agent,
    p_details
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Ensure Supabase is running locally (`supabase start`)
   - Check that your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

2. **Permission Errors:**
   - Make sure the scripts are executable (`chmod +x scripts/*.js`)
   - Verify that your service role key has the necessary permissions

3. **Migration Errors:**
   - If migrations fail, try running them manually: `npx supabase db reset`
   - Check for syntax errors in the migration files

### Getting Help

If you encounter issues during the penetration testing process, contact:

- Security Team: security@epai-example.com
- DevOps Team: devops@epai-example.com

## Summary

We have successfully prepared the EPAI platform for penetration testing by:

1. **Creating a comprehensive database schema** with all necessary security tables and functions, including:
   - Enhanced API keys table with hashing and expiration
   - Security events table for logging security-related activities
   - Rate limiting configuration table for controlling API usage
   - Data retention configuration for compliance with regulations

2. **Developing a robust penetration testing preparation system** that:
   - Generates test users with different roles
   - Creates sample data for testing (models, logs, events, insights)
   - Configures security settings for testing
   - Generates detailed documentation for the testing team

3. **Documenting the penetration testing process** with:
   - A clear scope document defining what should be tested
   - A detailed checklist for the testing team
   - A comprehensive guide for running the tests
   - Troubleshooting information for common issues

The platform is now ready for security testing, with all necessary infrastructure in place to identify and address potential vulnerabilities.

## Next Steps

1. **Run the penetration test** using the provided documentation and test environment
2. **Address any identified vulnerabilities** based on the test results
3. **Implement the remaining security features** outlined in the database schema
4. **Conduct regular security testing** to maintain a high level of security 