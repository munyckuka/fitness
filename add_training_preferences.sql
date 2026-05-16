-- Training preferences: user-chosen split + days of the week.
-- Re-run safe.

CREATE TABLE IF NOT EXISTS public.training_preferences (
    user_id      uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    days_of_week integer[] NOT NULL DEFAULT '{}',
    split        varchar(32) NOT NULL DEFAULT 'fullbody',
    remember     boolean NOT NULL DEFAULT true,
    updated_at   timestamp without time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.workouts
    ADD COLUMN IF NOT EXISTS day_index   integer     NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS split_part  varchar(32) NOT NULL DEFAULT 'fullbody',
    ADD COLUMN IF NOT EXISTS planned_for date;

UPDATE public.workouts
SET planned_for = created_at::date
WHERE planned_for IS NULL;

ALTER TABLE public.workouts
    ALTER COLUMN planned_for SET NOT NULL;

CREATE INDEX IF NOT EXISTS workouts_user_planned_for_idx
    ON public.workouts (user_id, planned_for);

ALTER TABLE public.workout_exercises
    ADD COLUMN IF NOT EXISTS cycle integer NOT NULL DEFAULT 0;
