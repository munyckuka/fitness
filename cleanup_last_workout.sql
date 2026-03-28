-- Удаляем последнюю тренировку от 2026-03-30 и все связанные записи
DELETE FROM exercise_sets WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  INNER JOIN workout_logs wl ON el.workout_log_id = wl.id
  WHERE wl.workout_id = '550e8400-e29b-41d4-a716-446655440025'
);

DELETE FROM exercise_logs WHERE workout_log_id IN (
  SELECT id FROM workout_logs WHERE workout_id = '550e8400-e29b-41d4-a716-446655440025'
);

DELETE FROM workout_logs WHERE workout_id = '550e8400-e29b-41d4-a716-446655440025';

DELETE FROM workout_exercises WHERE workout_id = '550e8400-e29b-41d4-a716-446655440025';

DELETE FROM workouts WHERE id = '550e8400-e29b-41d4-a716-446655440025';

-- Проверяем, что осталось
SELECT COUNT(*) as remaining_workouts FROM workouts WHERE user_id = '22222222-2222-2222-2222-222222222222';
SELECT COUNT(*) as remaining_workout_logs FROM workout_logs WHERE user_id = '22222222-2222-2222-2222-222222222222';
SELECT COUNT(*) as remaining_exercise_logs FROM exercise_logs;
