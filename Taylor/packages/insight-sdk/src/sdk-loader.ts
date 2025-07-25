/**
 * EPAI Insight SDK Loader
 * 
 * This script is responsible for loading the EPAI Insight SDK and rendering
 * insights into containers on the partner's website.
 */

interface EPAIConfig {
  apiKey: string;
  supabaseUrl: string;
  theme?: 'light' | 'dark';
  defaultStyles?: boolean;
}

interface InsightOptions {
  insightId: string;
  containerId: string;
  showConfidence?: boolean;
  showTitle?: boolean;
  compact?: boolean;
  theme?: 'light' | 'dark';
}

class EPAIInsightSDK {
  private apiKey: string;
  private supabaseUrl: string;
  private theme: 'light' | 'dark';
  private defaultStyles: boolean;
  private loadedInsights: Map<string, unknown> = new Map();

  constructor(config: EPAIConfig) {
    this.apiKey = config.apiKey;
    this.supabaseUrl = config.supabaseUrl;
    this.theme = config.theme || 'light';
    this.defaultStyles = config.defaultStyles !== false;
    
    if (this.defaultStyles) {
      this.injectStyles();
    }
  }

  /**
   * Injects the default styles for the SDK into the document head
   */
  private injectStyles(): void {
    const styleEl = document.createElement('style');
    styleEl.id = 'epai-insight-sdk-styles';
    styleEl.textContent = `
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
    `;
    document.head.appendChild(styleEl);
  }

