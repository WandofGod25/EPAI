import React from 'react';
import { useModels } from '@/hooks/useModels';
import { ModelCard } from '@/components/dashboard/ModelCard';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 6;

const ModelsPage = () => {
    const { models, loading, page, count, changePage } = useModels();

    const totalPages = count ? Math.ceil(count / PAGE_SIZE) : 0;

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold">AI Models</h1>
                <p className="text-gray-500">
                    Browse the list of available predictive models you can integrate with.
                </p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-40 w-full" />
                </div>
            ) : models.length === 0 ? (
                <div className="flex items-center justify-center h-64 border rounded-md">
                    <p className="text-gray-500">No models found.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {models.map((model) => (
                            <ModelCard key={model.id} model={model} />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changePage(page - 1)}
                                disabled={page === 0}
                            >
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {page + 1} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changePage(page + 1)}
                                disabled={page + 1 >= totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ModelsPage; 