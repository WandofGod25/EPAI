import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Model } from "@/hooks/useModels";

interface ModelCardProps {
  model: Model;
}

export const ModelCard = ({ model }: ModelCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle>{model.model_name}</CardTitle>
            <Badge variant="outline">v{model.model_version}</Badge>
        </div>
        <CardDescription>{model.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Future content can go here, like usage examples or API endpoints */}
        <p className="text-sm text-muted-foreground">ID: {model.id}</p>
      </CardContent>
    </Card>
  );
}; 