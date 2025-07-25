import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("SDK Loader function started");

// Helper function to minify JavaScript
function minifyJS(code: string): string {
  // Simple minification - remove comments, extra whitespace, and newlines
  return code
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove comments
    .replace(/\s{2,}/g, ' ')                 // Remove extra spaces
    .replace(/\n/g, '')                      // Remove newlines
    .trim();
}

// Set cache headers for better performance
const cacheHeaders = {
  'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
  'Surrogate-Control': 'max-age=86400',    // CDN cache for 24 hours
};

// Serve the SDK loader function
serve((req) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers:", corsHeaders);
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    // Get the URL params
    const url = new URL(req.url);
    const apiKey = url.searchParams.get('apiKey') || '';
    const container = url.searchParams.get('container') || '';
    const _compact = url.searchParams.get('compact') === 'true';
    const _showTitle = url.searchParams.get('showTitle') !== 'false';
    const _showConfidence = url.searchParams.get('showConfidence') !== 'false';
    const _theme = url.searchParams.get('theme') || 'light';
    
    console.log(`SDK Loader called with params: apiKey=${apiKey ? apiKey.substring(0, 5) + '...' : 'missing'}, container=${container}`);

    // Load the SDK code from the insight-sdk package
    const sdkCode = `
/**
 * EPAI Insight SDK Loader
 * 
 * This script is responsible for loading the EPAI Insight SDK and rendering
 * insights into containers on the partner's website.
 */

class EPAIInsightSDK {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.supabaseUrl = config.supabaseUrl;
    this.theme = config.theme || 'light';
    this.defaultStyles = config.defaultStyles !== false;
    this.loadedInsights = new Map();
    this.pendingRequests = new Map();
    
    if (this.defaultStyles) {
      this.injectStyles();
    }
  }

  /**
   * Injects the default styles for the SDK into the document head
   */
  injectStyles() {
    // Check if styles are already injected
    if (document.getElementById('epai-insight-sdk-styles')) {
      return;
    }
    
    const styleEl = document.createElement('style');
    styleEl.id = 'epai-insight-sdk-styles';
    styleEl.textContent = \`
      .epai-insight-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      }
      
      .epai-insight-card {
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      
      .epai-insight-card:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .epai-insight-card.light {
        background-color: white;
        color: #1f2937;
        border: 1px solid rgba(229, 231, 235, 0.8);
      }
      
      .epai-insight-card.dark {
        background-color: #111827;
        color: #e5e7eb;
        border: 1px solid rgba(55, 65, 81, 0.8);
      }
      
      .epai-insight-loading {
        padding: 1rem;
        text-align: center;
        color: #6b7280;
      }
      
      .epai-insight-error {
        padding: 1rem;
        text-align: center;
        color: #ef4444;
        border: 1px solid #ef4444;
        border-radius: 0.375rem;
      }
    \`;
    document.head.appendChild(styleEl);
  }

  /**
   * Fetches an insight from the API with caching and request deduplication
   */
  async fetchInsight(insightId) {
    // Check if we already have this insight cached
    if (this.loadedInsights.has(insightId)) {
      return this.loadedInsights.get(insightId);
    }
    
    // Check if we have a pending request for this insight
    if (this.pendingRequests.has(insightId)) {
      return this.pendingRequests.get(insightId);
    }
    
    // Create a new request promise
    const requestPromise = (async () => {
      try {
        const response = await fetch(\`\${this.supabaseUrl}/functions/v1/get-public-insight\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey
          },
          body: JSON.stringify({ insight_id: insightId })
        });

        if (!response.ok) {
          let errorMessage = 'Failed to fetch insight';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            console.error('Error parsing error response:', e);
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        // Cache the result
        this.loadedInsights.set(insightId, data.insight);
        return data.insight;
      } catch (error) {
        console.error('EPAI SDK Error:', error);
        throw error;
      } finally {
        // Remove from pending requests
        this.pendingRequests.delete(insightId);
      }
    })();
    
    // Store the pending request
    this.pendingRequests.set(insightId, requestPromise);
    
    return requestPromise;
  }

  /**
   * Renders an insight into a container
   */
  async renderInsight(options) {
    try {
      const { insightId, containerId, showConfidence = true, showTitle = true, compact = false, theme = this.theme } = options;
      
      // Find the container
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(\`Container with ID "\${containerId}" not found\`);
      }
      
      // Add the container class
      container.classList.add('epai-insight-container');
      
      // Show loading state
      container.innerHTML = \`<div class="epai-insight-loading">Loading insight...</div>\`;
      
      // Fetch the insight
      const insight = await this.fetchInsight(insightId);
      
      // Format the data for rendering
      const formattedData = {
        title: insight.model_name || 'Insight',
        icon: 'chart', // Placeholder
        confidence: insight.prediction_output.confidence || 0.85,
        value: this.extractMainValue(insight.prediction_output),
        description: this.extractDescription(insight.prediction_output),
        generatedDate: new Date(insight.created_at).toLocaleDateString(),
        modelVersion: insight.model_name
      };
      
      // Render the insight
      if (compact) {
        container.innerHTML = this.renderCompactInsight(formattedData, { showConfidence, showTitle, theme });
      } else {
        container.innerHTML = this.renderFullInsight(formattedData, { showConfidence, showTitle, theme });
      }
      
      return Promise.resolve();
    } catch (error) {
      console.error('EPAI SDK Error:', error);
      const container = document.getElementById(options.containerId);
      if (container) {
        container.innerHTML = \`<div class="epai-insight-error">Failed to load insight: \${error instanceof Error ? error.message : 'Unknown error'}</div>\`;
      }
      return Promise.reject(error);
    }
  }
  
  /**
   * Extracts the main value from the prediction output
   */
  extractMainValue(predictionOutput) {
    // Try to find the most important value in the prediction output
    if (predictionOutput.forecast !== undefined) return predictionOutput.forecast.toString();
    if (predictionOutput.prediction !== undefined) return predictionOutput.prediction;
    if (predictionOutput.score !== undefined) return predictionOutput.score.toString();
    if (predictionOutput.predicted_ltv !== undefined) return \`$\${predictionOutput.predicted_ltv}\`;
    if (predictionOutput.engagement_score !== undefined) return (predictionOutput.engagement_score * 100).toFixed(0) + '%';
    
    // If we can't find a specific value, return the first numeric value
    for (const key in predictionOutput) {
      if (typeof predictionOutput[key] === 'number') {
        return predictionOutput[key].toString();
      }
    }
    
    // If all else fails, return a JSON string
    return JSON.stringify(predictionOutput);
  }
  
  /**
   * Extracts a description from the prediction output
   */
  extractDescription(predictionOutput) {
    if (predictionOutput.next_action) return predictionOutput.next_action;
    if (predictionOutput.recommendations && Array.isArray(predictionOutput.recommendations)) {
      return predictionOutput.recommendations[0];
    }
    return 'Based on your data, this insight was generated to help you make better decisions.';
  }
  
  /**
   * Renders a compact insight
   */
  renderCompactInsight(data, options) {
    const { showConfidence, showTitle, theme } = options;
    
    return \`
      <div class="epai-insight-card \${theme} compact">
        <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 0.5rem; background-color: \${theme === 'dark' ? '#1f2937' : '#f3f4f6'};">
          <div style="display: flex; align-items: center; justify-content: center; width: 1.25rem; height: 1.25rem;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
            </svg>
          </div>
          \${showTitle ? \`<span style="font-weight: 600; white-space: nowrap;">\${data.title}:</span>\` : ''}
          <span style="font-weight: 700; font-size: 1rem; white-space: nowrap;">\${data.value}</span>
          \${showConfidence ? \`<span style="font-size: 0.75rem; font-weight: 400; color: \${theme === 'dark' ? '#9ca3af' : '#6b7280'}; white-space: nowrap;">(\${(data.confidence * 100).toFixed(0)}%)</span>\` : ''}
        </div>
      </div>
    \`;
  }
  
  /**
   * Renders a full insight
   */
  renderFullInsight(data, options) {
    const { showConfidence, showTitle, theme } = options;
    
    return \`
      <div class="epai-insight-card \${theme}">
        \${showTitle ? \`
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid \${theme === 'dark' ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}; padding-bottom: 1rem; margin-bottom: 1rem;">
            <h3 style="font-weight: 600; font-size: 1.125rem; color: \${theme === 'dark' ? '#f3f4f6' : '#111827'};">\${data.title}</h3>
            \${showConfidence ? \`
              <div style="display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 500; border-radius: 9999px; padding: 0.25rem 0.625rem; background-color: \${theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : '#f3f4f6'}; color: \${theme === 'dark' ? '#d1d5db' : '#4b5563'};">
                <span>Confidence: \${(data.confidence * 100).toFixed(0)}%</span>
              </div>
            \` : ''}
          </div>
        \` : ''}

        <div style="text-align: center; padding: 1.25rem 0; display: flex; flex-direction: column; justify-content: center; flex-grow: 1;">
          <div style="font-size: 3rem; font-weight: 700; letter-spacing: -0.025em; \${theme === 'dark' 
            ? 'background: linear-gradient(to right, #ffffff, #9ca3af); -webkit-background-clip: text; -webkit-text-fill-color: transparent;' 
            : 'background: linear-gradient(to right, #1f2937, #2563eb); -webkit-background-clip: text; -webkit-text-fill-color: transparent;'
          }">
            \${data.value}
          </div>
          <p style="font-size: 1rem; margin-top: 0.625rem; color: \${theme === 'dark' ? '#9ca3af' : '#4b5563'};">
            \${data.description}
          </p>
        </div>

        <div style="font-size: 0.75rem; text-align: center; color: \${theme === 'dark' ? 'rgba(156, 163, 175, 0.8)' : '#6b7280'}; border-top: 1px solid \${theme === 'dark' ? 'rgba(55, 65, 81, 0.6)' : 'rgba(229, 231, 235, 0.6)'}; padding-top: 1rem; margin-top: 1rem; opacity: 0.9;">
          <span>Generated: \${data.generatedDate}</span> &bull; <span>Model: \${data.modelVersion}</span>
        </div>
      </div>
    \`;
  }
}

// Expose the SDK to the global scope
window.EPAIInsightSDK = EPAIInsightSDK;

// Auto-initialize if the script has data attributes
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-epai-api-key][data-epai-url]');
  if (script) {
    const apiKey = script.getAttribute('data-epai-api-key');
    const supabaseUrl = script.getAttribute('data-epai-url');
    const theme = script.getAttribute('data-epai-theme') || 'light';
    const defaultStyles = script.getAttribute('data-epai-default-styles') !== 'false';
    
    if (apiKey && supabaseUrl) {
      const sdk = new EPAIInsightSDK({ apiKey, supabaseUrl, theme, defaultStyles });
      window.epaiInsightSDK = sdk;
      
      // Auto-render insights if containers with data attributes exist
      document.querySelectorAll('[data-epai-insight-id][data-epai-container-id]').forEach((el) => {
        const insightId = el.getAttribute('data-epai-insight-id');
        const containerId = el.getAttribute('data-epai-container-id');
        const showConfidence = el.getAttribute('data-epai-show-confidence') !== 'false';
        const showTitle = el.getAttribute('data-epai-show-title') !== 'false';
        const compact = el.getAttribute('data-epai-compact') === 'true';
        const elementTheme = el.getAttribute('data-epai-theme') || theme;
        
        if (insightId && containerId) {
          sdk.renderInsight({
            insightId,
            containerId,
            showConfidence,
            showTitle,
            compact,
            theme: elementTheme
          });
        }
      });
    }
  }
});
`;

    // Minify the SDK code for production
    const minifiedCode = minifyJS(sdkCode);

    // Return the SDK code as JavaScript with caching headers
    return new Response(minifiedCode, {
      headers: {
        ...corsHeaders,
        ...cacheHeaders,
        'Content-Type': 'application/javascript',
        'Content-Length': minifiedCode.length.toString(),
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error in SDK loader: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 