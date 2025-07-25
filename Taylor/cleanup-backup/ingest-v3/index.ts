// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { 
  withSecurity, 
  SECURITY_EVENTS as SECURITY_EVENT_TYPES
} from '../_shared/security-wrapper.ts';
import { logSecurityEvent, createSecureSuccessResponse, createSecureErrorResponse } from '../_shared/security-middleware.ts';

console.log("Ingest-v3 function active (Secure API Key Auth).");

// Define Zod schemas
const userProfileUpdateSchema = z.object({
  eventType: z.literal("user_profile_update"),
  payload: z.object({
    userId: z.string(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.string().optional(),
    company: z.string().optional(),
    lastSeenAt: z.string().datetime().optional(),
    customAttributes: z.record(z.any()).optional(),
  }),
});

const eventDetailsUpdateSchema = z.object({
  eventType: z.literal("event_details_update"),
  payload: z.object({
    eventId: z.string(),
    eventName: z.string(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    location: z.string().optional(),
    capacity: z.number().optional(),
    category: z.string().optional(),
  }),
});

const salesTransactionSchema = z.object({
  eventType: z.literal("sales_transaction"),
  payload: z.object({
    transactionId: z.string(),
    userId: z.string(),
    eventId: z.string().optional(),
    productId: z.string(),
    value: z.number(),
    currency: z.string(),
    quantity: z.number(),
    transactionAt: z.string().datetime(),
  }),
});

const userEngagementSchema = z.object({
  eventType: z.literal("user_engagement"),
  payload: z.object({
    userId: z.string(),
    engagementType: z.string(),
    resourceId: z.string().optional(),
    eventId: z.string().optional(),
    engagementAt: z.string().datetime(),
    duration: z.number().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

const eventAttendanceSchema = z.object({
  eventType: z.literal("event_attendance"),
  payload: z.object({
    eventId: z.string(),
    actualAttendees: z.number(),
    registeredAttendees: z.number(),
    attendanceRate: z.number().optional(),
    recordedAt: z.string().datetime(),
    demographicBreakdown: z.record(z.any()).optional(),
  }),
});

const ingestionEventSchema = z.discriminatedUnion("eventType", [
  userProfileUpdateSchema,
  eventDetailsUpdateSchema,
  salesTransactionSchema,
  userEngagementSchema,
  eventAttendanceSchema,
]);

// Handler function for the ingest endpoint
async function handleIngest(req: Request, partnerId?: string): Promise<Response> {
  // Create Supabase client
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  
  // Get client information for logging
  const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Parse request body
  let requestBody;
  try {
    requestBody = await req.json();
  } catch (_error) {
    await logSecurityEvent(
      supabaseClient,
      SECURITY_EVENT_TYPES.ACCESS_DENIED,
      { error: 'Invalid JSON format', clientIp, userAgent }
    );
    
    return createSecureErrorResponse("Invalid JSON format", 400);
  }
  
  // Validate request data
  const validationResult = ingestionEventSchema.safeParse(requestBody);
  if (!validationResult.success) {
    await logSecurityEvent(
      supabaseClient,
      SECURITY_EVENT_TYPES.ACCESS_DENIED,
      { 
        error: 'Invalid data', 
        details: validationResult.error.flatten(),
        clientIp,
        userAgent
      }
    );
    
    return createSecureErrorResponse("Invalid data", 400, {
      'X-Validation-Error': 'true'
    });
  }
  
  // Store the event
  try {
    const { data: event, error: insertError } = await supabaseClient
      .from("ingestion_events")
      .insert({
        partner_id: partnerId,
        payload: validationResult.data,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing event:", insertError);
      return createSecureErrorResponse("Could not save event", 500);
    }
    
    // Process the event and generate an insight
    let insight;
    switch (event.payload.eventType) {
      case "user_profile_update":
        insight = { prediction: "High-Value Lead", score: 0.92 };
        break;
      case "event_details_update":
        insight = { prediction: "Expected Attendance: 85%", score: 0.85 };
        break;
      case "sales_transaction":
        insight = { prediction: "Upsell Opportunity", score: 0.78 };
        break;
      case "user_engagement":
        insight = { prediction: "Highly Engaged User", score: 0.89 };
        break;
      case "event_attendance":
        insight = { prediction: "Attendance Above Average", score: 0.72 };
        break;
      default:
        insight = { prediction: "No prediction available", score: 0 };
    }

    // Save the insight
    const { data: insightData, error: insightError } = await supabaseClient
      .from("insights")
      .insert({
        partner_id: partnerId,
        ingestion_event_id: event.id,
        model_name: `${event.payload.eventType}-model`,
        prediction: insight.prediction,
        confidence_score: insight.score,
      })
      .select()
      .single();

    if (insightError) {
      console.error("Error saving insight:", insightError);
      // We still return success because the event was saved
    }
    
    // Return success response
    return createSecureSuccessResponse({
      success: true,
      message: "Event processed successfully",
      eventId: event.id,
      insightId: insightData?.id || null,
    }, 201);
  } catch (_error) {
    console.error("Unexpected error:", _error);
    return createSecureErrorResponse(
      "An unexpected error occurred",
      500
    );
  }
}

// Apply security middleware to the handler
const secureHandler = withSecurity(handleIngest, {
  requireApiKey: true,
  ipRateLimit: 60,
  apiKeyRateLimit: 180,
});

// Serve the function
serve(secureHandler); 