-- Очищаем старые workout_exercises идентификаторы (опционально, чтобы не было разных исторических записей)
-- Но можно оставить их как они есть

-- Добавляем workout_exercises для каждой из 25 новых тренировок
-- Каждая тренировка содержит 3 упражнения

INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, rest) VALUES
-- Тренировка 1
('550e8400-e29b-41d4-a716-446655440001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 60, 120),
('550e8400-e29b-41d4-a716-446655440001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 10, 90),
-- Тренировка 2
('550e8400-e29b-41d4-a716-446655440002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 70, 120),
('550e8400-e29b-41d4-a716-446655440002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 80, 120),
('550e8400-e29b-41d4-a716-446655440002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 25, 90),
-- Тренировка 3
('550e8400-e29b-41d4-a716-446655440003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 60, 120),
('550e8400-e29b-41d4-a716-446655440003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440003', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 10, 90),
-- Тренировка 4
('550e8400-e29b-41d4-a716-446655440004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 70, 120),
('550e8400-e29b-41d4-a716-446655440004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 80, 120),
('550e8400-e29b-41d4-a716-446655440004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 25, 90),
-- Тренировка 5
('550e8400-e29b-41d4-a716-446655440005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 62, 120),
('550e8400-e29b-41d4-a716-446655440005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 11, 90),
-- Тренировка 6
('550e8400-e29b-41d4-a716-446655440006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 72, 120),
('550e8400-e29b-41d4-a716-446655440006', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 82, 120),
('550e8400-e29b-41d4-a716-446655440006', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 26, 90),
-- Тренировка 7
('550e8400-e29b-41d4-a716-446655440007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 64, 120),
('550e8400-e29b-41d4-a716-446655440007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440007', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 12, 90),
-- Тренировка 8
('550e8400-e29b-41d4-a716-446655440008', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 74, 120),
('550e8400-e29b-41d4-a716-446655440008', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 84, 120),
('550e8400-e29b-41d4-a716-446655440008', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 27, 90),
-- Тренировка 9
('550e8400-e29b-41d4-a716-446655440009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 66, 120),
('550e8400-e29b-41d4-a716-446655440009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440009', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 13, 90),
-- Тренировка 10
('550e8400-e29b-41d4-a716-446655440010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 76, 120),
('550e8400-e29b-41d4-a716-446655440010', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 86, 120),
('550e8400-e29b-41d4-a716-446655440010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 28, 90),
-- Тренировка 11
('550e8400-e29b-41d4-a716-446655440011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 68, 120),
('550e8400-e29b-41d4-a716-446655440011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440011', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 14, 90),
-- Тренировка 12
('550e8400-e29b-41d4-a716-446655440012', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 78, 120),
('550e8400-e29b-41d4-a716-446655440012', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 88, 120),
('550e8400-e29b-41d4-a716-446655440012', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 29, 90),
-- Тренировка 13
('550e8400-e29b-41d4-a716-446655440013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 70, 120),
('550e8400-e29b-41d4-a716-446655440013', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440013', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 15, 90),
-- Тренировка 14
('550e8400-e29b-41d4-a716-446655440014', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 80, 120),
('550e8400-e29b-41d4-a716-446655440014', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 90, 120),
('550e8400-e29b-41d4-a716-446655440014', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 30, 90),
-- Тренировка 15
('550e8400-e29b-41d4-a716-446655440015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 72, 120),
('550e8400-e29b-41d4-a716-446655440015', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440015', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 16, 90),
-- Тренировка 16
('550e8400-e29b-41d4-a716-446655440016', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 82, 120),
('550e8400-e29b-41d4-a716-446655440016', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 92, 120),
('550e8400-e29b-41d4-a716-446655440016', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 31, 90),
-- Тренировка 17
('550e8400-e29b-41d4-a716-446655440017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 74, 120),
('550e8400-e29b-41d4-a716-446655440017', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440017', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 17, 90),
-- Тренировка 18
('550e8400-e29b-41d4-a716-446655440018', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 84, 120),
('550e8400-e29b-41d4-a716-446655440018', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 94, 120),
('550e8400-e29b-41d4-a716-446655440018', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 32, 90),
-- Тренировка 19
('550e8400-e29b-41d4-a716-446655440019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 76, 120),
('550e8400-e29b-41d4-a716-446655440019', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440019', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 18, 90),
-- Тренировка 20
('550e8400-e29b-41d4-a716-446655440020', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 86, 120),
('550e8400-e29b-41d4-a716-446655440020', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 96, 120),
('550e8400-e29b-41d4-a716-446655440020', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 33, 90),
-- Тренировка 21
('550e8400-e29b-41d4-a716-446655440021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 78, 120),
('550e8400-e29b-41d4-a716-446655440021', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440021', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 19, 90),
-- Тренировка 22
('550e8400-e29b-41d4-a716-446655440022', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 88, 120),
('550e8400-e29b-41d4-a716-446655440022', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 98, 120),
('550e8400-e29b-41d4-a716-446655440022', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 34, 90),
-- Тренировка 23
('550e8400-e29b-41d4-a716-446655440023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 80, 120),
('550e8400-e29b-41d4-a716-446655440023', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440023', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 20, 90),
-- Тренировка 24
('550e8400-e29b-41d4-a716-446655440024', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 4, 8, 90, 120),
('550e8400-e29b-41d4-a716-446655440024', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 4, 10, 100, 120),
('550e8400-e29b-41d4-a716-446655440024', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 3, 10, 35, 90),
-- Тренировка 25
('550e8400-e29b-41d4-a716-446655440025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 8, 82, 120),
('550e8400-e29b-41d4-a716-446655440025', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 10, 0, 90),
('550e8400-e29b-41d4-a716-446655440025', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 10, 21, 90);

-- Добавляем exercise_logs для каждого workout_exercise
-- Для каждого workout берем его timestamp и создаем log entries
INSERT INTO exercise_logs (id, workout_id, exercise_id, timestamp, sets) VALUES
-- Тренировка 1 (2026-01-05 08:00:00 = 1735978800)
('11111111-1111-1111-1111-111111111101', '550e8400-e29b-41d4-a716-446655440001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1735978800, '[{"reps": 8, "weight": 60}, {"reps": 8, "weight": 60}, {"reps": 8, "weight": 60}, {"reps": 8, "weight": 60}]'),
('11111111-1111-1111-1111-111111111102', '550e8400-e29b-41d4-a716-446655440001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1735978800, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111103', '550e8400-e29b-41d4-a716-446655440001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1735978800, '[{"reps": 10, "weight": 10}, {"reps": 10, "weight": 10}, {"reps": 10, "weight": 10}]'),
-- Тренировка 2 (2026-01-07 18:00:00 = 1736138400)
('11111111-1111-1111-1111-111111111201', '550e8400-e29b-41d4-a716-446655440002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1736138400, '[{"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}]'),
('11111111-1111-1111-1111-111111111202', '550e8400-e29b-41d4-a716-446655440002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1736138400, '[{"reps": 10, "weight": 80}, {"reps": 10, "weight": 80}, {"reps": 10, "weight": 80}, {"reps": 10, "weight": 80}]'),
('11111111-1111-1111-1111-111111111203', '550e8400-e29b-41d4-a716-446655440002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1736138400, '[{"reps": 10, "weight": 25}, {"reps": 10, "weight": 25}, {"reps": 10, "weight": 25}]'),
-- Тренировка 3 (2026-01-12 08:00:00 = 1736584800)
('11111111-1111-1111-1111-111111111301', '550e8400-e29b-41d4-a716-446655440003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1736584800, '[{"reps": 8, "weight": 60}, {"reps": 8, "weight": 60}, {"reps": 8, "weight": 60}, {"reps": 8, "weight": 60}]'),
('11111111-1111-1111-1111-111111111302', '550e8400-e29b-41d4-a716-446655440003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1736584800, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111303', '550e8400-e29b-41d4-a716-446655440003', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1736584800, '[{"reps": 10, "weight": 10}, {"reps": 10, "weight": 10}, {"reps": 10, "weight": 10}]'),
-- Тренировка 4 (2026-01-14 18:00:00 = 1736744400)
('11111111-1111-1111-1111-111111111401', '550e8400-e29b-41d4-a716-446655440004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1736744400, '[{"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}]'),
('11111111-1111-1111-1111-111111111402', '550e8400-e29b-41d4-a716-446655440004', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1736744400, '[{"reps": 10, "weight": 80}, {"reps": 10, "weight": 80}, {"reps": 10, "weight": 80}, {"reps": 10, "weight": 80}]'),
('11111111-1111-1111-1111-111111111403', '550e8400-e29b-41d4-a716-446655440004', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1736744400, '[{"reps": 10, "weight": 25}, {"reps": 10, "weight": 25}, {"reps": 10, "weight": 25}]'),
-- Тренировка 5 (2026-01-19 08:00:00 = 1737191200)
('11111111-1111-1111-1111-111111111501', '550e8400-e29b-41d4-a716-446655440005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1737191200, '[{"reps": 8, "weight": 62}, {"reps": 8, "weight": 62}, {"reps": 8, "weight": 62}, {"reps": 8, "weight": 62}]'),
('11111111-1111-1111-1111-111111111502', '550e8400-e29b-41d4-a716-446655440005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1737191200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111503', '550e8400-e29b-41d4-a716-446655440005', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1737191200, '[{"reps": 10, "weight": 11}, {"reps": 10, "weight": 11}, {"reps": 10, "weight": 11}]'),
-- Тренировка 6 (2026-01-21 18:00:00 = 1737350800)
('11111111-1111-1111-1111-111111111601', '550e8400-e29b-41d4-a716-446655440006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1737350800, '[{"reps": 8, "weight": 72}, {"reps": 8, "weight": 72}, {"reps": 8, "weight": 72}, {"reps": 8, "weight": 72}]'),
('11111111-1111-1111-1111-111111111602', '550e8400-e29b-41d4-a716-446655440006', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1737350800, '[{"reps": 10, "weight": 82}, {"reps": 10, "weight": 82}, {"reps": 10, "weight": 82}, {"reps": 10, "weight": 82}]'),
('11111111-1111-1111-1111-111111111603', '550e8400-e29b-41d4-a716-446655440006', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1737350800, '[{"reps": 10, "weight": 26}, {"reps": 10, "weight": 26}, {"reps": 10, "weight": 26}]'),
-- Тренировка 7 (2026-01-26 08:00:00 = 1737797200)
('11111111-1111-1111-1111-111111111701', '550e8400-e29b-41d4-a716-446655440007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1737797200, '[{"reps": 8, "weight": 64}, {"reps": 8, "weight": 64}, {"reps": 8, "weight": 64}, {"reps": 8, "weight": 64}]'),
('11111111-1111-1111-1111-111111111702', '550e8400-e29b-41d4-a716-446655440007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1737797200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111703', '550e8400-e29b-41d4-a716-446655440007', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1737797200, '[{"reps": 10, "weight": 12}, {"reps": 10, "weight": 12}, {"reps": 10, "weight": 12}]'),
-- Тренировка 8 (2026-01-28 18:00:00 = 1737956800)
('11111111-1111-1111-1111-111111111801', '550e8400-e29b-41d4-a716-446655440008', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1737956800, '[{"reps": 8, "weight": 74}, {"reps": 8, "weight": 74}, {"reps": 8, "weight": 74}, {"reps": 8, "weight": 74}]'),
('11111111-1111-1111-1111-111111111802', '550e8400-e29b-41d4-a716-446655440008', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1737956800, '[{"reps": 10, "weight": 84}, {"reps": 10, "weight": 84}, {"reps": 10, "weight": 84}, {"reps": 10, "weight": 84}]'),
('11111111-1111-1111-1111-111111111803', '550e8400-e29b-41d4-a716-446655440008', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1737956800, '[{"reps": 10, "weight": 27}, {"reps": 10, "weight": 27}, {"reps": 10, "weight": 27}]'),
-- Тренировка 9 (2026-02-02 08:00:00 = 1738403200)
('11111111-1111-1111-1111-111111111901', '550e8400-e29b-41d4-a716-446655440009', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1738403200, '[{"reps": 8, "weight": 66}, {"reps": 8, "weight": 66}, {"reps": 8, "weight": 66}, {"reps": 8, "weight": 66}]'),
('11111111-1111-1111-1111-111111111902', '550e8400-e29b-41d4-a716-446655440009', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1738403200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111903', '550e8400-e29b-41d4-a716-446655440009', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1738403200, '[{"reps": 10, "weight": 13}, {"reps": 10, "weight": 13}, {"reps": 10, "weight": 13}]'),
-- Тренировка 10 (2026-02-04 18:00:00 = 1738562800)
('11111111-1111-1111-1111-111111111a01', '550e8400-e29b-41d4-a716-446655440010', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1738562800, '[{"reps": 8, "weight": 76}, {"reps": 8, "weight": 76}, {"reps": 8, "weight": 76}, {"reps": 8, "weight": 76}]'),
('11111111-1111-1111-1111-111111111a02', '550e8400-e29b-41d4-a716-446655440010', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1738562800, '[{"reps": 10, "weight": 86}, {"reps": 10, "weight": 86}, {"reps": 10, "weight": 86}, {"reps": 10, "weight": 86}]'),
('11111111-1111-1111-1111-111111111a03', '550e8400-e29b-41d4-a716-446655440010', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1738562800, '[{"reps": 10, "weight": 28}, {"reps": 10, "weight": 28}, {"reps": 10, "weight": 28}]'),
-- Тренировка 11 (2026-02-09 08:00:00 = 1739009200)
('11111111-1111-1111-1111-111111111b01', '550e8400-e29b-41d4-a716-446655440011', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1739009200, '[{"reps": 8, "weight": 68}, {"reps": 8, "weight": 68}, {"reps": 8, "weight": 68}, {"reps": 8, "weight": 68}]'),
('11111111-1111-1111-1111-111111111b02', '550e8400-e29b-41d4-a716-446655440011', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1739009200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111b03', '550e8400-e29b-41d4-a716-446655440011', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1739009200, '[{"reps": 10, "weight": 14}, {"reps": 10, "weight": 14}, {"reps": 10, "weight": 14}]'),
-- Тренировка 12 (2026-02-11 18:00:00 = 1739168800)
('11111111-1111-1111-1111-111111111c01', '550e8400-e29b-41d4-a716-446655440012', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1739168800, '[{"reps": 8, "weight": 78}, {"reps": 8, "weight": 78}, {"reps": 8, "weight": 78}, {"reps": 8, "weight": 78}]'),
('11111111-1111-1111-1111-111111111c02', '550e8400-e29b-41d4-a716-446655440012', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1739168800, '[{"reps": 10, "weight": 88}, {"reps": 10, "weight": 88}, {"reps": 10, "weight": 88}, {"reps": 10, "weight": 88}]'),
('11111111-1111-1111-1111-111111111c03', '550e8400-e29b-41d4-a716-446655440012', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1739168800, '[{"reps": 10, "weight": 29}, {"reps": 10, "weight": 29}, {"reps": 10, "weight": 29}]'),
-- Тренировка 13 (2026-02-16 08:00:00 = 1739615200)
('11111111-1111-1111-1111-111111111d01', '550e8400-e29b-41d4-a716-446655440013', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1739615200, '[{"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}, {"reps": 8, "weight": 70}]'),
('11111111-1111-1111-1111-111111111d02', '550e8400-e29b-41d4-a716-446655440013', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1739615200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111d03', '550e8400-e29b-41d4-a716-446655440013', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1739615200, '[{"reps": 10, "weight": 15}, {"reps": 10, "weight": 15}, {"reps": 10, "weight": 15}]'),
-- Тренировка 14 (2026-02-18 18:00:00 = 1739774800)
('11111111-1111-1111-1111-111111111e01', '550e8400-e29b-41d4-a716-446655440014', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1739774800, '[{"reps": 8, "weight": 80}, {"reps": 8, "weight": 80}, {"reps": 8, "weight": 80}, {"reps": 8, "weight": 80}]'),
('11111111-1111-1111-1111-111111111e02', '550e8400-e29b-41d4-a716-446655440014', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1739774800, '[{"reps": 10, "weight": 90}, {"reps": 10, "weight": 90}, {"reps": 10, "weight": 90}, {"reps": 10, "weight": 90}]'),
('11111111-1111-1111-1111-111111111e03', '550e8400-e29b-41d4-a716-446655440014', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1739774800, '[{"reps": 10, "weight": 30}, {"reps": 10, "weight": 30}, {"reps": 10, "weight": 30}]'),
-- Тренировка 15 (2026-02-23 08:00:00 = 1740221200)
('11111111-1111-1111-1111-111111111f01', '550e8400-e29b-41d4-a716-446655440015', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1740221200, '[{"reps": 8, "weight": 72}, {"reps": 8, "weight": 72}, {"reps": 8, "weight": 72}, {"reps": 8, "weight": 72}]'),
('11111111-1111-1111-1111-111111111f02', '550e8400-e29b-41d4-a716-446655440015', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1740221200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111f03', '550e8400-e29b-41d4-a716-446655440015', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1740221200, '[{"reps": 10, "weight": 16}, {"reps": 10, "weight": 16}, {"reps": 10, "weight": 16}]'),
-- Тренировка 16 (2026-02-25 18:00:00 = 1740380800)
('11111111-1111-1111-1111-111111111g01', '550e8400-e29b-41d4-a716-446655440016', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1740380800, '[{"reps": 8, "weight": 82}, {"reps": 8, "weight": 82}, {"reps": 8, "weight": 82}, {"reps": 8, "weight": 82}]'),
('11111111-1111-1111-1111-111111111g02', '550e8400-e29b-41d4-a716-446655440016', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1740380800, '[{"reps": 10, "weight": 92}, {"reps": 10, "weight": 92}, {"reps": 10, "weight": 92}, {"reps": 10, "weight": 92}]'),
('11111111-1111-1111-1111-111111111g03', '550e8400-e29b-41d4-a716-446655440016', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1740380800, '[{"reps": 10, "weight": 31}, {"reps": 10, "weight": 31}, {"reps": 10, "weight": 31}]'),
-- Тренировка 17 (2026-03-02 08:00:00 = 1740827200)
('11111111-1111-1111-1111-111111111h01', '550e8400-e29b-41d4-a716-446655440017', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1740827200, '[{"reps": 8, "weight": 74}, {"reps": 8, "weight": 74}, {"reps": 8, "weight": 74}, {"reps": 8, "weight": 74}]'),
('11111111-1111-1111-1111-111111111h02', '550e8400-e29b-41d4-a716-446655440017', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1740827200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111h03', '550e8400-e29b-41d4-a716-446655440017', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1740827200, '[{"reps": 10, "weight": 17}, {"reps": 10, "weight": 17}, {"reps": 10, "weight": 17}]'),
-- Тренировка 18 (2026-03-04 18:00:00 = 1740986800)
('11111111-1111-1111-1111-111111111i01', '550e8400-e29b-41d4-a716-446655440018', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1740986800, '[{"reps": 8, "weight": 84}, {"reps": 8, "weight": 84}, {"reps": 8, "weight": 84}, {"reps": 8, "weight": 84}]'),
('11111111-1111-1111-1111-111111111i02', '550e8400-e29b-41d4-a716-446655440018', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1740986800, '[{"reps": 10, "weight": 94}, {"reps": 10, "weight": 94}, {"reps": 10, "weight": 94}, {"reps": 10, "weight": 94}]'),
('11111111-1111-1111-1111-111111111i03', '550e8400-e29b-41d4-a716-446655440018', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1740986800, '[{"reps": 10, "weight": 32}, {"reps": 10, "weight": 32}, {"reps": 10, "weight": 32}]'),
-- Тренировка 19 (2026-03-09 08:00:00 = 1741433200)
('11111111-1111-1111-1111-111111111j01', '550e8400-e29b-41d4-a716-446655440019', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1741433200, '[{"reps": 8, "weight": 76}, {"reps": 8, "weight": 76}, {"reps": 8, "weight": 76}, {"reps": 8, "weight": 76}]'),
('11111111-1111-1111-1111-111111111j02', '550e8400-e29b-41d4-a716-446655440019', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1741433200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111j03', '550e8400-e29b-41d4-a716-446655440019', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1741433200, '[{"reps": 10, "weight": 18}, {"reps": 10, "weight": 18}, {"reps": 10, "weight": 18}]'),
-- Тренировка 20 (2026-03-11 18:00:00 = 1741592800)
('11111111-1111-1111-1111-111111111k01', '550e8400-e29b-41d4-a716-446655440020', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1741592800, '[{"reps": 8, "weight": 86}, {"reps": 8, "weight": 86}, {"reps": 8, "weight": 86}, {"reps": 8, "weight": 86}]'),
('11111111-1111-1111-1111-111111111k02', '550e8400-e29b-41d4-a716-446655440020', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1741592800, '[{"reps": 10, "weight": 96}, {"reps": 10, "weight": 96}, {"reps": 10, "weight": 96}, {"reps": 10, "weight": 96}]'),
('11111111-1111-1111-1111-111111111k03', '550e8400-e29b-41d4-a716-446655440020', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1741592800, '[{"reps": 10, "weight": 33}, {"reps": 10, "weight": 33}, {"reps": 10, "weight": 33}]'),
-- Тренировка 21 (2026-03-16 08:00:00 = 1742039200)
('11111111-1111-1111-1111-111111111l01', '550e8400-e29b-41d4-a716-446655440021', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1742039200, '[{"reps": 8, "weight": 78}, {"reps": 8, "weight": 78}, {"reps": 8, "weight": 78}, {"reps": 8, "weight": 78}]'),
('11111111-1111-1111-1111-111111111l02', '550e8400-e29b-41d4-a716-446655440021', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1742039200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111l03', '550e8400-e29b-41d4-a716-446655440021', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1742039200, '[{"reps": 10, "weight": 19}, {"reps": 10, "weight": 19}, {"reps": 10, "weight": 19}]'),
-- Тренировка 22 (2026-03-18 18:00:00 = 1742198800)
('11111111-1111-1111-1111-111111111m01', '550e8400-e29b-41d4-a716-446655440022', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1742198800, '[{"reps": 8, "weight": 88}, {"reps": 8, "weight": 88}, {"reps": 8, "weight": 88}, {"reps": 8, "weight": 88}]'),
('11111111-1111-1111-1111-111111111m02', '550e8400-e29b-41d4-a716-446655440022', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1742198800, '[{"reps": 10, "weight": 98}, {"reps": 10, "weight": 98}, {"reps": 10, "weight": 98}, {"reps": 10, "weight": 98}]'),
('11111111-1111-1111-1111-111111111m03', '550e8400-e29b-41d4-a716-446655440022', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1742198800, '[{"reps": 10, "weight": 34}, {"reps": 10, "weight": 34}, {"reps": 10, "weight": 34}]'),
-- Тренировка 23 (2026-03-23 08:00:00 = 1742645200)
('11111111-1111-1111-1111-111111111n01', '550e8400-e29b-41d4-a716-446655440023', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1742645200, '[{"reps": 8, "weight": 80}, {"reps": 8, "weight": 80}, {"reps": 8, "weight": 80}, {"reps": 8, "weight": 80}]'),
('11111111-1111-1111-1111-111111111n02', '550e8400-e29b-41d4-a716-446655440023', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1742645200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111n03', '550e8400-e29b-41d4-a716-446655440023', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1742645200, '[{"reps": 10, "weight": 20}, {"reps": 10, "weight": 20}, {"reps": 10, "weight": 20}]'),
-- Тренировка 24 (2026-03-25 18:00:00 = 1742804800)
('11111111-1111-1111-1111-111111111o01', '550e8400-e29b-41d4-a716-446655440024', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1742804800, '[{"reps": 8, "weight": 90}, {"reps": 8, "weight": 90}, {"reps": 8, "weight": 90}, {"reps": 8, "weight": 90}]'),
('11111111-1111-1111-1111-111111111o02', '550e8400-e29b-41d4-a716-446655440024', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1742804800, '[{"reps": 10, "weight": 100}, {"reps": 10, "weight": 100}, {"reps": 10, "weight": 100}, {"reps": 10, "weight": 100}]'),
('11111111-1111-1111-1111-111111111o03', '550e8400-e29b-41d4-a716-446655440024', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1742804800, '[{"reps": 10, "weight": 35}, {"reps": 10, "weight": 35}, {"reps": 10, "weight": 35}]'),
-- Тренировка 25 (2026-03-30 08:00:00 = 1743251200)
('11111111-1111-1111-1111-111111111p01', '550e8400-e29b-41d4-a716-446655440025', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1743251200, '[{"reps": 8, "weight": 82}, {"reps": 8, "weight": 82}, {"reps": 8, "weight": 82}, {"reps": 8, "weight": 82}]'),
('11111111-1111-1111-1111-111111111p02', '550e8400-e29b-41d4-a716-446655440025', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1743251200, '[{"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}, {"reps": 10, "weight": 0}]'),
('11111111-1111-1111-1111-111111111p03', '550e8400-e29b-41d4-a716-446655440025', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 1743251200, '[{"reps": 10, "weight": 21}, {"reps": 10, "weight": 21}, {"reps": 10, "weight": 21}]');

SELECT COUNT(*) as total_logs FROM exercise_logs;
