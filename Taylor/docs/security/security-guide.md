# EPAI Security Guide

## Overview

This document provides comprehensive security guidelines and documentation for the Embedded Predictive Analytics Integrator (EPAI) platform. It covers security features, best practices, and configurations to ensure the platform remains secure in production environments.

## Security Architecture

### Authentication & Authorization

1. **User Authentication**
   - Supabase Auth provides secure user authentication
   - Password requirements: minimum 12 characters, mixed case, numbers, and special characters
   - JWT tokens with 1-hour expiration
   - Refresh tokens with 30-day expiration

2. **API Key Authentication**
   - Format: `epai_[32+ random characters]`
   - Stored as bcrypt hashes in the database
   - Automatic expiration after 90 days
   - Required rotation after 180 days
   - Rate limited to prevent brute force attacks

3. **Authorization**
   - Row Level Security (RLS) policies restrict data access
   - Partners can only access their own data
   - Service role used only for administrative functions

### Data Protection

1. **Data Encryption**
   - All data encrypted at rest (Supabase/PostgreSQL)
   - All data encrypted in transit (TLS 1.2+)
   - API keys stored as bcrypt hashes
   - Sensitive data masked in logs

2. **Data Sanitization**
   - Automatic masking of emails, API keys, and other sensitive data
   - Configurable sanitization rules in `data-sanitizer.ts`
   - Sanitization applied to logs, error messages, and API responses

### API Security

1. **Rate Limiting**
   - IP-based rate limiting (default: 30 requests/minute)
   - API key-based rate limiting (default: 120 requests/minute)
   - Endpoint-specific limits for sensitive operations
   - Automatic blocking of suspicious activity

2. **Input Validation**
   - Zod schemas validate all incoming data
   - Strong typing throughout the codebase
   - Validation errors return detailed information in development, generic in production

3. **Security Headers**
   - Content-Security-Policy
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - X-Frame-Options: DENY
   - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   - Referrer-Policy: strict-origin-when-cross-origin

### Monitoring & Logging

1. **Security Event Logging**
   - All security events logged to `security_events` table
   - Events include IP address, user agent, and timestamp
   - Sensitive data automatically masked
   - Security dashboard provides overview of events

2. **Suspicious Activity Detection**
   - Automatic detection of unusual patterns
   - Alerts for multiple failed authentication attempts
   - Monitoring of API key usage patterns
   - Rate limit violations tracked and analyzed

## Security Components

### Rate Limiter

The rate limiter prevents abuse of the API by limiting the number of requests from a single IP address or API key within a time period.

```typescript
// Example usage
import { RateLimiter } from './_shared/rate-limiter.ts';

const ipRateLimiter = new RateLimiter({
  tokensPerInterval: 30, // 30 requests per minute
  interval: 60 * 1000,   // 1 minute
});

// Check if the request is allowed
const allowed = await ipRateLimiter.check(clientIp);
```

Configuration options:
- `tokensPerInterval`: Number of requests allowed in the interval
- `interval`: Time period in milliseconds
- `burstLimit`: Maximum number of tokens that can be consumed in a burst

### Data Sanitizer

The data sanitizer masks sensitive information in logs, error messages, and API responses.

```typescript
// Example usage
import { sanitizeForLogging } from './_shared/data-sanitizer.ts';

const sanitizedData = sanitizeForLogging({
  email: 'user@example.com',
  name: 'John Doe',
  apiKey: 'epai_abc123',
});

// Result: { email: 'u***@e***.com', name: 'John Doe', apiKey: 'epai_***' }
```

Sanitized fields:
- Email addresses
- API keys
- Authentication tokens
- Credit card numbers
- Social security numbers
- Phone numbers

### Security Middleware

The security middleware provides a unified way to apply security measures to Edge Functions.

```typescript
// Example usage
import { withSecurity } from './_shared/security-middleware.ts';

// Define your handler function
async function handleRequest(req: Request, partnerId?: string): Promise<Response> {
  // Your logic here
}

// Apply security middleware
const secureHandler = withSecurity(handleRequest, {
  requireApiKey: true,
  ipRateLimit: 60,
  apiKeyRateLimit: 180,
});

// Serve the function
serve(secureHandler);
```

Features:
- API key validation
- Rate limiting
- Security headers
- Error handling
- Security event logging

## Security Best Practices

### For Developers

1. **API Key Handling**
   - Never log API keys, even partially
   - Always use the `extractApiKey` function to get the API key from a request
   - Use the `validateApiKey` function to validate API keys

2. **Data Access**
   - Always use RLS policies to restrict data access
   - Use `SECURITY DEFINER` functions for operations that need elevated privileges
   - Never expose the service role key in client-side code

