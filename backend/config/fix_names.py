"""
Fix exercise name quality issues:
  1. Applies manual corrections for clearly wrong translations.
  2. Fixes capitalization of names starting with lowercase.
  3. Removes stray '!' suffixes.
  4. Matches exercises by photo_path to know original English name.

Idempotent — safe to re-run.
"""

import io
import os
import sys
import time
import requests
import psycopg2
from deep_translator import GoogleTranslator

# Force UTF-8 output so Russian chars don't crash on cp1251 terminals
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("Set DATABASE_URL env var first")

EXERCISES_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"

translator = GoogleTranslator(source="en", target="ru")

# ──────────────────────────────────────────────────────────────────────────────
# Manual corrections: original English name → correct Russian
# These override automatic translation for exercises with known bad results.
# ──────────────────────────────────────────────────────────────────────────────
MANUAL = {
    # meaning was completely lost in translation
    "Dead Bug":                              "Мёртвый жук",
    "Inverted Row":                          "Обратная тяга",
    "Clean and Press":                       "Взятие на грудь и жим",
    "Clean and Snatch":                      "Взятие на грудь и рывок",
    "Stomach Vacuum":                        "Вакуум живота",
    "Drag Curl":                             "Тяговое сгибание рук",
    "Pull Through":                          "Тяга через ноги",
    "Kettlebell Figure 8":                   "Гиря восьмёрка",
    "Landmine 180s":                         "Наземная мина 180°",
    "Ring Dips":                             "Отжимания на кольцах",
    "Push Press":                            "Жим с подседом",
    "Butt Kicks":                            "Захлёсты голени",
    "Inchworm":                              "Дюймовый червь",
    "Muscle Snatch":                         "Мышечный рывок",
    "Snatch":                                "Рывок штанги",
    "Power Snatch":                          "Силовой рывок",
    "Hang Snatch":                           "Рывок с виса",
    "Snatch Balance":                        "Рывковый баланс",
    "Snatch Pull":                           "Рывковая тяга",
    "Split Snatch":                          "Рывок в ножницы",
    "Clean":                                 "Взятие на грудь",
    "Power Clean":                           "Силовое взятие на грудь",
    "Hang Clean":                            "Взятие на грудь с виса",
    "Split Clean":                           "Взятие на грудь в ножницы",
    "Clean Pull":                            "Тяга толчковая",
    "Clean Deadlift":                        "Становая тяга к взятию на грудь",
    "Clean from Blocks":                     "Взятие на грудь от блоков",
    "Power Clean from Blocks":               "Силовое взятие на грудь от блоков",
    "Hang Power Clean":                      "Силовое взятие на грудь с виса",
    "Double Kettlebell, Alternating Hang Clean": "Двойная гиря, попеременное взятие с виса",
    "Kettlebell Dead Clean":                 "Гиря взятие на грудь с пола",
    "Sled Drag - Harness":                   "Тяга саней — упряжь",
    "Shotgun Row":                           "Тяга дробовика",
    "Gironda Sternum Chins":                 "Подтягивания Жиронда к грудине",
    "Elevated Cable Rows":                   "Тяга верхнего блока",
    "Use Lat Row":                           "Тяга вертикального блока",
    "Use Iso-Row":                           "Изотяга",
    "Rack Delivery":                         "Опускание в стойку",
    "Tate Press":                            "Тейт-жим",
    "JM Press":                              "JM-жим",
    "See-Saw Press":                         "Попеременный жим (See-Saw)",
    "Band Good Morning":                     "Доброе утро с резинкой",
    "Band Good Morning (Pullthrough)":       "Доброе утро с резинкой (тяга)",
    "Good Morning":                          "Доброе утро",
    "Keg Load":                              "Подъём бочонка",
    "Atlas Stones":                          "Камни Атласа",
    "Atlas Stone Trainer":                   "Тренажёр с камнем Атласа",
    "Hack Squat":                            "Гакк-приседания",
    "Hack Squat with Narrow Stance":         "Гакк-приседания узкая стойка",
    "Barbell Hack Squat":                    "Гакк-приседания со штангой",
    "Jefferson Squat":                       "Приседания Джефферсона",
    "Zercher Squat":                         "Приседания Зерхера",
    "Frankenstein Squat":                    "Приседания Франкенштейна",
    "Groiners":                              "Растяжка паха в движении",
    "Barrier Hop":                           "Прыжок через барьер",
    "Drop Push":                             "Падающее отжимание",
    "Power Parts":                           "Силовые части",
    "Circus Bell":                           "Цирковой гриф",
    "Spider Curl":                           "Сгибание паука",
    "Rickshaw Carry":                        "Переноска на рикше",
    "Plate Pinch":                           "Захват диска щипком",
    "Farmer's Walk":                         "Прогулка фермера",
    "Otis-Up":                               "Отис-ап",
    "Pallof Press":                          "Жим Паллофа",
    "Pallof Press With Rotation":            "Жим Паллофа с поворотом",
    "Windmill":                              "Ветряная мельница",
    "Windmill Kettlebell":                   "Ветряная мельница с гирей",
    "Advanced Kettlebell Windmill":          "Ветряная мельница с гирей (продвинутый)",
    "Double Kettlebell Windmill":            "Двойная ветряная мельница с гирями",
    "Barbell Ab Rollout":                    "Выкатывание штанги для пресса",
    "Barbell Ab Rollout - On Knees":         "Выкатывание штанги для пресса на коленях",
    "Ab Roller":                             "Ролик для пресса",
    "Cable Crunch":                          "Кранч на тросе",
    "Cable Russian Twists":                  "Русские скручивания на тросе",
    "Twisting Crunch":                       "Скручивание с поворотом",
    "Sledgehammer Swings":                   "Удары кувалдой",
    "Janda Sit-Up":                          "Подъём Янда",
    "Bosu Ball Crunch with Side Bends":      "Кранч на Босу с боковыми наклонами",
    "Tire Flip":                             "Переворот шины",
    "Sandbag Load":                          "Подъём мешка с песком",
    "Renegade Row":                          "Тяга в упоре (Renegade Row)",
    "High Pull":                             "Тяга к подбородку",
    "Sumo High Pull":                        "Тяга сумо к подбородку",
    "IT Band and Glute Stretch":             "Растяжка ИТ-тракта и ягодиц",
    "Piriformis-SMR":                        "Пириформис-SMR",
    "Looking at the Ceiling":                "Взгляд в потолок (упражнение)",
    "Reverse Hyperextension":                "Обратная гиперэкстензия",
    "Hip Abduction with Band":               "Отведение бедра с лентой",
    "Hip Thrusts":                           "Тазобедренный толчок",
    "Barbell Hip Thrust":                    "Тазобедренный толчок со штангой",
    "Ab Crunch Machine":                     "Тренажёр для пресса",
    "Boxing":                                "Бокс",
    "Plank":                                 "Планка",
    "Body-Up":                               "Боди-ап",
    "Bradford / Rocky Press":                "Брэдфорд / Рокки жим",
    "Standing Bradford Press":               "Стоячий жим Брэдфорда",
    "EZ-Bar Skullcrusher":                   "Французский жим EZ-штанга",
    "Decline EZ Bar Skullcrusher":           "Французский жим EZ-штанга на наклоне",
    "Band Skullcrusher":                     "Французский жим с лентой",
    "Tip Press":                             "Тейт-жим",
    "Speed Bag":                             "Скоростная груша",
    "Stairmaster":                           "Лестничный тренажёр",
    "Powered Stairs":                        "Электролестница",
}

