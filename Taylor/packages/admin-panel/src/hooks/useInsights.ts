import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";

export interface Insight {
    id: string;
    created_at: string;
    partner_id: string;
    model_id: string;
    model_name: string;
    prediction_output: Record<string, unknown>;
    is_delivered: boolean;
    metadata: Record<string, unknown> | null;
}

export const useInsights = () => {
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchInsights = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Enhanced debugging
            console.log('🔍 useInsights: Starting fetch...');
            
            // Check if Supabase client is properly initialized
            if (!supabase) {
                throw new Error('Supabase client not initialized');
            }

            // Check authentication state
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No active session found');
            }

            console.log('🔍 useInsights: Session found, calling Edge Function...');

            // Call the Edge Function with enhanced error handling
            const { data, error } = await supabase.functions.invoke('get-insights', {
                method: 'POST'
            });

            console.log('🔍 useInsights: Edge Function response received');

            if (error) {
                console.error('🔍 useInsights: Edge Function error:', error);
                
                // Enhanced error analysis
                let errorMessage = error.message;
                
                if (error.message.includes('fetch')) {
                    errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
                } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                    errorMessage = 'Authentication error: Please log in again.';
                } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                    errorMessage = 'CORS error: Browser security policy blocked the request.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timeout: The server took too long to respond.';
                } else if (error.message.includes('Failed to fetch')) {
                    errorMessage = 'Connection failed: Unable to reach the server.';
                }
                
                throw new Error(errorMessage);
            }

            console.log('🔍 useInsights: Processing response data...');

            if (data) {
                console.log('🔍 useInsights: Data received:', data);
                setInsights(data.insights || []);
            } else {
                console.log('🔍 useInsights: No data received');
                setInsights([]);
            }

            console.log('🔍 useInsights: Fetch completed successfully');

        } catch (err) {
            const error = err as Error;
            console.error("🔍 useInsights: Error fetching insights:", error);
            console.error("🔍 useInsights: Error stack:", error.stack);
            
            setError(error.message);
            toast({
                variant: "destructive",
                title: "Failed to fetch insights",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        console.log('🔍 useInsights: useEffect triggered');
        fetchInsights();
    }, [fetchInsights]);

    // Enhanced refetch function with debugging
    const refetch = useCallback(async () => {
        console.log('🔍 useInsights: Manual refetch triggered');
        await fetchInsights();
    }, [fetchInsights]);

    return { insights, loading, error, refetch };
}; 