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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check cache first
    const cacheKey = 'models_list_active'
    const { data: cachedData, error: cacheError } = await supabase
      .from('models_cache')
      .select('cache_data, expires_at')
      .eq('cache_key', cacheKey)
      .single()

    // If cache exists and is not expired, return cached data
    if (cachedData && new Date(cachedData.expires_at) > new Date()) {
      return new Response(
        JSON.stringify({
          models: cachedData.cache_data.models,
          count: cachedData.cache_data.count,
          cached: true,
          cache_expires: cachedData.expires_at
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Fetch fresh data from database
    const { data: models, error } = await supabase
      .from('models')
      .select('*')
      .eq('status', 'active')
      .order('model_name', { ascending: true })

    if (error) {
      throw error
    }

    const responseData = {
      models: models || [],
      count: models?.length || 0,
      cached: false
    }

    // Update cache with fresh data
    const cacheData = {
      models: responseData.models,
      count: responseData.count,
      timestamp: new Date().toISOString()
    }

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Cache for 1 hour

    // Upsert cache entry
    await supabase
      .from('models_cache')
      .upsert({
        cache_key: cacheKey,
        cache_data: cacheData,
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
    console.error('Error in get-models-optimized:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 