import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from the admin panel .env file
const envPath = path.join(__dirname, 'packages/admin-panel/.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

console.log('🔧 Creating Insights Table');
console.log('==========================');

// Use service role key for admin operations
const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function createInsightsTable() {
    try {
        // Create insights table
        console.log('\n1. Creating insights table...');
        const { error: createError } = await supabase.rpc('exec_sql', {
            sql_string: `
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
            `
        });
        
        if (createError) {
            console.error('❌ Failed to create insights table:', createError);
            return;
        }
        
        console.log('✅ Insights table created');
        
        // Enable RLS
        console.log('\n2. Enabling RLS...');
        const { error: rlsError } = await supabase.rpc('exec_sql', {
            sql_string: 'ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;'
        });
        
        if (rlsError) {
            console.error('❌ Failed to enable RLS:', rlsError);
        } else {
            console.log('✅ RLS enabled');
        }
        
        // Create RLS policies
        console.log('\n3. Creating RLS policies...');
        const policies = [
            `CREATE POLICY "Partners can view their own insights" ON public.insights
                FOR SELECT USING (
                    partner_id IN (
                        SELECT id FROM public.partners 
                        WHERE user_id = auth.uid()
                    )
                );`,
            `CREATE POLICY "Partners can insert their own insights" ON public.insights
                FOR INSERT WITH CHECK (
                    partner_id IN (
                        SELECT id FROM public.partners 
                        WHERE user_id = auth.uid()
                    )
                );`,
            `CREATE POLICY "Partners can update their own insights" ON public.insights
                FOR UPDATE USING (
                    partner_id IN (
                        SELECT id FROM public.partners 
                        WHERE user_id = auth.uid()
                    )
                );`
        ];
        
        for (const policy of policies) {
            const { error: policyError } = await supabase.rpc('exec_sql', {
                sql_string: policy
            });
            
            if (policyError) {
                console.error('❌ Failed to create policy:', policyError);
            }
        }
        
        console.log('✅ RLS policies created');
        
        // Add sample data
        console.log('\n4. Adding sample insights data...');
        const { data: partnerData, error: partnerError } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', '799daeee-1410-4981-8274-38a221279b2d')
            .single();
        
        if (partnerError) {
            console.error('❌ Failed to get partner:', partnerError);
            return;
        }
        
        const { data: modelData, error: modelError } = await supabase
            .from('model_configs')
            .select('model_id')
            .limit(1)
            .single();
        
        if (modelError) {
            console.error('❌ Failed to get model:', modelError);
            return;
        }
        
        const sampleInsights = [
            {
                partner_id: partnerData.id,
                model_id: modelData.model_id,
                insight_type: 'attendance_prediction',
                title: 'High Attendance Expected',
                description: 'Based on current engagement patterns, we predict 85% attendance for your next event.',
                confidence_score: 0.87,
                prediction_value: { predicted_attendance: 85, confidence_interval: [80, 90] },
                metadata: { event_type: 'conference', prediction_horizon: '7_days' }
            },
            {
                partner_id: partnerData.id,
                model_id: modelData.model_id,
                insight_type: 'engagement_trend',
                title: 'Increasing User Engagement',
                description: 'User engagement has increased by 23% over the last 30 days.',
                confidence_score: 0.92,
                prediction_value: { engagement_increase: 23, trend_direction: 'upward' },
                metadata: { time_period: '30_days', metric: 'engagement_rate' }
            }
        ];
        
        const { error: insertError } = await supabase
            .from('insights')
            .insert(sampleInsights);
        
        if (insertError) {
            console.error('❌ Failed to insert sample data:', insertError);
        } else {
            console.log('✅ Sample insights data added');
        }
        
        console.log('\n🎉 Insights table setup completed!');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

createInsightsTable(); 