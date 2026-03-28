package postgres

import (
	"database/sql"

	_ "github.com/lib/pq"
)

type DB struct {
	Conn *sql.DB
}

func NewDB(connStr string) (*DB, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	return &DB{Conn: db}, nil
}
