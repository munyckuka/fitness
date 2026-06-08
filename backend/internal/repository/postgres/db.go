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
	// QueryExecModeExec uses the extended protocol without caching prepared
	// statements (Parse→Bind→Execute→Sync, no Describe or intermediate Sync).
	// This keeps server-side parameterized queries (SQL-injection safe) while
	// being fully compatible with PgBouncer transaction mode (Neon pooler).
	config.DefaultQueryExecMode = pgx.QueryExecModeExec
	return stdlib.OpenDB(*config), nil
}
