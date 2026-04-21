package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL is required")
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("open database failed: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	var usersTotal int
	if err := db.QueryRow(`SELECT COUNT(*) FROM users`).Scan(&usersTotal); err != nil {
		log.Fatalf("count users failed: %v", err)
	}

	var credentialsTotal int
	if err := db.QueryRow(`SELECT COUNT(*) FROM credentials`).Scan(&credentialsTotal); err != nil {
		log.Fatalf("count credentials failed: %v", err)
	}

	var missingCredentials int
	if err := db.QueryRow(`
		SELECT COUNT(*)
		FROM users u
		LEFT JOIN credentials c ON c.user_id = u.id
		WHERE c.user_id IS NULL
	`).Scan(&missingCredentials); err != nil {
		log.Fatalf("count missing credentials failed: %v", err)
	}

	fmt.Printf("users_total=%d\n", usersTotal)
	fmt.Printf("credentials_total=%d\n", credentialsTotal)
	fmt.Printf("users_without_credentials=%d\n", missingCredentials)
}
