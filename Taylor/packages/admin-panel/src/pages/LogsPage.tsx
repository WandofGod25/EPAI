import React from 'react';
import { useLogs } from '@/hooks/useLogs';
import { LogsTable } from '@/components/dashboard/LogsTable';
import { Skeleton } from "@/components/ui/skeleton";

const LogsPage = () => {
    const { logs, loading } = useLogs();

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">API Logs</h1>
                <p className="text-gray-500">View a list of your recent API requests.</p>
            </div>

            {loading ? (
                <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            ) : logs.length === 0 ? (
                <div className="flex items-center justify-center h-64 border rounded-md">
                    <p className="text-gray-500">No logs found.</p>
                </div>
            ) : (
                <LogsTable logs={logs} />
            )}
        </div>
    );
};

export default LogsPage; 