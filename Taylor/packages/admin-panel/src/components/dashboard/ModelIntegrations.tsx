import React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export interface ModelConfig {
    id: string;
    model_name: string;
    description: string;
    model_version: string;
}

interface ModelIntegrationsProps {
    models: ModelConfig[];
    loading: boolean;
}

export const ModelIntegrations = ({ models, loading }: ModelIntegrationsProps) => {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Active Model Integrations</CardTitle>
                <CardDescription>
                    The following models are active and available for your integration.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p>Loading models...</p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Model Name</TableHead>
                                <TableHead>Version</TableHead>
                                <TableHead>Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {models.map((model) => (
                                <TableRow key={model.id}>
                                    <TableCell className="font-medium">{model.model_name}</TableCell>
                                    <TableCell>{model.model_version}</TableCell>
                                    <TableCell>{model.description}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}; 