import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export interface PredictionFormData {
  modelType: 'attendance_forecast' | 'lead_scoring';
  // Attendance Forecast fields
  venue?: string;
  eventDate?: string;
  genre?: string;
  ticketPrice?: number;
  marketingBudget?: number;
  venueCapacity?: number;
  // Lead Scoring fields
  customerEmail?: string;
  customerName?: string;
  age?: number;
  location?: string;
  engagementScore?: number;
  previousPurchases?: number;
  websiteVisits?: number;
  emailOpens?: number;
  socialMediaEngagement?: number;
}

interface PredictionFormProps {
  onSubmit: (data: PredictionFormData) => Promise<void>;
  isLoading?: boolean;
}

export function PredictionForm({ onSubmit, isLoading = false }: PredictionFormProps) {
  const [formData, setFormData] = useState<PredictionFormData>({
    modelType: 'attendance_forecast'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.modelType === 'attendance_forecast') {
      if (!formData.venue) newErrors.venue = 'Venue is required';
      if (!formData.eventDate) newErrors.eventDate = 'Event date is required';
      if (!formData.genre) newErrors.genre = 'Genre is required';
      if (!formData.ticketPrice || formData.ticketPrice <= 0) newErrors.ticketPrice = 'Valid ticket price is required';
      if (!formData.marketingBudget || formData.marketingBudget < 0) newErrors.marketingBudget = 'Valid marketing budget is required';
      if (!formData.venueCapacity || formData.venueCapacity <= 0) newErrors.venueCapacity = 'Valid venue capacity is required';
    } else if (formData.modelType === 'lead_scoring') {
      if (!formData.customerEmail) newErrors.customerEmail = 'Customer email is required';
      if (!formData.customerName) newErrors.customerName = 'Customer name is required';
      if (!formData.age || formData.age < 0 || formData.age > 120) newErrors.age = 'Valid age is required';
      if (!formData.location) newErrors.location = 'Location is required';
      if (formData.engagementScore === undefined || formData.engagementScore < 0 || formData.engagementScore > 100) {
        newErrors.engagementScore = 'Valid engagement score (0-100) is required';
      }
      if (formData.previousPurchases === undefined || formData.previousPurchases < 0) {
        newErrors.previousPurchases = 'Valid previous purchases count is required';
      }
      if (formData.websiteVisits === undefined || formData.websiteVisits < 0) {
        newErrors.websiteVisits = 'Valid website visits count is required';
      }
      if (formData.emailOpens === undefined || formData.emailOpens < 0) {
        newErrors.emailOpens = 'Valid email opens count is required';
      }
      if (formData.socialMediaEngagement === undefined || formData.socialMediaEngagement < 0) {
        newErrors.socialMediaEngagement = 'Valid social media engagement count is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmit(formData);
      toast({
        title: "Success",
        description: "Prediction request submitted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit prediction request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: keyof PredictionFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const renderAttendanceForecastForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="venue">Venue Name *</Label>
          <Input
            id="venue"
            placeholder="e.g., Madison Square Garden"
            value={formData.venue || ''}
            onChange={(e) => handleInputChange('venue', e.target.value)}
            className={errors.venue ? 'border-red-500' : ''}
          />
          {errors.venue && <p className="text-sm text-red-500">{errors.venue}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="eventDate">Event Date *</Label>
          <Input
            id="eventDate"
            type="date"
            value={formData.eventDate || ''}
            onChange={(e) => handleInputChange('eventDate', e.target.value)}
            className={errors.eventDate ? 'border-red-500' : ''}
          />
          {errors.eventDate && <p className="text-sm text-red-500">{errors.eventDate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="genre">Music Genre *</Label>
          <Select value={formData.genre || ''} onValueChange={(value) => handleInputChange('genre', value)}>
            <SelectTrigger className={errors.genre ? 'border-red-500' : ''}>
              <SelectValue placeholder="Select genre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rock">Rock</SelectItem>
              <SelectItem value="pop">Pop</SelectItem>
              <SelectItem value="hip-hop">Hip-Hop</SelectItem>
              <SelectItem value="country">Country</SelectItem>
              <SelectItem value="electronic">Electronic</SelectItem>
              <SelectItem value="jazz">Jazz</SelectItem>
              <SelectItem value="classical">Classical</SelectItem>
              <SelectItem value="r&b">R&B</SelectItem>
            </SelectContent>
          </Select>
          {errors.genre && <p className="text-sm text-red-500">{errors.genre}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="venueCapacity">Venue Capacity *</Label>
          <Input
            id="venueCapacity"
            type="number"
            placeholder="e.g., 20000"
            value={formData.venueCapacity || ''}
            onChange={(e) => handleInputChange('venueCapacity', parseInt(e.target.value) || 0)}
            className={errors.venueCapacity ? 'border-red-500' : ''}
          />
          {errors.venueCapacity && <p className="text-sm text-red-500">{errors.venueCapacity}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ticketPrice">Ticket Price ($) *</Label>
          <Input
            id="ticketPrice"
            type="number"
            placeholder="e.g., 75"
            value={formData.ticketPrice || ''}
            onChange={(e) => handleInputChange('ticketPrice', parseFloat(e.target.value) || 0)}
            className={errors.ticketPrice ? 'border-red-500' : ''}
          />
          {errors.ticketPrice && <p className="text-sm text-red-500">{errors.ticketPrice}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="marketingBudget">Marketing Budget ($) *</Label>
          <Input
            id="marketingBudget"
            type="number"
            placeholder="e.g., 50000"
            value={formData.marketingBudget || ''}
            onChange={(e) => handleInputChange('marketingBudget', parseFloat(e.target.value) || 0)}
            className={errors.marketingBudget ? 'border-red-500' : ''}
          />
          {errors.marketingBudget && <p className="text-sm text-red-500">{errors.marketingBudget}</p>}
        </div>
      </div>
    </div>
  );

  const renderLeadScoringForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer Name *</Label>
          <Input
            id="customerName"
            placeholder="e.g., John Doe"
            value={formData.customerName || ''}
            onChange={(e) => handleInputChange('customerName', e.target.value)}
            className={errors.customerName ? 'border-red-500' : ''}
          />
          {errors.customerName && <p className="text-sm text-red-500">{errors.customerName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerEmail">Customer Email *</Label>
          <Input
            id="customerEmail"
            type="email"
            placeholder="e.g., john.doe@example.com"
            value={formData.customerEmail || ''}
            onChange={(e) => handleInputChange('customerEmail', e.target.value)}
            className={errors.customerEmail ? 'border-red-500' : ''}
          />
          {errors.customerEmail && <p className="text-sm text-red-500">{errors.customerEmail}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age *</Label>
          <Input
            id="age"
            type="number"
            placeholder="e.g., 35"
            value={formData.age || ''}
            onChange={(e) => handleInputChange('age', parseInt(e.target.value) || 0)}
            className={errors.age ? 'border-red-500' : ''}
          />
          {errors.age && <p className="text-sm text-red-500">{errors.age}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            placeholder="e.g., New York, NY"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={errors.location ? 'border-red-500' : ''}
          />
          {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="engagementScore">Engagement Score (0-100) *</Label>
          <Input
            id="engagementScore"
            type="number"
            min="0"
            max="100"
            placeholder="e.g., 75"
            value={formData.engagementScore || ''}
            onChange={(e) => handleInputChange('engagementScore', parseInt(e.target.value) || 0)}
            className={errors.engagementScore ? 'border-red-500' : ''}
          />
          {errors.engagementScore && <p className="text-sm text-red-500">{errors.engagementScore}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousPurchases">Previous Purchases *</Label>
          <Input
            id="previousPurchases"
            type="number"
            min="0"
            placeholder="e.g., 3"
            value={formData.previousPurchases || ''}
            onChange={(e) => handleInputChange('previousPurchases', parseInt(e.target.value) || 0)}
            className={errors.previousPurchases ? 'border-red-500' : ''}
          />
          {errors.previousPurchases && <p className="text-sm text-red-500">{errors.previousPurchases}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="websiteVisits">Website Visits (Last 30 days) *</Label>
          <Input
            id="websiteVisits"
            type="number"
            min="0"
            placeholder="e.g., 12"
            value={formData.websiteVisits || ''}
            onChange={(e) => handleInputChange('websiteVisits', parseInt(e.target.value) || 0)}
            className={errors.websiteVisits ? 'border-red-500' : ''}
          />
          {errors.websiteVisits && <p className="text-sm text-red-500">{errors.websiteVisits}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailOpens">Email Opens (Last 30 days) *</Label>
          <Input
            id="emailOpens"
            type="number"
            min="0"
            placeholder="e.g., 8"
            value={formData.emailOpens || ''}
            onChange={(e) => handleInputChange('emailOpens', parseInt(e.target.value) || 0)}
            className={errors.emailOpens ? 'border-red-500' : ''}
          />
          {errors.emailOpens && <p className="text-sm text-red-500">{errors.emailOpens}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="socialMediaEngagement">Social Media Engagement (Last 30 days) *</Label>
          <Input
            id="socialMediaEngagement"
            type="number"
            min="0"
            placeholder="e.g., 15"
            value={formData.socialMediaEngagement || ''}
            onChange={(e) => handleInputChange('socialMediaEngagement', parseInt(e.target.value) || 0)}
            className={errors.socialMediaEngagement ? 'border-red-500' : ''}
          />
          {errors.socialMediaEngagement && <p className="text-sm text-red-500">{errors.socialMediaEngagement}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Make a Prediction</CardTitle>
        <CardDescription>
          Select a model type and provide the required information to generate predictions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="modelType">Model Type *</Label>
            <Select 
              value={formData.modelType} 
              onValueChange={(value) => handleInputChange('modelType', value as 'attendance_forecast' | 'lead_scoring')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="attendance_forecast">Attendance Forecast</SelectItem>
                <SelectItem value="lead_scoring">Lead Scoring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.modelType === 'attendance_forecast' && renderAttendanceForecastForm()}
          {formData.modelType === 'lead_scoring' && renderLeadScoringForm()}

          <div className="flex justify-end space-x-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Generate Prediction'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 