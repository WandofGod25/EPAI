import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";

interface ApiKeyManagerProps {
    apiKey: string | null;
    setApiKey: (key: string | null) => void;
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
}

export const ApiKeyManager = ({ apiKey, setApiKey, loading, setLoading, error: initialError }: ApiKeyManagerProps) => {
    const [error, setError] = useState<string | null>(initialError);
    
    useEffect(() => {
        setError(initialError);
    }, [initialError]);
    
    const handleGenerateKey = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('manage-partner-key');

            if (error) {
                throw error;
            }
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            setApiKey(data.api_key);
        } catch (error) {
            let errorMessage = 'An unexpected error occurred.';
            if (error instanceof FunctionsHttpError) {
                const errorBody = await error.context.json();
                errorMessage = errorBody.error || JSON.stringify(errorBody);
                console.error("Function returned an error:", errorBody);
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            setError(errorMessage);
            console.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeKey = async () => {
        if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.functions.invoke('manage-partner-key', {
                method: 'DELETE',
            });
            if (error) throw error;
            setApiKey(null);
            alert("API Key revoked successfully.");
        } catch (error) {
            if (error instanceof FunctionsHttpError) {
                const errorBody = await error.context.json();
                setError(errorBody.error || "Failed to revoke key.");
            } else {
                setError((error as Error).message);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const copyToClipboard = () => {
        if(apiKey) {
            navigator.clipboard.writeText(apiKey);
            alert("API Key copied to clipboard!");
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>API Key</CardTitle>
                    <CardDescription>
                        Use this key to authenticate your API requests. Keep it secret!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        );
    }
    
    if (error) {
        return (
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle>API Key</CardTitle>
                    <CardDescription>
                        Use this key to authenticate your API requests. Keep it secret!
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <p className="text-sm font-medium text-destructive">
                       Error: {error}
                    </p>
                    <Button onClick={handleGenerateKey}>Try Again</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>API Key Management</CardTitle>
                <CardDescription>
                    Generate and manage your API key. Treat it like a password!
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="mt-4">
                    {apiKey ? (
                        <div className="flex items-center gap-2">
                            <Input type="text" value={apiKey} readOnly className="font-mono" />
                            <Button onClick={copyToClipboard} variant="secondary">Copy</Button>
                            <Button onClick={handleRevokeKey} variant="destructive" disabled={loading}>Revoke</Button>
                        </div>
                    ) : (
                        <Button onClick={handleGenerateKey} disabled={loading}>
                            {loading ? 'Generating...' : 'Generate API Key'}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}; 