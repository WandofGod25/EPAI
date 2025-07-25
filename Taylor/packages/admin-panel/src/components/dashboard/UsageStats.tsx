import React from 'react';
import { useUsageStats, UsageStatsData } from '@/hooks/useUsageStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, ArrowUpRight, Clock } from 'lucide-react';

const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

export const UsageStats = () => {
    const { stats, loading, error }: { stats: UsageStatsData | null, loading: boolean, error: unknown } = useUsageStats();

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-24 w-full" data-testid="skeleton" />
                <Skeleton className="h-24 w-full" data-testid="skeleton" />
                <Skeleton className="h-24 w-full" data-testid="skeleton" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error Loading Stats</AlertTitle>
                <AlertDescription>{typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : String(error)}</AlertDescription>
            </Alert>
        );
    }
    
    if (!stats) {
        return null;
    }

    return (
        <div>
            <h3 className="text-2xl font-bold tracking-tight mb-4">Usage Statistics</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Total Ingestion Events" 
                    value={stats.total_ingestion_events} 
                    icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />} 
                />
                <StatCard 
                    title="Total Insights Generated" 
                    value={stats.total_insights_generated} 
                    icon={<ArrowUpRight className="h-4 w-4 text-muted-foreground" />} 
                />
                <StatCard 
                    title="Last Event Received" 
                    value={stats.latest_event_timestamp ? new Date(stats.latest_event_timestamp).toLocaleDateString() : 'N/A'}
                    icon={<Clock className="h-4 w-4 text-muted-foreground" />} 
                />
            </div>
        </div>
    );
}; 