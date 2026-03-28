SELECT 
  wl.id as log_id,
  wl.workout_id,
  wl.created_at as workout_date,
  e.name as exercise_name,
  el.difficulty
FROM workout_logs wl
LEFT JOIN exercise_logs el ON wl.id = el.workout_log_id
LEFT JOIN exercises e ON el.exercise_id = e.id
WHERE wl.user_id = '22222222-2222-2222-2222-222222222222'
ORDER BY wl.created_at, e.name;
