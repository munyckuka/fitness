"""
Seed exercises from free-exercise-db (yuhonas/free-exercise-db).
Translates names and short descriptions to Russian via GoogleTranslator.
Replaces all existing exercises in the DB.
"""

import json
import time
import uuid
import requests
import psycopg2
from deep_translator import GoogleTranslator

DB_URL = "postgresql://neondb_owner:npg_LtRS6xgp3qnF@ep-delicate-breeze-alm92i82-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
EXERCISES_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

MUSCLE_MAP = {
    "abdominals": "core",
    "abductors": "legs",
    "adductors": "legs",
    "biceps": "bicep",
    "forearms": "bicep",
    "triceps": "tricep",
    "chest": "chest",
    "lats": "back",
    "middle back": "back",
    "lower back": "back",
    "traps": "back",
    "neck": "back",
    "shoulders": "shoulder",
    "glutes": "glutes",
    "calves": "calves",
    "quadriceps": "legs",
    "hamstrings": "legs",
}

EQUIPMENT_MAP = {
    "dumbbell": "dumbbell",
    "barbell": "barbell",
    "e-z curl bar": "barbell",
    "body only": "bodyweight",
    "machine": "machine",
    "cable": "cable",
    "kettlebell": "kettlebell",
    "bands": "band",
    "medicine ball": "medicine ball",
    "other": "none",
    "foam roll": "none",
    "exercise ball": "none",
}

LEVEL_MAP = {
    "beginner": "beginner",
    "intermediate": "intermediate",
    "expert": "advanced",
}

translator = GoogleTranslator(source="en", target="ru")

def translate(text: str, retries: int = 3) -> str:
    if not text:
        return ""
    for attempt in range(retries):
        try:
            result = translator.translate(text[:500])
            return result or text
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2)
            else:
                print(f"  [warn] translation failed for '{text[:40]}': {e}")
                return text
    return text

def map_muscle(muscles: list) -> str:
    for m in muscles:
        mapped = MUSCLE_MAP.get(m.lower())
        if mapped:
            return mapped
    return "full body"

def map_equipment(eq) -> str:
    if not eq:
        return "none"
    return EQUIPMENT_MAP.get(eq.lower(), "none")

def map_level(level) -> str:
    if not level:
        return "beginner"
    return LEVEL_MAP.get(level.lower(), "beginner")

def main():
    print("Fetching exercises from free-exercise-db...")
    resp = requests.get(EXERCISES_URL, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    print(f"Loaded {len(data)} exercises")

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("Dropping exercise_logs FK to allow exercise replacement...")
    cur.execute("""
        DO $$
        DECLARE constraint_name TEXT;
        BEGIN
            SELECT tc.constraint_name INTO constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'exercise_logs' AND kcu.column_name = 'exercise_id'
            LIMIT 1;
            IF constraint_name IS NOT NULL THEN
                EXECUTE 'ALTER TABLE exercise_logs DROP CONSTRAINT ' || quote_ident(constraint_name);
            END IF;
        END; $$;
    """)
    conn.commit()

    print("Clearing existing exercises...")
    cur.execute("DELETE FROM workout_exercises")
    cur.execute("DELETE FROM exercises")
    conn.commit()

    inserted = 0
    skipped = 0

    for i, ex in enumerate(data):
        name_en = ex.get("name", "").strip()
        primary = ex.get("primaryMuscles", [])
        equipment_raw = ex.get("equipment")
        level_raw = ex.get("level")
        images = ex.get("images", [])
        instructions = ex.get("instructions", [])

        muscle_group = map_muscle(primary)
        equipment = map_equipment(equipment_raw)
        difficulty = map_level(level_raw)
        photo_path = IMAGE_BASE + images[0] if images else None
        description_en = instructions[0].strip() if instructions else ""

        # Translate name
        print(f"[{i+1}/{len(data)}] Translating: {name_en}")
        name_ru = translate(name_en)

        # Short description — first instruction only, max 200 chars
        if description_en:
            desc_ru = translate(description_en)
            if len(desc_ru) > 200:
                desc_ru = desc_ru[:197] + "..."
        else:
            desc_ru = None

        cur.execute(
            """
            INSERT INTO exercises (id, name, muscle_group, required_equipment, difficulty_level, description, photo_path)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                str(uuid.uuid4()),
                name_ru,
                muscle_group,
                equipment,
                difficulty,
                desc_ru,
                photo_path,
            ),
        )
        inserted += 1

        # Commit in batches of 50
        if inserted % 50 == 0:
            conn.commit()
            print(f"  Committed {inserted} exercises so far...")

        # Small delay to avoid rate limiting on translation API
        time.sleep(0.15)

    conn.commit()
    conn.close()
    print(f"\nDone! Inserted: {inserted}, Skipped: {skipped}")

if __name__ == "__main__":
    main()
