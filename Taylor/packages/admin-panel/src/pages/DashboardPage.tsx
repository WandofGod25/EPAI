import React, { useEffect, useState, useCallback } from "react";
import { UsageStats } from "@/components/dashboard/UsageStats";
import { ModelIntegrations, ModelConfig } from "@/components/dashboard/ModelIntegrations";
import { supabase } from "@/lib/supabaseClient";

const DashboardPage = () => {
    // API Key logic is now managed on the Settings page.
    // const [apiKey, setApiKey] = useState<string | null>(null);
    const [models, setModels] = useState<ModelConfig[]>([]);
    // const [apiKeyError, setApiKeyError] = useState<string | null>(null);

    // const [loadingKey, setLoadingKey] = useState(false);
    const [loadingModels, setLoadingModels] = useState(false);

    // const getApiKey = useCallback(async () => {
    //     setLoadingKey(true);
    //     setApiKeyError(null);
    //     try {
    //         const { data, error } = await supabase.functions.invoke('manage-partner-key');

    //         if (error) {
    //             throw error; // Let the catch block handle it
    //         }
            
    //         if (data?.api_key) {
    //             setApiKey(data.api_key);
    //         } else {
    //              setApiKey(null);
    //              // This case might happen if the function logic changes.
    //              console.log("API key function returned successfully but without a key.");
    //         }
    //     } catch (error) {
    //         let errorMessage = 'Could not load the API Key. Please try refreshing the page.';
    //         if (error instanceof FunctionsHttpError) {
    //             const errorContext = await error.context.json();
    //             errorMessage = errorContext.error || JSON.stringify(errorContext);
    //             console.error('Error fetching API key:', errorMessage);
    //         } else if (error instanceof Error) {
    //             errorMessage = error.message;
    //             console.error('Error fetching API key:', errorMessage);
    //         }
    //         setApiKeyError(errorMessage);
    //     } finally {
    //         setLoadingKey(false);
    //     }
    // }, []);

    const fetchModels = useCallback(async () => {
        setLoadingModels(true);
        try {
            const { data, error } = await supabase.functions.invoke('get-partner-models');
            if (error) throw error;
            setModels(data || []);
        } catch (error) {
            console.error("Error fetching models:", error);
        } finally {
            setLoadingModels(false);
        }
    }, []);

    useEffect(() => {
        // getApiKey();
        fetchModels();
    }, [fetchModels]);

    return (
        <div className="flex flex-col gap-8">
             {/* <ApiKeyManager 
                apiKey={apiKey} 
                setApiKey={setApiKey} 
                loading={loadingKey}
                setLoading={setLoadingKey}
                error={apiKeyError}
            /> */}
            <UsageStats />
            <ModelIntegrations models={models} loading={loadingModels} />
        </div>
    );
};

export default DashboardPage; 