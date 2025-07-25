import React, { useState, useEffect } from 'react';
import { PredictionForm, PredictionFormData } from '@/components/prediction/PredictionForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface PredictionResult {
  id: string;
  modelType: string;
  prediction: number;
  confidence: number;
  explanation: string;
  timestamp: string;
  inputData: PredictionFormData;
}

export default function PredictionsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { toast } = useToast();

  // Load prediction history on component mount
  useEffect(() => {
    loadPredictionHistory();
  }, []);

  const loadPredictionHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-prediction-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ page: 0, limit: 20 }),
      });

      if (response.ok) {
        const result = await response.json();
        const historicalPredictions = result.data.predictions.map((pred: any) => ({
          id: pred.request_id,
          modelType: pred.model_type,
          prediction: pred.prediction_value,
          confidence: pred.confidence_score,
          explanation: pred.explanation || 'No explanation available',
          timestamp: pred.created_at,
          inputData: {
            modelType: pred.model_type,
            venue: pred.venue || '',
            eventDate: pred.event_date || '',
            genre: pred.genre || '',
            ticketPrice: pred.ticket_price || 0,
            marketingBudget: pred.marketing_budget || 0,
            venueCapacity: pred.venue_capacity || 0,
            customerEmail: pred.customer_email || '',
            customerName: pred.customer_name || '',
            age: pred.age || 0,
            location: pred.location || '',
            engagementScore: pred.engagement_score || 0,
            previousPurchases: pred.previous_purchases || 0,
            websiteVisits: pred.website_visits || 0,
            emailOpens: pred.email_opens || 0,
            socialMediaEngagement: pred.social_media_engagement || 0,
          }
        }));
        
        setPredictionResults(historicalPredictions);
      }
    } catch (error) {
      console.error('Error loading prediction history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handlePredictionSubmit = async (formData: PredictionFormData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate prediction');
      }

      const result = await response.json();
      
      const prediction: PredictionResult = {
        id: result.data.requestId,
        modelType: formData.modelType,
        prediction: result.data.prediction,
        confidence: result.data.confidence,
        explanation: result.data.explanation,
        timestamp: result.data.timestamp,
        inputData: formData
      };

      setPredictionResults(prev => [prediction, ...prev]);
      
      toast({
        title: "Prediction Generated",
        description: `Successfully generated ${formData.modelType === 'attendance_forecast' ? 'attendance forecast' : 'lead score'} prediction.`,
      });
    } catch (error) {
      console.error('Prediction error:', error);
      toast({
        title: "Prediction Failed",
        description: error instanceof Error ? error.message : "Failed to generate prediction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPredictionValue = (result: PredictionResult) => {
    if (result.modelType === 'attendance_forecast') {
      return `${result.prediction.toLocaleString()} attendees`;
    } else {
      return `${result.prediction.toFixed(1)}%`;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-100 text-green-800';
    if (confidence >= 0.8) return 'bg-blue-100 text-blue-800';
    if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Predictions</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Generate real-time predictions using our AI models. Select a model type, provide the required data, 
          and get instant insights to help you make better decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Prediction Form */}
        <div>
          <PredictionForm onSubmit={handlePredictionSubmit} isLoading={isLoading} />
        </div>

        {/* Prediction Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Recent Predictions</h2>
          
          {isLoadingHistory ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Loading prediction history...
                </p>
              </CardContent>
            </Card>
          ) : predictionResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  No predictions yet. Submit a prediction request to see results here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {predictionResults.map((result) => (
                <Card key={result.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {result.modelType === 'attendance_forecast' ? 'Attendance Forecast' : 'Lead Score'}
                      </CardTitle>
                      <Badge variant="outline">
                        {new Date(result.timestamp).toLocaleDateString()}
                      </Badge>
                    </div>
                    <CardDescription>
                      {result.modelType === 'attendance_forecast' 
                        ? `Venue: ${result.inputData.venue}`
                        : `Customer: ${result.inputData.customerName}`
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Prediction:</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatPredictionValue(result)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Confidence:</span>
                      <Badge className={getConfidenceColor(result.confidence)}>
                        {(result.confidence * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        {result.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 