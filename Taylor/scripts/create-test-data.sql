-- Create test data for security testing

-- Create test partner
INSERT INTO partners (id, name, status)
VALUES 
  ('test-partner-id', 'Security Test Partner', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create test API key
INSERT INTO api_keys (id, partner_id, api_key_hash, name, expires_at, is_active)
VALUES 
  ('test-key-id', 'test-partner-id', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789', 'Test API Key', NOW() + INTERVAL '30 days', true)
ON CONFLICT (id) DO NOTHING;

-- Create test models
INSERT INTO models (id, partner_id, name, description, type, status)
VALUES 
  ('test-model-1', 'test-partner-id', 'Attendance Prediction Model', 'Predicts event attendance', 'regression', 'active'),
  ('test-model-2', 'test-partner-id', 'Lead Scoring Model', 'Scores leads based on engagement', 'classification', 'active')
ON CONFLICT (id) DO NOTHING;

-- Create test ingestion events
INSERT INTO ingestion_events (id, partner_id, event_type, data)
VALUES 
  ('test-event-1', 'test-partner-id', 'event_registration', '{"event_id": "evt-001", "user_id": "usr-001", "event_name": "Annual Conference", "ticket_type": "VIP"}'),
  ('test-event-2', 'test-partner-id', 'user_engagement', '{"user_id": "usr-002", "action": "page_view", "content_id": "page-001", "duration": 120}'),
  ('test-event-3', 'test-partner-id', 'lead_capture', '{"lead_id": "lead-001", "source": "website_form", "campaign": "summer_promo", "fields_completed": ["name", "email", "company"]}')
ON CONFLICT (id) DO NOTHING;

-- Create test insights
INSERT INTO insights (id, partner_id, ingestion_event_id, insight_type, title, content, confidence)
VALUES 
  ('test-insight-1', 'test-partner-id', 'test-event-1', 'attendance_prediction', 'Attendance Prediction', 'Based on historical data, we predict 85% attendance for this event.', 0.92),
  ('test-insight-2', 'test-partner-id', 'test-event-3', 'lead_scoring', 'Lead Score', 'This lead has a 78% likelihood of conversion.', 0.87)
ON CONFLICT (id) DO NOTHING;

-- Create test security events
INSERT INTO security_events (id, partner_id, event_type, details, severity, source)
VALUES 
  ('test-sec-event-1', 'test-partner-id', 'authentication_success', '{"user_email": "security-test@example.com", "ip_address": "192.168.1.1"}', 'info', 'auth_system'),
  ('test-sec-event-2', 'test-partner-id', 'api_key_validation', '{"key_id": "test-key-id", "ip_address": "192.168.1.2", "endpoint": "/api/data"}', 'info', 'api_gateway'),
  ('test-sec-event-3', 'test-partner-id', 'rate_limit_warning', '{"key_id": "test-key-id", "ip_address": "192.168.1.3", "endpoint": "/api/ingest", "request_count": 95, "limit": 100}', 'warning', 'rate_limiter')
ON CONFLICT (id) DO NOTHING; 