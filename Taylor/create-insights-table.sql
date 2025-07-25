-- Create insights table
CREATE TABLE IF NOT EXISTS public.insights (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    model_id UUID REFERENCES public.model_configs(model_id),
    insight_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    prediction_value JSONB,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- Add RLS policies
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Policy to allow partners to view only their own insights
CREATE POLICY "Partners can view their own insights" ON public.insights
    FOR SELECT USING (
        partner_id IN (
            SELECT id FROM public.partners 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow partners to insert their own insights
CREATE POLICY "Partners can insert their own insights" ON public.insights
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT id FROM public.partners 
            WHERE user_id = auth.uid()
        )
    );

-- Policy to allow partners to update their own insights
CREATE POLICY "Partners can update their own insights" ON public.insights
    FOR UPDATE USING (
        partner_id IN (
            SELECT id FROM public.partners 
            WHERE user_id = auth.uid()
        )
    );

-- Add some sample insights data
INSERT INTO public.insights (partner_id, model_id, insight_type, title, description, confidence_score, prediction_value, metadata) VALUES
(
    (SELECT id FROM public.partners WHERE user_id = '799daeee-1410-4981-8274-38a221279b2d' LIMIT 1),
    (SELECT model_id FROM public.model_configs LIMIT 1),
    'attendance_prediction',
    'High Attendance Expected',
    'Based on current engagement patterns, we predict 85% attendance for your next event.',
    0.87,
    '{"predicted_attendance": 85, "confidence_interval": [80, 90]}',
    '{"event_type": "conference", "prediction_horizon": "7_days"}'
),
(
    (SELECT id FROM public.partners WHERE user_id = '799daeee-1410-4981-8274-38a221279b2d' LIMIT 1),
    (SELECT model_id FROM public.model_configs LIMIT 1),
    'engagement_trend',
    'Increasing User Engagement',
    'User engagement has increased by 23% over the last 30 days.',
    0.92,
    '{"engagement_increase": 23, "trend_direction": "upward"}',
    '{"time_period": "30_days", "metric": "engagement_rate"}'
); 