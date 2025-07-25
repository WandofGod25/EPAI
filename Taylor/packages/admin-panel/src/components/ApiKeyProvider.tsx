import React, { useState, useEffect, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { FunctionsHttpError } from "@supabase/functions-js";
import { ApiKeyContext } from "@/context/ApiKeyContext";

export const ApiKeyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const regenerateApiKey = useCallback(async () => {
    console.log("ApiKeyProvider: Calling regenerateApiKey.");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-key-manager', {
        method: 'POST',
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      console.log("ApiKeyProvider: regenerateApiKey response:", data);
      console.log("ApiKeyProvider: Setting apiKey to:", data.apiKey);
      setApiKey(data.apiKey);
      toast({
        title: "API Key Regenerated",
        description: "Your new API key is ready.",
      });
    } catch (err) {
      console.error("ApiKeyProvider: Error during regenerateApiKey:", err);
      setError(err as Error);
      toast({
        title: "Error Regenerating API Key",
        description: err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getApiKey = useCallback(async () => {
    if (!user) return;

    console.log("ApiKeyProvider: Kicking off getApiKey flow.");
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('api-key-manager', {
        method: 'GET',
      });

      if (invokeError) {
        const functionError = invokeError as FunctionsHttpError;
        try {
          const errorBody = await functionError.context.json();
          if (functionError.context.status === 404 && errorBody.code === 'PGRST116') {
            console.log("ApiKeyProvider: GET failed with 404, no key exists. Calling regenerateApiKey to create one.");
            await regenerateApiKey();
          } else {
            throw invokeError;
          }
        } catch {
          throw invokeError;
        }
      } else {
        console.log("ApiKeyProvider: GET successful, key found.");
        console.log("ApiKeyProvider: Response data:", data);
        console.log("ApiKeyProvider: Setting apiKey to:", data.apiKey);
        console.log("ApiKeyProvider: apiKey type:", typeof data.apiKey);
        console.log("ApiKeyProvider: apiKey length:", data.apiKey ? data.apiKey.length : 'null/undefined');
        setApiKey(data.apiKey);
      }
    } catch (err) {
      console.error("ApiKeyProvider: Unexpected error in getApiKey:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, regenerateApiKey]);

  useEffect(() => {
    if (user?.id) {
      console.log(`ApiKeyProvider: useEffect triggered for user ${user.id}.`);
      getApiKey();
    } else {
      console.log("ApiKeyProvider: useEffect triggered, but no user.id. Clearing API key.");
      setApiKey(null);
      setLoading(false);
    }
  }, [user?.id, getApiKey]);

  // Debug: Log current state
  useEffect(() => {
    console.log("ApiKeyProvider: Current state - apiKey:", apiKey, "loading:", loading, "error:", error);
  }, [apiKey, loading, error]);

  const value = { apiKey, loading, error, regenerateApiKey, getApiKey };

  return (
    <ApiKeyContext.Provider value={value}>
      {children}
    </ApiKeyContext.Provider>
  );
}; 