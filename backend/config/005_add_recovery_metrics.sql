-- Migration: Add RPE and Recovery metrics support
-- Date: 2026-05-15

ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS sleep_hours INTEGER DEFAULT 0;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS sleep_quality INTEGER DEFAULT 0;
ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS stress_level INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS recovery_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_hours INTEGER,
    sleep_quality INTEGER,
    stress_level INTEGER,
    soreness INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_recovery_metrics_user_date
ON recovery_metrics(user_id, date DESC);
