-- Migration: Extend workouts and workout_exercises tables with missing columns

-- Add missing columns to workouts table
ALTER TABLE public.workouts
ADD COLUMN IF NOT EXISTS day_index integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS split_part varchar(50) DEFAULT 'fullbody',
ADD COLUMN IF NOT EXISTS planned_for timestamp DEFAULT now();

-- Add missing column to workout_exercises table
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS cycle integer DEFAULT 1;

-- Ensure exercises table has all required columns
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS photo_path varchar(255);

-- Add columns for recovery metrics and workout logs
ALTER TABLE public.workout_logs
ADD COLUMN IF NOT EXISTS sleep_hours integer,
ADD COLUMN IF NOT EXISTS sleep_quality integer,
ADD COLUMN IF NOT EXISTS stress_level integer;

-- Add columns to exercise_logs for additional metrics
ALTER TABLE public.exercise_logs
ADD COLUMN IF NOT EXISTS rpe double precision,
ADD COLUMN IF NOT EXISTS form_quality integer,
ADD COLUMN IF NOT EXISTS cycle integer DEFAULT 1;

-- Ensure exercise_sets has RPE column
ALTER TABLE public.exercise_sets
ADD COLUMN IF NOT EXISTS rpe double precision;

COMMIT;

