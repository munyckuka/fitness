-- Обновляем веса в exercise_sets с прогрессией +1кг в неделю
-- Для Bench Press: начало 60 кг
-- Для Bicep Curl: начало 10 кг

-- Неделя 1 (логи 1-2): Bench 60kg, Bicep 10kg
UPDATE exercise_sets
SET weight = 60
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-000000000002')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 10
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-000000000002')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 2 (логи 3-4): Bench 61kg, Bicep 11kg
UPDATE exercise_sets
SET weight = 61
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-000000000004')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 11
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-000000000004')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 3 (логи 5-6): Bench 62kg, Bicep 12kg
UPDATE exercise_sets
SET weight = 62
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000005', '22222222-2222-2222-2222-000000000006')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 12
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000005', '22222222-2222-2222-2222-000000000006')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 4 (логи 7-8): Bench 63kg, Bicep 13kg
UPDATE exercise_sets
SET weight = 63
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000007', '22222222-2222-2222-2222-000000000008')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 13
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000007', '22222222-2222-2222-2222-000000000008')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 5 (логи 9-10): Bench 64kg, Bicep 14kg
UPDATE exercise_sets
SET weight = 64
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000009', '22222222-2222-2222-2222-000000000010')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 14
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000009', '22222222-2222-2222-2222-000000000010')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 6 (логи 11-12): Bench 65kg, Bicep 15kg
UPDATE exercise_sets
SET weight = 65
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000011', '22222222-2222-2222-2222-000000000012')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 15
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000011', '22222222-2222-2222-2222-000000000012')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 7 (логи 13-14): Bench 66kg, Bicep 16kg
UPDATE exercise_sets
SET weight = 66
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000013', '22222222-2222-2222-2222-000000000014')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 16
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000013', '22222222-2222-2222-2222-000000000014')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 8 (логи 15-16): Bench 67kg, Bicep 17kg
UPDATE exercise_sets
SET weight = 67
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000015', '22222222-2222-2222-2222-000000000016')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 17
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000015', '22222222-2222-2222-2222-000000000016')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 9 (логи 17-18): Bench 68kg, Bicep 18kg
UPDATE exercise_sets
SET weight = 68
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000017', '22222222-2222-2222-2222-000000000018')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 18
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000017', '22222222-2222-2222-2222-000000000018')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 10 (логи 19-20): Bench 69kg, Bicep 19kg
UPDATE exercise_sets
SET weight = 69
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000019', '22222222-2222-2222-2222-000000000020')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 19
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000019', '22222222-2222-2222-2222-000000000020')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 11 (логи 21-22): Bench 70kg, Bicep 20kg
UPDATE exercise_sets
SET weight = 70
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000021', '22222222-2222-2222-2222-000000000022')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 20
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000021', '22222222-2222-2222-2222-000000000022')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Неделя 12 (логи 23-24): Bench 71kg, Bicep 21kg
UPDATE exercise_sets
SET weight = 71
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000023', '22222222-2222-2222-2222-000000000024')
  AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
);

UPDATE exercise_sets
SET weight = 21
WHERE exercise_log_id IN (
  SELECT el.id FROM exercise_logs el
  WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000023', '22222222-2222-2222-2222-000000000024')
  AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
);

-- Push Up не требует веса, оставляем 0

-- Проверяем результат
SELECT 
  wl.created_at,
  e.name,
  AVG(es.weight) as avg_weight,
  COUNT(*) as sets_count
FROM exercise_sets es
JOIN exercise_logs el ON es.exercise_log_id = el.id
JOIN workout_logs wl ON el.workout_log_id = wl.id
JOIN exercises e ON el.exercise_id = e.id
WHERE wl.user_id = '22222222-2222-2222-2222-222222222222'
AND el.exercise_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ffffffff-ffff-ffff-ffff-ffffffffffff')
GROUP BY wl.created_at, e.name
ORDER BY wl.created_at, e.name;
