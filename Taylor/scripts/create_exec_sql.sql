-- Create the exec_sql function (callable by Edge Function)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  result := json_build_object('success', true);
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission only to service_role
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION exec_sql(text) TO service_role;

-- Create alert_definitions table
CREATE TABLE IF NOT EXISTS alert_definitions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  query TEXT NOT NULL,
  threshold NUMERIC NOT NULL,
  frequency TEXT NOT NULL,
  severity TEXT NOT NULL,
  notification_channels TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Create notification_channels table
CREATE TABLE IF NOT EXISTS notification_channels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Create alert_history table
CREATE TABLE IF NOT EXISTS alert_history (
  id SERIAL PRIMARY KEY,
  alert_definition_id INTEGER NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  notification_sent BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_alert_definition FOREIGN KEY (alert_definition_id) REFERENCES alert_definitions(id) ON DELETE CASCADE
);

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  alert_history_id INTEGER NOT NULL,
  notification_channel_id INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL,
  error_message TEXT,
  CONSTRAINT fk_alert_history FOREIGN KEY (alert_history_id) REFERENCES alert_history(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_channel FOREIGN KEY (notification_channel_id) REFERENCES notification_channels(id) ON DELETE CASCADE
);

-- Create alert checking function
CREATE OR REPLACE FUNCTION check_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  alert_rec RECORD;
  result_rec RECORD;
  query_text TEXT;
BEGIN
  FOR alert_rec IN SELECT * FROM alert_definitions
  LOOP
    -- Execute the alert query
    BEGIN
      EXECUTE alert_rec.query INTO result_rec;
      
      -- Check if the alert threshold is exceeded
      IF result_rec.value > alert_rec.threshold THEN
        -- Insert into alert_history
        INSERT INTO alert_history (alert_definition_id, value, threshold)
        VALUES (alert_rec.id, result_rec.value, alert_rec.threshold);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log the error
      RAISE NOTICE 'Error executing alert query %: %', alert_rec.name, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Create alert notification function
CREATE OR REPLACE FUNCTION send_alert_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  alert_rec RECORD;
  channel_rec RECORD;
BEGIN
  -- Get all unnotified alerts
  FOR alert_rec IN 
    SELECT 
      ah.id as history_id,
      ah.value,
      ah.threshold,
      ad.name,
      ad.description,
      ad.severity,
      ad.notification_channels
    FROM alert_history ah
    JOIN alert_definitions ad ON ah.alert_definition_id = ad.id
    WHERE ah.notification_sent = FALSE
  LOOP
    -- For each notification channel
    FOR channel_name IN SELECT unnest(alert_rec.notification_channels)
    LOOP
      -- Get the channel details
      SELECT * INTO channel_rec 
      FROM notification_channels 
      WHERE name = channel_name AND enabled = TRUE;
      
      IF FOUND THEN
        -- Insert into notification_logs
        INSERT INTO notification_logs (alert_history_id, notification_channel_id, status)
        VALUES (alert_rec.history_id, channel_rec.id, 'SENT');
        
        -- In a real implementation, this would send the actual notification
        -- For now, we just log it
        RAISE NOTICE 'Sending % alert to %: % (value: %, threshold: %)',
          alert_rec.severity,
          channel_rec.name,
          alert_rec.name,
          alert_rec.value,
          alert_rec.threshold;
      END IF;
    END LOOP;
    
    -- Mark the alert as notified
    UPDATE alert_history
    SET notification_sent = TRUE
    WHERE id = alert_rec.history_id;
  END LOOP;
END;
$$;

-- Create alert scheduling function
CREATE OR REPLACE FUNCTION schedule_alerts()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check alerts
  PERFORM check_alerts();
  
  -- Send notifications
  PERFORM send_alert_notifications();
END;
$$; 