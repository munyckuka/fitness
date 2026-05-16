-- regenerate_exercises.sql
-- Удаляет все существующие упражнения и связанные с ними записи, затем генерирует N новых упражнений
-- Запуск: psql -h <host> -U <user> -d <db> -f regenerate_exercises.sql

BEGIN;

-- Создадим резервные таблицы (если их нет) и сохраним текущие данные
-- Используем структуру исходных таблиц (INCLUDING ALL) чтобы не терять схему
CREATE TABLE IF NOT EXISTS public.backup_exercises (LIKE public.exercises INCLUDING ALL);
CREATE TABLE IF NOT EXISTS public.backup_workout_exercises (LIKE public.workout_exercises INCLUDING ALL);
-- Сохраним данные в резерв
INSERT INTO public.backup_exercises SELECT * FROM public.exercises;
INSERT INTO public.backup_workout_exercises SELECT * FROM public.workout_exercises;

-- Удаляем связанные записи, чтобы корректно заменить весь набор упражнений
DELETE FROM public.workout_exercises;
DELETE FROM public.exercise_sets;
DELETE FROM public.exercise_logs;
DELETE FROM public.exercises;

-- Попытка включить pgcrypto для gen_random_uuid(); если разрешений нет — команда будет проигнорирована
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
  EXCEPTION WHEN OTHERS THEN
    -- может не быть прав на создание расширения — продолжим без ошибки
    RAISE NOTICE 'Cannot create extension pgcrypto (ignored)';
  END;
END$$;

-- Список упражнений с заранее заданной основной мышечной группой.
-- Это гарантирует, что, например, Bicep Curl попадёт в biceps, а не в legs.
WITH catalog AS (
  SELECT * FROM (VALUES
    ('Bench Press','chest','barbell','intermediate'),
    ('Incline Bench Press','chest','barbell','intermediate'),
    ('Decline Bench Press','chest','barbell','intermediate'),
    ('Push Up','chest','bodyweight','beginner'),
    ('Dumbbell Fly','chest','dumbbell','intermediate'),
    ('Chest Dip','chest','bodyweight','intermediate'),
    ('Cable Crossover','chest','cable','intermediate'),
    ('Machine Chest Press','chest','machine','beginner'),

    ('Pull Up','back','bodyweight','advanced'),
    ('Chin Up','back','bodyweight','advanced'),
    ('Lat Pulldown','back','machine','intermediate'),
    ('Barbell Row','back','barbell','intermediate'),
    ('Dumbbell Row','back','dumbbell','intermediate'),
    ('Seated Cable Row','back','cable','intermediate'),
    ('T-Bar Row','back','barbell','intermediate'),
    ('Face Pull','back','cable','beginner'),

    ('Squat','legs','barbell','intermediate'),
    ('Front Squat','legs','barbell','advanced'),
    ('Goblet Squat','legs','dumbbell','beginner'),
    ('Leg Press','legs','machine','intermediate'),
    ('Lunge','legs','bodyweight','beginner'),
    ('Bulgarian Split Squat','legs','bodyweight','intermediate'),
    ('Step Up','legs','bodyweight','beginner'),
    ('Box Jump','legs','bodyweight','intermediate'),

    ('Deadlift','glutes','barbell','advanced'),
    ('Romanian Deadlift','glutes','barbell','advanced'),
    ('Sumo Deadlift','glutes','barbell','advanced'),
    ('Hip Thrust','glutes','barbell','intermediate'),
    ('Glute Bridge','glutes','bodyweight','beginner'),
    ('Good Morning','glutes','barbell','intermediate'),
    ('Kettlebell Swing','glutes','kettlebell','intermediate'),

    ('Overhead Press','shoulders','barbell','intermediate'),
    ('Seated Dumbbell Press','shoulders','dumbbell','intermediate'),
    ('Arnold Press','shoulders','dumbbell','advanced'),
    ('Lateral Raise','shoulders','dumbbell','beginner'),
    ('Front Raise','shoulders','dumbbell','beginner'),
    ('Reverse Fly','shoulders','dumbbell','intermediate'),
    ('Shrug','shoulders','barbell','beginner'),

    ('Bicep Curl','biceps','dumbbell','beginner'),
    ('Hammer Curl','biceps','dumbbell','beginner'),
    ('Preacher Curl','biceps','machine','intermediate'),
    ('Cable Curl','biceps','cable','intermediate'),
    ('Concentration Curl','biceps','dumbbell','intermediate'),

    ('Tricep Pushdown','triceps','cable','beginner'),
    ('Skullcrusher','triceps','barbell','intermediate'),
    ('Overhead Tricep Extension','triceps','dumbbell','intermediate'),
    ('Dip','triceps','bodyweight','intermediate'),
    ('Close Grip Bench Press','triceps','barbell','advanced'),

    ('Plank','core','bodyweight','beginner'),
    ('Russian Twist','core','medicine ball','intermediate'),
    ('Hanging Leg Raise','core','bodyweight','intermediate'),
    ('Mountain Climber','core','bodyweight','beginner'),
    ('Bicycle Crunch','core','bodyweight','beginner'),
    ('Medicine Ball Slam','core','medicine ball','intermediate'),

    ('Calf Raise','calves','bodyweight','beginner'),
    ('Seated Calf Raise','calves','machine','beginner'),
    ('Farmer''s Walk','full body','dumbbell','beginner'),
    ('Sled Push','full body','machine','intermediate'),
    ('Battle Ropes','full body','machine','intermediate'),
    ('Rowing','full body','machine','intermediate'),
    ('Jump Rope','full body','none','beginner')
  ) AS t(name, muscle, equipment, difficulty)
)

-- Сгенерируем 200 упражнений выбирая случайные элементы из каталога и добавляя индекс
INSERT INTO public.exercises (id, name, muscle_group, required_equipment, difficulty_level)
SELECT gen_random_uuid(), c.name || ' #' || s.rn, c.muscle, c.equipment, c.difficulty
FROM (
  SELECT row_number() over () as rn FROM generate_series(1,200)
) s
CROSS JOIN LATERAL (
  SELECT name, muscle, equipment, difficulty FROM catalog ORDER BY random() LIMIT 1
) c;

COMMIT;

-- Покажем сколько новых упражнений добавлено
SELECT COUNT(*) as total_exercises FROM public.exercises;


