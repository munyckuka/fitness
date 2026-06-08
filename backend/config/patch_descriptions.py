"""
Patches exercise descriptions in the DB using full instructions from free-exercise-db.
Matches exercises by photo_path (safe to run multiple times — idempotent).
Does NOT delete or recreate exercises, so workout references stay intact.
"""

import os
import time
import requests
import psycopg2
from deep_translator import GoogleTranslator

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("DATABASE_URL env var is not set. Export it before running this script.")
EXERCISES_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

translator = GoogleTranslator(source="en", target="ru")


def translate_safe(text: str, retries: int = 3) -> str:
    """Translate up to 1500 chars. Google Translate limit is ~5000, but 1500 is
    enough to cover all instruction steps while staying safely within the limit."""
    if not text:
        return ""
    chunk = text[:1500]
    for attempt in range(retries):
        try:
            result = translator.translate(chunk)
            return result or text
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                print(f"  [warn] translation failed: {e}")
                return text
    return text


def build_description(instructions: list) -> str:
    """Join all instruction steps into a single coherent paragraph."""
    steps = [s.strip() for s in instructions if s.strip()]
    return " ".join(steps)


def main():
    print("Fetching exercises from free-exercise-db...")
    resp = requests.get(EXERCISES_URL, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    print(f"Loaded {len(data)} source exercises")

    # Build photo_path -> full description (English) lookup
    lookup: dict[str, str] = {}
    for ex in data:
        images = ex.get("images", [])
        instructions = ex.get("instructions", [])
        if not images or not instructions:
            continue
        photo = IMAGE_BASE + images[0]
        lookup[photo] = build_description(instructions)

    print(f"Lookup built for {len(lookup)} exercises with photos + instructions")

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    cur.execute("SELECT id, photo_path FROM exercises WHERE photo_path IS NOT NULL")
    rows = cur.fetchall()
    print(f"Found {len(rows)} exercises in DB with a photo_path\n")

    updated = 0
    no_match = 0

    for i, (ex_id, photo_path) in enumerate(rows):
        desc_en = lookup.get(photo_path)
        if not desc_en:
            no_match += 1
            continue

        print(f"[{i + 1}/{len(rows)}] Translating — {ex_id[:8]}...")
        desc_ru = translate_safe(desc_en)

        cur.execute(
            "UPDATE exercises SET description = %s WHERE id = %s",
            (desc_ru, str(ex_id)),
        )
        updated += 1

        if updated % 20 == 0:
            conn.commit()
            print(f"  Committed {updated} updates so far...")

        # Small delay to stay under Google Translate rate limits
        time.sleep(0.2)

    conn.commit()
    conn.close()
    print(f"\nDone! Updated: {updated}, No match: {no_match}")


if __name__ == "__main__":
    main()
