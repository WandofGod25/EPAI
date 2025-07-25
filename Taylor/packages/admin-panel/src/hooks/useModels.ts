import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/hooks/use-toast";

export interface Model {
  id: string;
  model_name: string;
  description: string;
  model_version: string;
}

export const useModels = () => {
    const [models, setModels] = useState<Model[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [count, setCount] = useState<number | null>(null);
    const { toast } = useToast();

    const fetchModels = useCallback(async (newPage: number) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-models', {
                body: { page: newPage },
            });

            if (error) {
                throw error;
            }
            
            if (data) {
                setModels(data.models || []);
                setCount(data.count);
            }
        } catch (error) {
            console.error('Error fetching models:', error);
            toast({
                title: "Error",
                description: "Could not fetch AI models.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchModels(page);
    }, [page, fetchModels]);

    const changePage = (newPage: number) => {
        setPage(newPage);
    };

    return { models, loading, page, count, changePage };
}; 