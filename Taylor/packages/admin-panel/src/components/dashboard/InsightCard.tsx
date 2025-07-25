import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Insight } from "@/hooks/useInsights";
import { BrainCircuit, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface InsightCardProps {
    insight: Insight;
}

export const InsightCard = ({ insight }: InsightCardProps) => {
    const { toast } = useToast();

    const copyInsightId = () => {
        navigator.clipboard.writeText(insight.id);
        toast({
            title: "Copied!",
            description: "Insight ID copied to clipboard",
            duration: 3000,
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{insight.model_name}</CardTitle>
                <BrainCircuit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-lg font-bold">
                    {/* Display the prediction output result */}
                    {typeof insight.prediction_output?.result === 'string' ? insight.prediction_output.result :
                     typeof insight.prediction_output?.prediction === 'string' ? insight.prediction_output.prediction :
                     typeof insight.prediction_output?.forecast === 'string' ? insight.prediction_output.forecast :
                     'Complex Data'}
                </div>
                <p className="text-xs text-muted-foreground">
                    Generated on {new Date(insight.created_at).toLocaleString()}
                </p>
                
                {/* Display the insight ID with a copy button */}
                <div className="mt-2 flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                    <code className="text-xs overflow-hidden text-ellipsis">{insight.id}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copyInsightId}>
                        <Copy className="h-3 w-3" />
                    </Button>
                </div>
                
                {/* Render prediction output data as key-value pairs */}
                <pre className="mt-2 w-full rounded-md bg-slate-900 p-4">
                    <code className="text-white">
                        {JSON.stringify(insight.prediction_output, null, 2)}
                    </code>
                </pre>
            </CardContent>
        </Card>
    );
}; 