3. **Error Handling**
   - Use the `createSecureErrorResponse` function to create error responses
   - Never expose stack traces or internal error details in production
   - Log errors securely using the `logSecurityEvent` function

4. **Code Security**
   - Run `npm audit` regularly to check for vulnerabilities
   - Use ESLint with security plugins
   - Follow the principle of least privilege

### For Administrators

1. **Environment Setup**
   - Use the `setup-prod-env.js` script to configure the production environment
   - Store all secrets in environment variables
   - Rotate API keys and credentials regularly

2. **Monitoring**
   - Monitor the `security_events` table for suspicious activity
   - Set up alerts for security events
   - Review logs regularly

3. **Incident Response**
   - Have an incident response plan ready
   - Know how to revoke compromised API keys
   - Document all security incidents

## Security Configuration

The security configuration is stored in `config/security.js`. This file contains settings for rate limiting, CORS, content security policy, and more.

```javascript
// Example configuration
module.exports = {
  rateLimit: {
    api: {
      default: 120,
      endpoints: {
        'ingest-v2': 180,
      },
    },
    ip: {
      default: 30,
    },
  },
  cors: {
    allowedOrigins: process.env.NODE_ENV === 'production'
      ? ['https://admin.yourdomain.com']
      : ['*'],
  },
  // Other settings...
};
```

## Security Testing

### Automated Testing

1. **GitHub Actions Workflow**
   - Security scan runs on every push and pull request
   - Dependency vulnerability scanning with `npm audit`
   - Static code analysis with ESLint
   - Secret detection with GitLeaks
   - SQL injection detection

2. **Manual Testing**
   - Use the `test-ingest-v3.js` script to test the secure ingest endpoint
   - Use the `test-rate-limiter.js` script to test rate limiting

### Penetration Testing

Penetration testing should be conducted regularly to identify vulnerabilities. The following areas should be tested:

1. **Authentication**
   - Brute force attacks
   - Session management
   - Password policies

2. **Authorization**
   - Access control
   - Privilege escalation
   - Data leakage

3. **API Security**
   - Input validation
   - Rate limiting
   - Error handling

4. **Infrastructure**
   - Network security
   - Database security
   - Cloud configuration

## Compliance

### GDPR Compliance

1. **Data Subject Rights**
   - Right to access
   - Right to be forgotten (implemented via `delete_partner_data` function)
   - Right to data portability

2. **Data Protection**
   - Data minimization
   - Purpose limitation
   - Storage limitation (implemented via data retention policies)

3. **Documentation**
   - Privacy policy
   - Data processing agreement
   - Records of processing activities

### Data Retention & Purging

1. **Retention Policies**
   - Logs: 90 days
   - Security Events: 365 days
   - Ingestion Events: 730 days
   - Insights: 730 days

2. **Automatic Purging**
   - Daily purging of expired data
   - Configurable retention periods via `data_retention_config` table
   - Audit trail of all deletions in `data_deletion_audit` table

3. **Manual Data Deletion**
   - `delete_partner_data` function for GDPR "right to be forgotten" requests
   - `anonymize_partner_data` function for CCPA anonymization requests
   - Full audit trail of all manual deletions

4. **Monitoring & Reporting**
   - `get_data_retention_summary` function provides overview of data retention status
   - Test and manage retention with `scripts/test-data-retention.js`

### Security Audit Logging

The platform logs all security-related events to the `security_events` table. These logs can be used for compliance reporting and security investigations.

```sql
-- Example query to get security events for a partner
SELECT * FROM security_events
WHERE partner_id = '12345678-1234-1234-1234-123456789012'
AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

## Incident Response

### Security Incident Procedure

1. **Detection**
   - Monitor security events
   - Review logs
   - Respond to alerts

2. **Containment**
   - Revoke compromised API keys
   - Block suspicious IP addresses
   - Isolate affected systems

3. **Eradication**
   - Remove malware
   - Fix vulnerabilities
   - Update systems

4. **Recovery**
   - Restore systems
   - Issue new credentials
   - Verify security

5. **Lessons Learned**
   - Document the incident
   - Update security measures
   - Train team members

### Contact Information

For security issues or concerns, contact:

- Security Team: security@yourdomain.com
- Emergency Hotline: +1-555-123-4567

## References

1. [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
2. [Supabase Security Documentation](https://supabase.com/docs/guides/platform/security)
3. [PostgreSQL Security Best Practices](https://www.postgresql.org/docs/current/security.html)
4. [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
5. [GDPR Official Text](https://gdpr-info.eu/) 