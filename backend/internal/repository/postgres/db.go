package postgres

import (
	"database/sql"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
)

func NewDB(connStr string) (*sql.DB, error) {
	config, err := pgx.ParseConfig(connStr)
	if err != nil {
		return nil, err
	}
	// Simple protocol avoids prepared statements entirely, which is required
	// when running behind PgBouncer in transaction mode (e.g. Neon pooler).
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
	return stdlib.OpenDB(*config), nil
}
