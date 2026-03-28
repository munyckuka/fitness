-- Сначала очищаем старые exercise_sets
TRUNCATE exercise_sets;

-- Вставляем exercise_sets с прогрессией веса +1кг в неделю
-- Каждое упражнение имеет 4 подхода (на Bench Press и Bicep Curl)

-- Неделя 1 (логи 1-2): Bench 60kg, Bicep 10kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 60
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-000000000002')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 10
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000001', '22222222-2222-2222-2222-000000000002')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 2 (логи 3-4): Bench 61kg, Bicep 11kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 61
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-000000000004')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 11
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000003', '22222222-2222-2222-2222-000000000004')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 3 (логи 5-6): Bench 62kg, Bicep 12kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 62
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000005', '22222222-2222-2222-2222-000000000006')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 12
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000005', '22222222-2222-2222-2222-000000000006')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 4 (логи 7-8): Bench 63kg, Bicep 13kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 63
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000007', '22222222-2222-2222-2222-000000000008')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 13
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000007', '22222222-2222-2222-2222-000000000008')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 5 (логи 9-10): Bench 64kg, Bicep 14kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 64
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000009', '22222222-2222-2222-2222-000000000010')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 14
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000009', '22222222-2222-2222-2222-000000000010')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 6 (логи 11-12): Bench 65kg, Bicep 15kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 65
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000011', '22222222-2222-2222-2222-000000000012')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 15
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000011', '22222222-2222-2222-2222-000000000012')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 7 (логи 13-14): Bench 66kg, Bicep 16kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 66
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000013', '22222222-2222-2222-2222-000000000014')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 16
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000013', '22222222-2222-2222-2222-000000000014')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 8 (логи 15-16): Bench 67kg, Bicep 17kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 67
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000015', '22222222-2222-2222-2222-000000000016')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 17
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000015', '22222222-2222-2222-2222-000000000016')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 9 (логи 17-18): Bench 68kg, Bicep 18kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 68
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000017', '22222222-2222-2222-2222-000000000018')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 18
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000017', '22222222-2222-2222-2222-000000000018')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 10 (логи 19-20): Bench 69kg, Bicep 19kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 69
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000019', '22222222-2222-2222-2222-000000000020')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 19
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000019', '22222222-2222-2222-2222-000000000020')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 11 (логи 21-22): Bench 70kg, Bicep 20kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 70
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000021', '22222222-2222-2222-2222-000000000022')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 20
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000021', '22222222-2222-2222-2222-000000000022')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Неделя 12 (логи 23-24): Bench 71kg, Bicep 21kg
INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 8, 71
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000023', '22222222-2222-2222-2222-000000000024')
AND el.exercise_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

INSERT INTO exercise_sets (exercise_log_id, reps, weight)
SELECT el.id, 10, 21
FROM exercise_logs el
WHERE el.workout_log_id IN ('22222222-2222-2222-2222-000000000023', '22222222-2222-2222-2222-000000000024')
AND el.exercise_id = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

-- Push Up без веса (вес = 0, не вставляем или вес = 0)

-- Проверяем результат
SELECT 
  wl.created_at,
  e.name,
  MAX(es.weight) as max_weight,
  COUNT(*) as sets_count
FROM exercise_sets es
JOIN exercise_logs el ON es.exercise_log_id = el.id
JOIN workout_logs wl ON el.workout_log_id = wl.id
JOIN exercises e ON el.exercise_id = e.id
WHERE wl.user_id = '22222222-2222-2222-2222-222222222222'
GROUP BY wl.created_at, e.name
ORDER BY wl.created_at, e.name;
