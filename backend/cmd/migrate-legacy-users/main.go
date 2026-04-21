package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

const legacyPassword = "123"

func main() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		host := getenv("DB_HOST", "localhost")
		port := getenv("DB_PORT", "5433")
		user := getenv("DB_USER", "postgres")
		password := getenv("DB_PASSWORD", "123456")
		name := getenv("DB_NAME", "workoutdb")
		connStr = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, name)
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	rows, err := db.Query(`
		SELECT u.id
		FROM users u
		LEFT JOIN credentials c ON c.user_id = u.id
		WHERE c.user_id IS NULL
	`)
	if err != nil {
		log.Fatalf("load legacy users failed: %v", err)
	}
	defer rows.Close()

	hashBytes, err := bcrypt.GenerateFromPassword([]byte(legacyPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("hash generation failed: %v", err)
	}

	passwordHash := string(hashBytes)
	migrated := 0

	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			log.Fatalf("scan user id failed: %v", err)
		}

		email := fmt.Sprintf("%s@legacy.local", userID)

		_, err := db.Exec(`
			INSERT INTO credentials (
				user_id,
				email,
				password_hash,
				is_email_verified,
				refresh_token_hash,
				created_at,
				updated_at
			)
			VALUES ($1, $2, $3, FALSE, NULL, $4, $4)
		`, userID, email, passwordHash, time.Now())
		if err != nil {
			log.Fatalf("insert credentials failed for user %s: %v", userID, err)
		}

		migrated++
	}

	if err := rows.Err(); err != nil {
		log.Fatalf("legacy users iteration failed: %v", err)
	}

	log.Printf("legacy credentials migration complete. migrated=%d default_password=%q", migrated, legacyPassword)
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
