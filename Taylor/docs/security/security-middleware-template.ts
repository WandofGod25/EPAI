// Security Middleware Template for Edge Functions
// This template provides a standardized approach to implementing security features in Edge Functions.

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "no-referrer"
};

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

// Create a secure response with security headers
function createSecureResponse(body: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(body),
    { 
      status, 
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders,
        ...securityHeaders
      } 
    }
  );
}

// API Key validation
async function validateApiKey(req: Request): Promise<boolean> {
  const apiKey = req.headers.get('apikey');
  
  // Check if API key is provided
  if (!apiKey) {
    return false;
  }
  
  // Check for SQL injection attempts
  const sqlInjectionPattern = /['";]|(--)|(\b(OR|AND)\b)|(\bDROP\b)|(\bSELECT\b)|(\bUNION\b)|(\bINSERT\b)|(\bDELETE\b)|(\bUPDATE\b)/i;
  if (sqlInjectionPattern.test(apiKey)) {
    console.log("SQL injection attempt detected in API key");
    return false;
  }
  
  // TODO: Add your API key validation logic here
  // This could involve checking the API key against a database
  // For example:
  // const { data, error } = await supabaseClient
  //   .from('api_keys')
  //   .select('id')
  //   .eq('key_hash', hash(apiKey))
  //   .eq('is_active', true)
  //   .single();
  
  // return !!data && !error;
  
  // For this template, we'll just check if it's not "invalid_api_key"
  return apiKey !== 'invalid_api_key';
}

// Rate limiting
// This is a simple in-memory rate limiter
// For production, consider using a distributed rate limiter with Redis
const rateLimits = new Map<string, { count: number, timestamp: number }>();

function isRateLimited(identifier: string, limit: number = 50, windowMs: number = 60000): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Clean up old entries
  for (const [key, value] of rateLimits.entries()) {
    if (value.timestamp < windowStart) {
      rateLimits.delete(key);
    }
  }
  
  // Check if the identifier is rate limited
  const current = rateLimits.get(identifier) || { count: 0, timestamp: now };
  
  if (current.count >= limit) {
    return true;
  }
  
  // Update the rate limit counter
  rateLimits.set(identifier, {
    count: current.count + 1,
    timestamp: now
  });
  
  return false;
}

// Example handler function with security middleware
async function secureHandler(req: Request): Promise<Response> {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...corsHeaders, ...securityHeaders }
    });
  }
  
  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check rate limiting
    if (isRateLimited(clientIp)) {
      return createSecureResponse({ error: "Too many requests" }, 429);
    }
    
    // Validate API key
    const isValidApiKey = await validateApiKey(req);
    if (!isValidApiKey) {
      return createSecureResponse({ error: "Invalid API key" }, 401);
    }
    
    // Process the request
    // TODO: Add your request processing logic here
    
    // Return a successful response
    return createSecureResponse({ 
      success: true, 
      message: "Request processed successfully" 
    });
    
  } catch (error) {
    console.error('Error in handler:', error);
    return createSecureResponse({ error: "Internal server error" }, 500);
  }
}

// Usage:
// serve(secureHandler); 