# ──────────────────────────────────────────────────────────────────────────────
# Regex-based automatic fixes applied to every name
# ──────────────────────────────────────────────────────────────────────────────
import re

REPLACEMENTS = [
    # "Используйте ..." → re-translate (handled separately)
    # Remove stray "!" at end
    (re.compile(r"!$"), ""),
    # Double "Боковой Боковой" → "Боковой" (Side Side Lateral → Side Lateral)
    (re.compile(r"^Боковой Боковой\b"), "Боковой"),
    # "Группа «..." → "С лентой «..." (Band exercises mistranslated as "Group")
    (re.compile(r"^Группа\s+«"), "С лентой «"),
    (re.compile(r"^Группа «"), "С лентой «"),
    (re.compile(r"\(Пройти\)"), "(тяга)"),
]


def apply_regex_fixes(name: str) -> str:
    for pattern, replacement in REPLACEMENTS:
        name = pattern.sub(replacement, name)
    # Capitalize first letter
    if name and name[0].islower():
        name = name[0].upper() + name[1:]
    return name.strip()


def translate_safe(text: str, retries: int = 3) -> str:
    if not text:
        return text
    for attempt in range(retries):
        try:
            return translator.translate(text[:1500]) or text
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                print(f"  [warn] translate failed: {e}")
                return text
    return text


def main():
    print("Fetching source exercises...")
    resp = requests.get(EXERCISES_URL, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    # photo_path → original English name
    photo_to_en: dict[str, str] = {}
    for ex in data:
        images = ex.get("images", [])
        if images:
            photo_to_en[IMAGE_BASE + images[0]] = ex.get("name", "")

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT id, name, photo_path FROM exercises")
    rows = cur.fetchall()
    print(f"Loaded {len(rows)} exercises from DB\n")

    updated = 0

    for ex_id, current_name, photo_path in rows:
        new_name = current_name
        source = ""

        # 1. Try manual correction via original English name
        en_name = photo_to_en.get(photo_path or "")
        if en_name and en_name in MANUAL:
            new_name = MANUAL[en_name]
            source = f"manual({en_name})"

        # 2. Detect names that are clearly command-verbs (bad auto-translate artifact)
        elif current_name and current_name.split()[0] in ("Используйте", "Очистите", "Перетащите", "Повесьте"):
            if en_name:
                new_name = translate_safe(en_name)
                source = f"retranslated({en_name})"

        # 3. Apply regex fixes to the (possibly already corrected) name
        fixed = apply_regex_fixes(new_name)
        if fixed != new_name:
            source = source or "regex"
            new_name = fixed

        if new_name != current_name:
            cur.execute("UPDATE exercises SET name = %s WHERE id = %s", (new_name, str(ex_id)))
            updated += 1
            label = source or "?"
            print(f"  [{label}] {current_name!r:55s} -> {new_name!r}")

    conn.commit()
    conn.close()
    print(f"\nDone! Fixed {updated} exercise names.")


if __name__ == "__main__":
    main()
