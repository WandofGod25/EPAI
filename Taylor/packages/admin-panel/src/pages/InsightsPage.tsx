import React, { useEffect } from 'react';
import { useInsights } from '@/hooks/useInsights';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

const InsightsPage = () => {
    const { insights, loading, error, refetch } = useInsights();

    // Enhanced debugging
    useEffect(() => {
        console.log('🔍 InsightsPage: Component mounted');
        console.log('🔍 InsightsPage: Current state:', { insights: insights.length, loading, error });
    }, [insights, loading, error]);

    const handleRetry = async () => {
        console.log('🔍 InsightsPage: Manual retry triggered');
        await refetch();
    };

    const handleRefresh = async () => {
        console.log('🔍 InsightsPage: Manual refresh triggered');
        window.location.reload();
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Insights</h1>
                <p className="text-gray-500">
                    Here are the latest predictive insights generated for your account.
                </p>
            </div>

            {/* Enhanced error display */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error Loading Insights</AlertTitle>
                    <AlertDescription className="space-y-2">
                        <p className="font-medium">{error}</p>
                        <div className="text-sm text-gray-300">
                            <p>This error has been logged to the console for debugging.</p>
                            <p>If this issue persists, please try refreshing the page or contact support.</p>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button onClick={handleRetry} variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                            </Button>
                            <Button onClick={handleRefresh} variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Page
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Loading state */}
            {loading && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading insights...
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            )}

            {/* No insights state */}
            {!loading && !error && insights.length === 0 && (
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>No Insights Yet</AlertTitle>
                    <AlertDescription>
                        As you send data to the ingestion endpoint, new insights will be generated and will appear here.
                        <div className="mt-2">
                            <Button onClick={handleRetry} variant="outline" size="sm">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Check for New Insights
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Success state with insights */}
            {!loading && !error && insights.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Terminal className="h-4 w-4" />
                            {insights.length} insight{insights.length !== 1 ? 's' : ''} found
                        </div>
                        <Button onClick={handleRetry} variant="outline" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {insights.map((insight) => (
                            <InsightCard key={insight.id} insight={insight} />
                        ))}
                    </div>
                </div>
            )}

            {/* Debug information (only in development) */}
            {process.env.NODE_ENV === 'development' && (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Debug Information</AlertTitle>
                    <AlertDescription className="text-xs font-mono">
                        <div>Loading: {loading.toString()}</div>
                        <div>Error: {error || 'None'}</div>
                        <div>Insights Count: {insights.length}</div>
                        <div>Component State: {JSON.stringify({ loading, error: !!error, insightsCount: insights.length }, null, 2)}</div>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
};

export default InsightsPage; 