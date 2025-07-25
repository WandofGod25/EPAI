/**
 * EPAI Security Configuration
 * 
 * This file contains security-related configuration settings for the EPAI platform.
 * It includes settings for rate limiting, CORS, content security policy, and more.
 */

module.exports = {
  /**
   * Rate limiting configuration
   */
  rateLimit: {
    // API rate limits (requests per minute)
    api: {
      // Default rate limit for API endpoints
      default: 120,
      
      // Endpoint-specific rate limits
      endpoints: {
        'ingest-v2': 180,      // Higher limit for data ingestion
        'get-insights': 300,   // Higher limit for insight retrieval
        'api-key-manager': 30, // Lower limit for API key management
      },
      
      // Burst limit (maximum requests in a short period)
      burstLimit: 20,
    },
    
    // IP-based rate limits (requests per minute)
    ip: {
      // Default rate limit for IPs
      default: 30,
      
      // Endpoint-specific rate limits
      endpoints: {
        'ingest-v2': 60,       // Higher limit for data ingestion
        'get-insights': 90,    // Higher limit for insight retrieval
        'api-key-manager': 10, // Lower limit for API key management
      },
      
      // Burst limit (maximum requests in a short period)
      burstLimit: 10,
    },
    
    // Authentication rate limits
    auth: {
      // Maximum login attempts per hour per IP
      maxLoginAttemptsPerHour: 10,
      
      // Lockout period in minutes after exceeding max attempts
      lockoutPeriodMinutes: 30,
    },
  },
  
  /**
   * CORS configuration
   */
  cors: {
    // Allowed origins for CORS requests
    // In production, this should be restricted to specific domains
    allowedOrigins: process.env.NODE_ENV === 'production'
      ? [
          'https://admin.yourdomain.com',
          'https://api.yourdomain.com',
        ]
      : ['*'],
    
    // Allowed methods for CORS requests
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    
    // Allowed headers for CORS requests
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
    
    // Whether to allow credentials (cookies, authorization headers)
    allowCredentials: true,
    
    // Max age for CORS preflight requests (in seconds)
    maxAge: 86400, // 24 hours
  },
  
  /**
   * Content Security Policy configuration
   */
  contentSecurityPolicy: {
    // Default source policy
    defaultSrc: ["'self'"],
    
    // Script source policy
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some libraries
      'https://cdn.yourdomain.com',
    ],
    
    // Style source policy
    styleSrc: [
      "'self'",
      "'unsafe-inline'", // Required for some libraries
      'https://cdn.yourdomain.com',
    ],
    
    // Image source policy
    imgSrc: [
      "'self'",
      'data:',
      'https://cdn.yourdomain.com',
    ],
    
    // Connect source policy
    connectSrc: [
      "'self'",
      'https://api.yourdomain.com',
      'https://*.supabase.co',
    ],
    
    // Font source policy
    fontSrc: [
      "'self'",
      'https://cdn.yourdomain.com',
    ],
    
    // Object source policy
    objectSrc: ["'none'"],
    
    // Frame source policy
    frameSrc: ["'self'"],
    
    // Report URI for CSP violations
    reportUri: '/api/csp-report',
  },
  
  /**
   * Security headers configuration
   */
  securityHeaders: {
    // X-XSS-Protection header
    xssProtection: '1; mode=block',
    
    // X-Content-Type-Options header
    contentTypeOptions: 'nosniff',
    
    // X-Frame-Options header
    frameOptions: 'SAMEORIGIN',
    
    // Strict-Transport-Security header
    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
    
    // Referrer-Policy header
    referrerPolicy: 'strict-origin-when-cross-origin',
    
    // Permissions-Policy header
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
  },
  
  /**
   * API key configuration
   */
  apiKey: {
    // API key format (used for validation)
    format: /^epai_[A-Za-z0-9+/=]{32,}$/,
    
    // API key expiration (in days)
    expirationDays: 90,
    
    // Whether to require API key rotation
    requireRotation: true,
    
    // Maximum age before requiring rotation (in days)
    maxAgeDays: 180,
  },
  
  /**
   * Authentication configuration
   */
  auth: {
    // JWT expiration (in seconds)
    jwtExpirationSeconds: 3600, // 1 hour
    
    // Refresh token expiration (in seconds)
    refreshTokenExpirationSeconds: 2592000, // 30 days
    
    // Password requirements
    password: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
    },
    
    // Session configuration
    session: {
      // Session timeout (in seconds)
      timeoutSeconds: 3600, // 1 hour
      
      // Whether to extend session on activity
      extendOnActivity: true,
    },
  },
  
  /**
   * Logging configuration
   */
  logging: {
    // Fields to mask in logs
    sensitiveFields: [
      'password',
      'token',
      'apiKey',
      'api_key',
      'authorization',
      'email',
      'creditCard',
      'ssn',
      'phoneNumber',
    ],
    
    // Whether to enable security event logging
    enableSecurityEventLogging: true,
    
    // Events to log
    eventsToLog: [
      'auth.login',
      'auth.logout',
      'auth.register',
      'auth.password_reset',
      'api_key.create',
      'api_key.regenerate',
      'api_key.use',
    ],
  },
}; 