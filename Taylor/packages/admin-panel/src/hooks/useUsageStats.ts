import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface UsageStatsData {
    total_ingestion_events: number;
    total_insights_generated: number;
    latest_event_timestamp: string | null;
}

export const useUsageStats = () => {
    const { user, loading: authLoading } = useAuth();
    const [stats, setStats] = useState<UsageStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStats = async () => {
            if (authLoading) {
                return;
            }
            if (!user) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            setError(null);

            try {
                const { data, error } = await supabase.functions.invoke('get-usage-stats');

                if (error) throw error;
                if (data.error) throw new Error(data.error);

                setStats(data);
            } catch (err: unknown) {
                let errorMessage = "An unexpected error occurred.";
                if (typeof err === 'object' && err !== null && 'name' in err && err.name === 'FunctionsHttpError') {
                    const context = (err as { context?: unknown }).context;
                    type ContextWithJson = { json: () => Promise<unknown> };
                    if (context && typeof (context as ContextWithJson).json === 'function') {
                        try {
                            const errorBody = await (context as ContextWithJson).json();
                            errorMessage = (errorBody as { error?: string }).error || JSON.stringify(errorBody);
                        } catch {
                            errorMessage = "Could not parse error response from function."
                        }
                    } else {
                        errorMessage = "No context or json function available on error object.";
                    }
                } else if (err instanceof Error) {
                    errorMessage = err.message;
                }
                
                console.error("Error fetching usage stats:", errorMessage, err);
                setError(errorMessage);
                toast({
                    variant: "destructive",
                    title: "Error Loading Stats",
                    description: errorMessage,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [toast, user, authLoading]);

    return { stats, loading, error };
}; 