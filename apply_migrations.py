#!/usr/bin/env python3
import psycopg2
import sys

# Connection string
conn_str = "postgresql://neondb_owner:npg_LtRS6xgp3qnF@ep-delicate-breeze-alm92i82-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Read SQL script
with open("regenerate_exercises.sql", "r", encoding="utf-8") as f:
    sql_script = f.read()

try:
    print("Connecting to database...")
    conn = psycopg2.connect(conn_str)
    conn.autocommit = False
    cursor = conn.cursor()

    print("Executing migration script...")
    cursor.execute(sql_script)

    # Get result if any
    if cursor.description is not None:
        result = cursor.fetchall()
        for row in result:
            print(row)

    # Commit transaction
    conn.commit()
    print("Migration completed successfully!")

    # Verify results
    cursor.execute("SELECT COUNT(*) as total_exercises FROM public.exercises;")
    count = cursor.fetchone()[0]
    print(f"Total exercises in database: {count}")

    cursor.execute("SELECT COUNT(*) as backup_count FROM public.backup_exercises;")
    backup_count = cursor.fetchone()[0]
    print(f"Backed up exercises: {backup_count}")

    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)