  /**
   * Fetches an insight from the API
   */
  private async fetchInsight(insightId: string): Promise<unknown> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/get-public-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.apiKey
        },
        body: JSON.stringify({ insight_id: insightId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch insight');
      }

      const data = await response.json();
      return data.insight;
    } catch (error) {
      console.error('EPAI SDK Error:', error);
      throw error;
    }
  }

  /**
   * Renders an insight into a container
   */
  public async renderInsight(options: InsightOptions): Promise<void> {
    try {
      const { insightId, containerId, showConfidence = true, showTitle = true, compact = false, theme = this.theme } = options;
      
      // Find the container
      const container = document.getElementById(containerId);
      if (!container) {
        throw new Error(`Container with ID "${containerId}" not found`);
      }
      
      // Add the container class
      container.classList.add('epai-insight-container');
      
      // Show loading state
      container.innerHTML = `<div class="epai-insight-loading">Loading insight...</div>`;
      
      // Check if we already have this insight cached
      if (this.loadedInsights.has(insightId)) {
        const cachedData = this.loadedInsights.get(insightId);
        this.renderInsightContent(container, cachedData, { showConfidence, showTitle, compact, theme });
        return;
      }
      
      // Fetch the insight data
      const data = await this.fetchInsight(insightId);
      
      // Cache the data
      this.loadedInsights.set(insightId, data);
      
      // Render the insight
      this.renderInsightContent(container, data, { showConfidence, showTitle, compact, theme });
    } catch (error) {
      console.error('EPAI SDK Error:', error);
      const container = document.getElementById(options.containerId);
      if (container) {
        container.innerHTML = `<div class="epai-insight-error">Error loading insight: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
      }
    }
  }

  /**
   * Renders the insight content into a container
   */
  private renderInsightContent(container: HTMLElement, data: unknown, options: { showConfidence: boolean, showTitle: boolean, compact: boolean, theme: 'light' | 'dark' }): void {
    const { showConfidence, showTitle, compact, theme } = options;
    
    if (compact) {
      container.innerHTML = this.renderCompactInsight(data, { showConfidence, showTitle, theme });
    } else {
      container.innerHTML = this.renderFullInsight(data, { showConfidence, showTitle, theme });
    }
  }

  /**
   * Extracts the main value from prediction output
   */
  private extractMainValue(predictionOutput: unknown): string {
    if (typeof predictionOutput === 'string') {
      return predictionOutput;
    }
    
    if (typeof predictionOutput === 'object' && predictionOutput !== null) {
      const obj = predictionOutput as Record<string, unknown>;
      
      // Try common keys
      if (typeof obj.value === 'string') return obj.value;
      if (typeof obj.prediction === 'string') return obj.prediction;
      if (typeof obj.result === 'string') return obj.result;
      if (typeof obj.score === 'string') return obj.score;
      
      // If it's an object with numeric values, find the highest one
      const numericValues = Object.entries(obj)
        .filter(([, value]) => typeof value === 'number')
        .sort(([, a], [, b]) => (b as number) - (a as number));
      
      if (numericValues.length > 0) {
        return `${numericValues[0][0]}: ${numericValues[0][1]}`;
      }
      
      // Fallback to string representation
      return JSON.stringify(obj);
    }
    
    return String(predictionOutput);
  }

  /**
   * Extracts description from prediction output
   */
  private extractDescription(predictionOutput: unknown): string {
    if (typeof predictionOutput === 'object' && predictionOutput !== null) {
      const obj = predictionOutput as Record<string, unknown>;
      
      if (typeof obj.description === 'string') return obj.description;
      if (typeof obj.explanation === 'string') return obj.explanation;
      if (typeof obj.details === 'string') return obj.details;
    }
    
    return '';
  }

  /**
   * Renders a compact version of the insight
   */
  private renderCompactInsight(data: unknown, options: { showConfidence: boolean, showTitle: boolean, theme: 'light' | 'dark' }): string {
    const { showConfidence, showTitle, theme } = options;
    const insight = data as Record<string, unknown>;
    
    const title = showTitle && insight.title ? `<div class="epai-insight-title">${insight.title}</div>` : '';
    const confidence = showConfidence && insight.confidence ? `<div class="epai-insight-confidence">${Math.round((insight.confidence as number) * 100)}%</div>` : '';
    const value = this.extractMainValue(insight.prediction_value);
    
    return `
      <div class="epai-insight-card ${theme} compact">
        ${title}
        <div class="epai-insight-value">${value}</div>
        ${confidence}
      </div>
    `;
  }

  /**
   * Renders a full version of the insight
   */
  private renderFullInsight(data: unknown, options: { showConfidence: boolean, showTitle: boolean, theme: 'light' | 'dark' }): string {
    const { showConfidence, showTitle, theme } = options;
    const insight = data as Record<string, unknown>;
    
    const title = showTitle && insight.title ? `<div class="epai-insight-title">${insight.title}</div>` : '';
    const confidence = showConfidence && insight.confidence ? `<div class="epai-insight-confidence">Confidence: ${Math.round((insight.confidence as number) * 100)}%</div>` : '';
    const value = this.extractMainValue(insight.prediction_value);
    const description = this.extractDescription(insight.prediction_value);
    const descriptionHtml = description ? `<div class="epai-insight-description">${description}</div>` : '';
    
    return `
      <div class="epai-insight-card ${theme}">
        ${title}
        <div class="epai-insight-value">${value}</div>
        ${descriptionHtml}
        ${confidence}
      </div>
    `;
  }
}

// Expose the SDK to the global scope
(window as unknown as Record<string, unknown>).EPAIInsightSDK = EPAIInsightSDK;

// Auto-initialize if the script has data attributes
document.addEventListener('DOMContentLoaded', () => {
  const script = document.querySelector('script[data-epai-api-key][data-epai-url]');
  if (script) {
    const apiKey = script.getAttribute('data-epai-api-key');
    const supabaseUrl = script.getAttribute('data-epai-url');
    const theme = script.getAttribute('data-epai-theme') as 'light' | 'dark' || 'light';
    const defaultStyles = script.getAttribute('data-epai-default-styles') !== 'false';
    
    if (apiKey && supabaseUrl) {
      const sdk = new EPAIInsightSDK({ apiKey, supabaseUrl, theme, defaultStyles });
      (window as unknown as Record<string, unknown>).epaiInsightSDK = sdk;
      
      // Auto-render insights if containers with data attributes exist
      document.querySelectorAll('[data-epai-insight-id][data-epai-container-id]').forEach((el) => {
        const insightId = el.getAttribute('data-epai-insight-id');
        const containerId = el.getAttribute('data-epai-container-id');
        const showConfidence = el.getAttribute('data-epai-show-confidence') !== 'false';
        const showTitle = el.getAttribute('data-epai-show-title') !== 'false';
        const compact = el.getAttribute('data-epai-compact') === 'true';
        const elementTheme = el.getAttribute('data-epai-theme') as 'light' | 'dark' || theme;
        
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

export default EPAIInsightSDK; 