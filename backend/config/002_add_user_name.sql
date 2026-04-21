ALTER TABLE users
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

UPDATE users
SET name = 'Пользователь'
WHERE name = '' OR name IS NULL;
