-- Migration 008: Normalize exercise muscle_group values to match backend/frontend expectations.
-- DB had plural forms (biceps, triceps, shoulders); code expects singular (bicep, tricep, shoulder).

UPDATE public.exercises SET muscle_group = 'bicep'    WHERE muscle_group = 'biceps';
UPDATE public.exercises SET muscle_group = 'tricep'   WHERE muscle_group = 'triceps';
UPDATE public.exercises SET muscle_group = 'shoulder' WHERE muscle_group = 'shoulders';
