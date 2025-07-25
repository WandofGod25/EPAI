import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, EyeOff } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ApiKeyCardProps {
  apiKey: string | null;
  error: unknown;
  onRegenerate: () => void;
}

export const ApiKeyCard = ({ apiKey, error, onRegenerate }: ApiKeyCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  // Debug: Log props
  console.log("ApiKeyCard: Received props - apiKey:", apiKey, "error:", error);
  console.log("ApiKeyCard: apiKey type:", typeof apiKey);
  console.log("ApiKeyCard: apiKey length:", apiKey ? apiKey.length : 'null/undefined');
  console.log("ApiKeyCard: Input value will be:", apiKey || "...");

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({ title: "Copied!", description: "API Key copied to clipboard." });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>
          Use this key to authenticate your API requests. Keep it secret!
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p><strong>Error:</strong> {typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : String(error)}</p>
        ) : null}
        {error ? (
          <p>Could not load the API Key. Please try refreshing the page.</p>
        ) : (
          <div className="flex items-center space-x-2">
            <Input
              type={isVisible ? "text" : "password"}
              readOnly
              value={apiKey || "..."}
              className="font-mono"
            />
            <Button variant="ghost" size="icon" onClick={() => setIsVisible(!isVisible)}>
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={!apiKey}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <div className="flex justify-between items-center w-full">
          <p className="text-sm text-muted-foreground">
            Think your key is compromised? Regenerate it.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Regenerate Key</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently invalidate your old API key. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRegenerate}>
                  Yes, regenerate key
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}; 