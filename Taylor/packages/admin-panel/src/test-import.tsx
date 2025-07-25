import React from 'react';
import { InsightCard } from './components/dashboard/InsightCard';
import { Insight } from './hooks/useInsights';

const TestImport: React.FC = () => {
  // Create a sample insight that matches the actual Insight interface
  const sampleInsight: Insight = {
    id: 'test-insight-123',
    created_at: new Date().toISOString(),
    partner_id: 'test-partner-456',
    model_id: 'test-model-789',
    model_name: 'Test Model',
    prediction_output: {
      result: '85%',
      confidence: 0.95,
      details: 'This is a test prediction with high confidence'
    },
    is_delivered: false,
    metadata: {
      test: true,
      source: 'test-import-page'
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Testing Import from Dashboard InsightCard</h1>
        <p className="text-gray-500">This page tests the InsightCard component from the dashboard.</p>
      </div>
      
      <div className="max-w-md">
        <InsightCard insight={sampleInsight} />
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Sample Data Structure:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(sampleInsight, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestImport; 