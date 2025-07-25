import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT token
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify JWT and get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        }
      )
    }

    // Get partner ID
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partner) {
      return new Response(
        JSON.stringify({ error: 'Partner not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        }
      )
    }

    const partnerId = partner.id

    // Check cache first
    const { data: cachedData, error: cacheError } = await supabase
      .from('usage_stats_cache')
      .select('cache_data, expires_at')
      .eq('partner_id', partnerId)
      .single()

    // If cache exists and is not expired, return cached data
    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      return new Response(
        JSON.stringify({
          ...cachedData.cache_data,
          cached: true,
          cache_expires: cachedData.expires_at
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Use optimized function to get usage statistics
    const { data: usageStats, error: statsError } = await supabase
      .rpc('get_partner_usage_summary_cached', { partner_uuid: partnerId })

    if (statsError) {
      throw statsError
    }

    const responseData = {
      total_ingestion_events: usageStats?.[0]?.total_ingestion_events || 0,
      total_insights_generated: usageStats?.[0]?.total_insights_generated || 0,
      total_api_keys: usageStats?.[0]?.total_api_keys || 0,
      total_logs: usageStats?.[0]?.total_logs || 0,
      latest_event_timestamp: usageStats?.[0]?.latest_event_timestamp || null,
      cached: false
    }

    // Update cache with fresh data
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15) // Cache for 15 minutes

    // Upsert cache entry
    await supabase
      .from('usage_stats_cache')
      .upsert({
        partner_id: partnerId,
        cache_data: responseData,
        expires_at: expiresAt.toISOString()
      })

    return new Response(
      JSON.stringify(responseData),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in get-usage-stats-optimized:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 