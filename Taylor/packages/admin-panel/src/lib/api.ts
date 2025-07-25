import { supabase } from './supabaseClient';

export const callSupabaseFunction = async (functionName: string, body?: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error("Not authenticated. Please log in.");
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
        throw new Error("Supabase URL or anonymous key is not configured.");
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': anonKey,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('Edge function returned non-2xx status:', {
            status: response.status,
            statusText: response.statusText,
            body: errorBody,
        });

        let errorMessage = 'An unknown error occurred.';
        try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error) {
                errorMessage = errorJson.error;
            } else if (errorJson.msg) {
                errorMessage = errorJson.msg;
            } else {
                errorMessage = `Received non-standard error object: ${JSON.stringify(errorJson)}`;
            }
        } catch {
            // The body was not JSON, use the raw text.
            if (errorBody) {
                errorMessage = `Function returned non-JSON error: ${errorBody}`;
            }
        }
        throw new Error(errorMessage);
    }

    // If response is ok, it should have a body.
    try {
        return await response.json();
    } catch {
        throw new Error("Failed to parse successful response as JSON.");
    }
};

export const getLogs = (filters: { status?: string, path?: string, page?: number } = {}) => 
    callSupabaseFunction('get-partner-logs', filters);