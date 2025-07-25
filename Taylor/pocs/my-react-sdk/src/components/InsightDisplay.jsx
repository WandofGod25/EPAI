import React from 'react';

function InsightDisplay({ insight }) {
  if (!insight) {
    return null; // Or some placeholder if insight is not provided
  }

  const { title, value, confidence, unit } = insight;

  return (
    <div>
      <h3>{title}</h3>
      <p>
        {value} {unit || ''}
      </p>
      <p>
        Confidence: {(confidence * 100).toFixed(0)}%
      </p>
    </div>
  );
}

export default InsightDisplay; 