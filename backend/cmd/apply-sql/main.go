package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

func main() {
	sqlFile := flag.String("file", "", "Path to SQL file")
	flag.Parse()

	if *sqlFile == "" {
		log.Fatal("-file is required")
	}

	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL is required")
	}

	content, err := os.ReadFile(*sqlFile)
	if err != nil {
		log.Fatalf("read SQL file failed: %v", err)
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("open database failed: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	if _, err := db.Exec(string(content)); err != nil {
		log.Fatalf("execute SQL failed: %v", err)
	}

	fmt.Printf("applied SQL file: %s\n", *sqlFile)
}
