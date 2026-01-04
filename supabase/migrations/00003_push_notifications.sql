-- Migration: Add push notification subscriptions and notification preferences
-- Created: 2024-01-04

-- ============================================================================
-- Push Subscriptions Table
-- Stores browser push notification subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Index for faster lookups
  CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- ============================================================================
-- Notification Preferences Table
-- Stores user notification preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Push notification settings
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  push_low_moisture BOOLEAN NOT NULL DEFAULT true,
  push_daily_summary BOOLEAN NOT NULL DEFAULT false,
  push_new_readings BOOLEAN NOT NULL DEFAULT false,

  -- Email notification settings (already exist in alerts, but preferences here)
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  email_low_moisture BOOLEAN NOT NULL DEFAULT true,
  email_weekly_report BOOLEAN NOT NULL DEFAULT false,

  -- Quiet hours (no notifications during these hours)
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Notifications Table
-- Stores in-app notifications (notification center)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Notification content
  type TEXT NOT NULL CHECK (type IN ('low_moisture', 'data_updated', 'system', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related entities
  field_id UUID REFERENCES fields(id) ON DELETE SET NULL,
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,

  -- Status
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Metadata
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Push Subscriptions RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Notification Preferences RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert notifications
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences when profile is created
CREATE TRIGGER create_notification_preferences_on_profile
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM notifications
  WHERE user_id = p_user_id
    AND read_at IS NULL
    AND dismissed_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
  WITH updated AS (
    UPDATE notifications
    SET read_at = NOW()
    WHERE user_id = p_user_id
      AND read_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER FROM updated;
$$ LANGUAGE sql SECURITY DEFINER;
