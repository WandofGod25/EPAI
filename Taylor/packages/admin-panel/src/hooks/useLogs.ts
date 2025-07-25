import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";

export interface Log {
  id: string;
  created_at: string;
  method: string;
  path: string;
  status_code: number;
  request_body: unknown;
  response_body: unknown;
}

export const useLogs = () => {
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.functions.invoke('get-partner-logs', {
                    method: 'POST'
                });

                if (error) {
                    throw error;
                }
                
                setLogs(data?.logs || []);
            } catch (error) {
                console.error('Error fetching logs:', error);
                toast({
                    title: "Error",
                    description: "Could not fetch API logs.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [toast]);

    return { logs, loading };
}; 