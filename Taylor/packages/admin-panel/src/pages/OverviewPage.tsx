import React from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useApiKey } from '@/hooks/useApiKey';
import { ApiKeyCard } from '@/components/dashboard/ApiKeyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { UsageStats } from '@/components/dashboard/UsageStats';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const OverviewPage = () => {
  const { user } = useAuth();
  const { apiKey, loading, error, regenerateApiKey } = useApiKey();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.user_metadata.partner_name || user?.email}</CardTitle>
          <CardDescription>
            Here&apos;s a summary of your account and API usage.
          </CardDescription>
        </CardHeader>
      </Card>
      
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ApiKeyCard apiKey={apiKey} error={error} onRegenerate={regenerateApiKey} />
      )}
      
      <UsageStats />
    </div>
  );
};

export default OverviewPage; 