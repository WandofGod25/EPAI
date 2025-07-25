import React, { useState, useEffect } from 'react';
import { useApiKey } from '../hooks/useApiKey';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { InsightCard } from '../components/InsightCard';
import { useInsights } from '../hooks/useInsights';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';

const IntegrationPage: React.FC = () => {
  const { apiKey, loading: apiKeyLoading } = useApiKey();
  const { insights, loading: insightsLoading } = useInsights();
  const { toast } = useToast();
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const [selectedInsightId, setSelectedInsightId] = useState<string>('');

  // Select the first insight ID when insights are loaded
  useEffect(() => {
    if (insights && insights.length > 0 && !selectedInsightId) {
      setSelectedInsightId(insights[0].id);
    }
  }, [insights, selectedInsightId]);

  // Sample insight data for preview
  const sampleInsight = {
    title: 'Predicted Attendance',
    icon: 'chart',
    confidence: 0.92,
    value: '487',
    description: 'Based on historical data and current registrations, we predict 487 attendees for your upcoming event.',
    generatedDate: new Date().toLocaleDateString(),
    modelVersion: 'AttendancePredictor v1.2'
  };

  // Generate script tag for SDK
  const scriptTag = `<script 
  src="${supabaseUrl}/storage/v1/object/public/sdk/epai-sdk.iife.js" 
  data-epai-api-key="${apiKey || 'YOUR_API_KEY'}" 
  data-epai-url="${supabaseUrl}"
  data-epai-theme="light"
></script>`;

  // Generate HTML example for embedding an insight
  const htmlExample = `<!-- 1. Add a container with a unique ID -->
<div id="epai-insight-container"></div>

<!-- 2. Add the SDK script tag -->
${scriptTag}

<!-- 3. Add script to render the insight -->
<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize the SDK (this happens automatically from the script tag attributes)
    // const sdk = new EPAIInsightSDK({
    //   apiKey: 'YOUR_API_KEY',
    //   supabaseUrl: '${supabaseUrl}'
    // });
    
    // Render an insight into the container
    window.epaiInsightSDK.renderInsight({
      insightId: '${selectedInsightId || 'YOUR_INSIGHT_ID'}',
      containerId: 'epai-insight-container',
      showConfidence: true,
      showTitle: true,
      compact: false,
      theme: 'light' // or 'dark'
    });
  });
</script>`;

  const copyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: successMessage,
        duration: 3000,
      });
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Integration Guide</h1>
        <Badge variant="outline" className="px-3 py-1">
          SDK v0.1.0
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Integration Instructions */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">1. Add the SDK to your website</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Copy the script tag below and add it to the <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{'<head>'}</code> section of your HTML:
            </p>
            
            {apiKeyLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                  <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{scriptTag}</pre>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(scriptTag, 'Script tag copied to clipboard!')}
                >
                  Copy Script Tag
                </Button>
              </>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">2. Select an Insight ID to Display</h2>
            
            {insightsLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : insights && insights.length > 0 ? (
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">
                  Select an insight ID from your available insights:
                </p>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedInsightId}
                  onChange={(e) => setSelectedInsightId(e.target.value)}
                >
                  {insights.map(insight => (
                    <option key={insight.id} value={insight.id}>
                      {insight.model_name} ({insight.id.substring(0, 8)}...)
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-sm font-medium">Selected ID:</p>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">{selectedInsightId}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(selectedInsightId, 'Insight ID copied to clipboard!')}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No insights available</AlertTitle>
                <AlertDescription>
                  You need to ingest data first to generate insights. Go to the Insights page to check if you have any insights available.
                </AlertDescription>
              </Alert>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">3. Render insights on your page</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Add a container element and use the SDK to render insights:
            </p>
            
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap">{htmlExample}</pre>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => copyToClipboard(htmlExample, 'HTML example copied to clipboard!')}
            >
              Copy HTML Example
            </Button>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">4. Customization Options</h2>
            <div className="space-y-2">
              <h3 className="font-medium">Available options:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">theme</code>: &apos;light&apos; or &apos;dark&apos;</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">showConfidence</code>: true or false</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">showTitle</code>: true or false</li>
                <li><code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">compact</code>: true or false</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">Standard Card</h3>
                <div className="border rounded-lg p-4 bg-white">
                  <InsightCard data={sampleInsight} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Dark Theme</h3>
                <div className="border rounded-lg p-4 bg-gray-900">
                  <InsightCard theme="dark" data={sampleInsight} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Compact Mode</h3>
                <div className="border rounded-lg p-4 bg-white">
                  <InsightCard compact data={sampleInsight} />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Without Confidence</h3>
                <div className="border rounded-lg p-4 bg-white">
                  <InsightCard showConfidence={false} data={sampleInsight} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Getting Your Insight IDs</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You can find your insight IDs on the <a href="/insights" className="text-blue-600 hover:underline">Insights page</a>. Each insight has a unique ID that you can use with the SDK.
            </p>
            <Button variant="default" onClick={() => window.location.href = '/insights'}>
              Go to Insights
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IntegrationPage; 