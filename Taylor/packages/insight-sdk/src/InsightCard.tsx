import React from 'react';

// Define the props based on our design document
interface InsightCardProps {
  theme?: 'light' | 'dark';
  showConfidence?: boolean;
  showTitle?: boolean;
  compact?: boolean;
  // This will be dynamic later, but hardcoded for now
  data: {
    title: string;
    icon: string; // For now, a placeholder for an icon component
    confidence: number;
    value: string;
    description: string;
    generatedDate: string;
    modelVersion: string;
  }
}

// A placeholder for an icon component
const IconPlaceholder = () => <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

export const InsightCard: React.FC<InsightCardProps> = ({
  theme = 'light',
  showConfidence = true,
  showTitle = true,
  compact = false,
  data,
}) => {

  const cardClasses = `
    border rounded-2xl p-6 shadow-sm transition-all duration-300 ease-in-out hover:shadow-md font-sans w-full flex flex-col h-full min-w-0
    ${theme === 'dark' 
      ? 'bg-gray-900 text-gray-300 border-gray-700/80' 
      : 'bg-white text-gray-800 border-gray-200/80'
    }
  `;

  const compactClasses = `
    flex items-center gap-3 text-sm font-medium
    ${theme === 'dark' 
      ? 'bg-gray-800 text-white' 
      : 'bg-gray-100/80 text-gray-700'
    }
    p-3 rounded-lg shadow-sm
  `;

  if (compact) {
    return (
      <div className={compactClasses}>
        <IconPlaceholder />
        {showTitle && <span className="whitespace-nowrap font-semibold">{data.title}:</span>}
        <span className="font-bold text-base whitespace-nowrap">{data.value}</span>
        {showConfidence && <span className="text-xs font-normal text-gray-500 dark:text-gray-400 whitespace-nowrap">({(data.confidence * 100).toFixed(0)}%)</span>}
      </div>
    );
  }

  return (
    <div className={cardClasses} style={{ fontFamily: "'Inter', sans-serif" }}>
      {showTitle && (
        <div className="flex justify-between items-center border-b pb-4 mb-4 border-gray-200/60 dark:border-gray-700/60">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{data.title}</h3>
          {showConfidence && (
            <div className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-1 ${theme === 'dark' ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
            </div>
          )}
        </div>
      )}

      <div className="text-center py-5 flex-grow flex flex-col justify-center">
        <div className={`text-7xl font-bold tracking-tight bg-clip-text text-transparent ${theme === 'dark' ? 'bg-gradient-to-r from-white to-gray-400' : 'bg-gradient-to-r from-gray-800 to-blue-600'}`}>
          {data.value}
        </div>
        <p className={`text-base mt-2.5 text-gray-600 dark:text-gray-400`}>
          {data.description}
        </p>
      </div>

      <div className="text-xs text-center text-gray-500 dark:text-gray-400/80 border-t pt-4 mt-4 opacity-90 border-gray-200/60 dark:border-gray-700/60">
        <span>Generated: {data.generatedDate}</span> &bull; <span>Model: {data.modelVersion}</span>
      </div>
    </div>
  );
}; 