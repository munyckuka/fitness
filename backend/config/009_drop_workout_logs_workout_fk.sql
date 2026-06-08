-- Drop FK from workout_logs.workout_id so workouts can be deleted
-- while their logs are preserved for statistics.

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT tc.constraint_name
      INTO constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema    = kcu.table_schema
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND tc.table_name      = 'workout_logs'
       AND kcu.column_name    = 'workout_id'
     LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE workout_logs DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END;
$$;
