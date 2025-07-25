import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { method } = req

    switch (method) {
      case 'GET':
        // Get all models
        const { data: models, error: getError } = await supabaseClient
          .from('models')
          .select('*')
          .order('created_at', { ascending: true })

        if (getError) {
          return new Response(
            JSON.stringify({ error: getError.message }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ models }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      case 'POST':
        // Create or seed models
        const { action } = await req.json()

        if (action === 'seed') {
          // Create the 2 documented core models
          const coreModels = [
            {
              model_name: 'Attendance Forecast',
              description: 'Predicts event attendance based on historical data, engagement metrics, and external factors',
              model_version: '1.0.0',
              status: 'active',
              metadata: {
                category: 'Event Management',
                useCase: 'Event planning, capacity management, resource allocation',
                inputFeatures: ['historical_attendance', 'event_type', 'marketing_spend', 'seasonality'],
                outputType: 'regression',
                accuracy: 0.85
              }
            },
            {
              model_name: 'Lead Scoring',
              description: 'Scores leads based on engagement, demographics, and behavior patterns',
              model_version: '1.0.0',
              status: 'active',
              metadata: {
                category: 'CRM Systems',
                useCase: 'Sales prioritization, lead qualification, conversion optimization',
                inputFeatures: ['engagement_score', 'demographics', 'behavior_patterns', 'source'],
                outputType: 'classification',
                accuracy: 0.88
              }
            }
          ]

          // Clear existing models first
          await supabaseClient.from('models').delete().neq('id', '00000000-0000-0000-0000-000000000000')

          // Insert core models
          const { data: insertedModels, error: insertError } = await supabaseClient
            .from('models')
            .insert(coreModels)
            .select()

          if (insertError) {
            return new Response(
              JSON.stringify({ error: insertError.message }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          return new Response(
            JSON.stringify({ 
              message: 'Core models created successfully',
              models: insertedModels 
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
