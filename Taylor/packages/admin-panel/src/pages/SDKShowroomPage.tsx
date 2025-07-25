import React from 'react';
// This file will act as a "Storybook" or "Showroom" for our SDK components.
import { InsightCard } from '@epai/insight-sdk';

// Sample data that matches the component's expected structure
const sampleInsightData = {
  title: "Lead Score",
  icon: "bolt",
  confidence: 0.92,
  value: "+85",
  description: "Predicted score for this lead",
  generatedDate: "June 15, 2025",
  modelVersion: "v2.1-alpha",
};

const SDKShowroomPage = () => {
  return (
    <div className="space-y-16">
      <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-gray-900 sm:text-5xl">SDK Component Showroom</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">A showcase of the available UI components from the @epai/insight-sdk library.</p>
      </div>
      
      <div className="space-y-20">
          {/* Standard Card Section */}
          <section>
              <h2 className="text-3xl font-bold tracking-tight text-gray-800 mb-8 border-b pb-4">Standard Card</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-start justify-items-center">
                  <div className="w-full max-w-md">
                      <h3 className="text-xl font-semibold mb-5 text-center text-gray-700">Light Theme (Default)</h3>
                      <InsightCard data={sampleInsightData} />
                  </div>
                  <div className="w-full max-w-md">
                      <h3 className="text-xl font-semibold mb-5 text-center text-gray-700">Dark Theme</h3>
                      <InsightCard data={sampleInsightData} theme="dark" />
                  </div>
              </div>
          </section>

          {/* Configuration Options Section */}
          <section>
              <h2 className="text-3xl font-bold tracking-tight text-gray-800 mb-8 border-b pb-4">Configuration Options</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 xl:gap-16 items-start justify-items-center">
                  <div className="w-full max-w-md">
                      <h3 className="text-xl font-semibold mb-5 text-center text-gray-700">Confidence Hidden</h3>
                      <InsightCard data={sampleInsightData} showConfidence={false} />
                  </div>
                   <div className="w-full max-w-md">
                      <h3 className="text-xl font-semibold mb-5 text-center text-gray-700">Title Hidden</h3>
                      <InsightCard data={sampleInsightData} showTitle={false} />
                  </div>
                   <div className="w-full max-w-md">
                      <h3 className="text-xl font-semibold mb-5 text-center text-gray-700">Confidence Hidden (Dark)</h3>
                      <InsightCard data={sampleInsightData} showConfidence={false} theme="dark" />
                  </div>
                  <div className="w-full max-w-md">
                      <h3 className="text-xl font-semibold mb-5 text-center text-gray-700">Title Hidden (Dark)</h3>
                      <InsightCard data={sampleInsightData} showTitle={false} theme="dark" />
                  </div>
              </div>
          </section>

          {/* Compact Version Section */}
          <section>
              <h2 className="text-3xl font-bold tracking-tight text-gray-800 mb-8 border-b pb-4">Compact Version</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-12 gap-y-8 items-center justify-items-center">
                  <div className="text-center">
                      <h3 className="text-xl font-semibold mb-5">Light Theme</h3>
                      <InsightCard data={sampleInsightData} compact={true} />
                  </div>
                  <div className="text-center">
                       <h3 className="text-xl font-semibold mb-5">Dark Theme</h3>
                       <InsightCard data={sampleInsightData} compact={true} theme="dark" />
                  </div>
              </div>
          </section>
      </div>
    </div>
  );
};

export default SDKShowroomPage; 