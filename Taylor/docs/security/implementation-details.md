# [EPAI-009]: Security Implementation Details

**System Overview**
-   **Purpose**: To implement comprehensive security measures that protect the platform from common vulnerabilities and attacks, ensuring data privacy and system integrity.
-   **Status**: **[Completed]**

**Tasks:**

-   **[COMPLETED] API Key Security:**
    -   [x] **Hashing:** Implemented bcrypt hashing for API keys in the database.
    ```sql
    -- Example implementation for hashed API keys
    CREATE OR REPLACE FUNCTION public.regenerate_api_key_for_partner() 
    RETURNS TABLE(api_key text) LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE
      v_partner_id uuid;
      v_api_key text;
      v_api_key_hash text;
    BEGIN
      -- Get the partner ID for the current user
      SELECT id INTO v_partner_id
      FROM public.partners
      WHERE user_id = auth.uid();
      
      -- Generate a new API key
      v_api_key := 'epai_' || encode(gen_random_bytes(24), 'base64');
      -- Hash the API key for storage
      v_api_key_hash := crypt(v_api_key, gen_salt('bf'));
      
      -- Update or insert the API key
      INSERT INTO public.api_keys (partner_id, key_hash, expires_at)
      VALUES (v_partner_id, v_api_key_hash, NOW() + INTERVAL '90 days')
      ON CONFLICT (partner_id) 
      DO UPDATE SET 
        key_hash = v_api_key_hash,
        expires_at = NOW() + INTERVAL '90 days';
      
      -- Return the plaintext key (only time it's available)
      RETURN QUERY SELECT v_api_key;
    END;
    $$;
    ```
    -   [x] **Expiration:** Added automatic expiration after 90 days.
    -   [x] **Rotation:** Implemented required rotation after 180 days.
    -   [x] **Validation:** Created secure validation process with logging of failed attempts.

-   **[COMPLETED] Rate Limiting:**
    -   [x] **IP-based Limiting:** Implemented default 30 requests/minute per IP address.
    -   [x] **API Key-based Limiting:** Implemented default 120 requests/minute per API key.
    -   [x] **Endpoint-specific Limits:** Added higher limits for data ingestion, lower for sensitive operations.
    -   [x] **Burst Protection:** Implemented protection against sudden request spikes.
    ```typescript
    // Rate limiter implementation using token bucket algorithm
    export class RateLimiter {
      private tokens: Map<string, number> = new Map();
      private lastRefill: Map<string, number> = new Map();
      private readonly tokensPerInterval: number;
      private readonly interval: number;
      private readonly burstLimit: number;
    
      constructor(options: {
        tokensPerInterval: number;
        interval: number;
        burstLimit?: number;
      }) {
        this.tokensPerInterval = options.tokensPerInterval;
        this.interval = options.interval;
        this.burstLimit = options.burstLimit || options.tokensPerInterval;
      }
    
      async check(key: string): Promise<boolean> {
        const now = Date.now();
        const lastRefill = this.lastRefill.get(key) || 0;
        const elapsedTime = now - lastRefill;
        
        // Calculate tokens to add based on elapsed time
        const tokensToAdd = Math.floor(elapsedTime / this.interval) * this.tokensPerInterval;
        
        // Get current tokens or initialize
        let currentTokens = this.tokens.get(key) || this.tokensPerInterval;
        
        if (tokensToAdd > 0) {
          // Add tokens and update last refill time
          currentTokens = Math.min(currentTokens + tokensToAdd, this.burstLimit);
          this.lastRefill.set(key, now);
        }
        
        // Check if we have enough tokens
        if (currentTokens >= 1) {
          // Consume one token
          currentTokens -= 1;
          this.tokens.set(key, currentTokens);
          return true;
        }
        
        return false;
      }
    }
    ```

-   **[COMPLETED] Data Protection:**
    -   [x] **Data Sanitization:** Created module to mask sensitive information in logs and responses.
    ```typescript
    // Data sanitization implementation
    export function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
      const result: Record<string, unknown> = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          result[key] = sanitizeForLogging(value as Record<string, unknown>);
        } else if (typeof value === 'string') {
          // Sanitize email addresses
          if (key.toLowerCase().includes('email') || isEmail(value)) {
            result[key] = maskEmail(value);
          }
          // Sanitize API keys
          else if (key.toLowerCase().includes('key') || isApiKey(value)) {
            result[key] = maskApiKey(value);
          }
          // Keep other values as is
          else {
            result[key] = value;
          }
        } else {
          result[key] = value;
        }
      }
      
      return result;
    }
    
    function maskEmail(email: string): string {
      const [local, domain] = email.split('@');
      if (!domain) return email;
      return `${local.substring(0, 1)}***@${domain.substring(0, 1)}***.${domain.split('.').pop()}`;
    }
    
    function maskApiKey(key: string): string {
      if (key.startsWith('epai_')) {
        return 'epai_***';
      }
      return key.substring(0, 3) + '***';
    }
    ```
    -   [x] **Email Masking:** Implemented email masking as `u***@e***.com`.
    -   [x] **API Key Masking:** Implemented API key masking as `epai_***`.
    -   [x] **Security Headers:** Added security headers to all responses.
    ```typescript
    // Security headers implementation
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    };
    
    export function addSecurityHeaders(response: Response): Response {
      const headers = new Headers(response.headers);
      
      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
      
      // Return a new Response with the updated headers
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    ```

