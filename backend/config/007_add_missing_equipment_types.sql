-- Add equipment types that were missing from the initial seed.
-- These correspond to the full set of values sent by the mobile client
-- (mapEquipmentToBackend in auth-service.ts).
-- ON CONFLICT DO NOTHING is safe to re-run.

INSERT INTO equipment (name)
VALUES
    ('machine'),
    ('cable'),
    ('kettlebell'),
    ('band'),
    ('medicine ball'),
    ('none'),
    ('pullup_bar'),
    ('bodyweight'),
    ('dumbbell'),
    ('barbell')
ON CONFLICT (name) DO NOTHING;
