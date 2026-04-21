ALTER TABLE users
ADD COLUMN IF NOT EXISTS login TEXT;

WITH base AS (
    SELECT COALESCE(MAX((regexp_match(login, '^login([0-9]+)$'))[1]::INT), 0) AS max_n
    FROM users
    WHERE login ~ '^login[0-9]+$'
),
missing AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM users
    WHERE login IS NULL OR login = ''
)
UPDATE users u
SET login = 'login' || (base.max_n + missing.rn)
FROM base, missing
WHERE u.id = missing.id;

ALTER TABLE users
ALTER COLUMN login SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_unique ON users (login);