-   **[COMPLETED] Security Infrastructure:**
    -   [x] **Security Middleware:** Created unified security layer for Edge Functions.
    ```typescript
    // Security middleware implementation
    export function withSecurity(
      handler: (req: Request, partnerId?: string) => Promise<Response>,
      options: {
        requireApiKey?: boolean;
        ipRateLimit?: number;
        apiKeyRateLimit?: number;
      } = {}
    ): (req: Request) => Promise<Response> {
      const {
        requireApiKey = false,
        ipRateLimit = 30,
        apiKeyRateLimit = 120,
      } = options;
      
      // Create rate limiters
      const ipRateLimiter = new RateLimiter({
        tokensPerInterval: ipRateLimit,
        interval: 60 * 1000, // 1 minute
      });
      
      const apiKeyRateLimiter = new RateLimiter({
        tokensPerInterval: apiKeyRateLimit,
        interval: 60 * 1000, // 1 minute
      });
      
      return async (req: Request): Promise<Response> => {
        try {
          // Handle CORS preflight requests
          if (req.method === 'OPTIONS') {
            return new Response('ok', { headers: corsHeaders });
          }
          
          // Apply rate limiting and other security measures
          // ...
          
          // Call the handler
          const response = await handler(req, partnerId || undefined);
          
          // Add security headers to the response
          return addSecurityHeaders(response);
        } catch (error) {
          // Handle errors securely
          // ...
        }
      };
    }
    ```
    -   [x] **Security Event Logging:** Implemented comprehensive logging of security events.
    -   [x] **Audit Logging:** Added database table and functions for security audit logging.
    ```sql
    -- Security events table
    CREATE TABLE IF NOT EXISTS security_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_type TEXT NOT NULL,
      details JSONB,
      ip_address TEXT,
      user_agent TEXT,
      partner_id UUID REFERENCES partners(id),
      user_id UUID REFERENCES auth.users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Function to log security events
    CREATE OR REPLACE FUNCTION log_security_event(
      p_event_type TEXT,
      p_details JSONB DEFAULT NULL,
      p_ip_address TEXT DEFAULT NULL,
      p_user_agent TEXT DEFAULT NULL,
      p_partner_id UUID DEFAULT NULL,
      p_user_id UUID DEFAULT NULL
    ) RETURNS UUID AS $$
    DECLARE
      v_event_id UUID;
    BEGIN
      -- Insert the security event
      INSERT INTO security_events (
        event_type,
        details,
        ip_address,
        user_agent,
        partner_id,
        user_id
      ) VALUES (
        p_event_type,
        p_details,
        p_ip_address,
        p_user_agent,
        p_partner_id,
        p_user_id
      ) RETURNING id INTO v_event_id;
      
      RETURN v_event_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    ```
    -   [x] **CI/CD Security:** Set up automated security scanning in the CI/CD pipeline.
    ```yaml
    # GitHub Actions workflow for security scanning
    name: Security Scan
    
    on:
      push:
        branches: [main]
      pull_request:
        branches: [main]
      schedule:
        - cron: '0 0 * * 0'  # Run weekly on Sunday at midnight
    
    jobs:
      dependency-scan:
        name: Dependency Vulnerability Scan
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@v3
    
          - name: Run npm audit
            run: npm audit --audit-level=high
    
      code-scan:
        name: Static Code Analysis
        runs-on: ubuntu-latest
        steps:
          - name: Run ESLint
            run: npx eslint . --ext .js,.jsx,.ts,.tsx
    
      secret-scan:
        name: Secret Detection
        runs-on: ubuntu-latest
        steps:
          - name: Detect secrets
            uses: gitleaks/gitleaks-action@v2
    ```

**Implementation Details:**

1. **Core Security Components:**
   - Created `rate-limiter.ts` with token bucket algorithm for fair rate limiting
   - Developed `data-sanitizer.ts` for identifying and masking sensitive data
   - Implemented `security-middleware.ts` for unified security across Edge Functions
   - Added security audit logging in `20240720000000_add_security_audit.sql`
   - Created centralized security configuration in `config/security.js`

2. **Enhanced Edge Functions:**
   - Created secure version of ingest function (`ingest-v3/index.ts`)
   - Updated API Key Manager with security enhancements
   - Added security headers to all responses

3. **Testing & Validation:**
   - Created test scripts for the secure ingest endpoint and rate limiting
   - Implemented GitHub Actions workflow for security scanning
   - Added comprehensive security documentation

**Security Best Practices:**

1. **For Developers:**
   - Never log API keys, even partially
   - Always use the `extractApiKey` function to get the API key from a request
   - Use the `validateApiKey` function to validate API keys
   - Always use RLS policies to restrict data access
   - Use `SECURITY DEFINER` functions for operations that need elevated privileges
   - Use the `createSecureErrorResponse` function to create error responses
   - Never expose stack traces or internal error details in production

2. **For Administrators:**
   - Use the `setup-prod-env.js` script to configure the production environment
   - Store all secrets in environment variables
   - Rotate API keys and credentials regularly
   - Monitor the `security_events` table for suspicious activity
   - Have an incident response plan ready

**Next Steps:**
1. Conduct third-party penetration testing
2. Implement GDPR/CCPA compliance mechanisms
3. Create data retention and purging policies
4. Expand automated security testing in CI/CD

**Dependencies:**
- Security vendor selection for penetration testing
- Legal review of compliance requirements 