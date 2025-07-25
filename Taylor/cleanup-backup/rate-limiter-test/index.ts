// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { RateLimiter, createRateLimitedResponse } from '../_shared/rate-limiter.ts'

console.log(`Rate Limiter Test Function up and running!`)

// Create a test rate limiter with 5 requests per 10 seconds
const testRateLimiter = new RateLimiter({
  tokensPerInterval: 5, // 5 tokens per interval
  interval: 10 * 1000, // 10 seconds
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { testKey = 'default-key' } = await req.json().catch(() => ({}));
    
    // Get client IP for testing
    const _clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Check if the request is allowed by the rate limiter
    const isAllowed = testRateLimiter.check(testKey);
    
    // Get remaining tokens
    const remaining = testRateLimiter.getRemaining(testKey);
    
    if (!isAllowed) {
      // Return rate limited response
      return createRateLimitedResponse({
        ...corsHeaders,
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': `${Math.ceil(Date.now() / 1000) + 10}`, // 10 seconds from now
      });
    }
    
    // Return success response with rate limit info
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Request allowed',
        rateLimit: {
          remaining,
          key: testKey,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': `${remaining}`,
        },
      }
    );
  } catch (error) {
    // Handle errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}) 