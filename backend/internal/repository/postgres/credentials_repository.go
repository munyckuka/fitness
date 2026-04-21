package postgres

import (
	"backend/internal/domain"
	"backend/internal/repository"
	"context"
	"database/sql"
	"errors"
	"strings"

	"github.com/google/uuid"
)

type CredentialsRepository struct {
	db *sql.DB
}

func NewCredentialsRepository(db *sql.DB) *CredentialsRepository {
	return &CredentialsRepository{db: db}
}

func (r *CredentialsRepository) Create(ctx context.Context, credentials domain.Credentials) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO credentials (
			user_id,
			email,
			password_hash,
			is_email_verified,
			refresh_token_hash
		)
		VALUES ($1, $2, $3, $4, $5)
	`, credentials.UserID, strings.ToLower(strings.TrimSpace(credentials.Email)), credentials.PasswordHash, credentials.IsEmailVerified, credentials.RefreshTokenHash)

	return err
}

func (r *CredentialsRepository) GetByEmail(ctx context.Context, email string) (domain.Credentials, error) {
	var credentials domain.Credentials
	var refreshTokenHash sql.NullString

	err := r.db.QueryRowContext(ctx, `
		SELECT user_id, email, password_hash, is_email_verified, refresh_token_hash, created_at, updated_at
		FROM credentials
		WHERE email = $1
	`, strings.ToLower(strings.TrimSpace(email))).Scan(
		&credentials.UserID,
		&credentials.Email,
		&credentials.PasswordHash,
		&credentials.IsEmailVerified,
		&refreshTokenHash,
		&credentials.CreatedAt,
		&credentials.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Credentials{}, repository.ErrCredentialsNotFound
		}
		return domain.Credentials{}, err
	}

	if refreshTokenHash.Valid {
		credentials.RefreshTokenHash = &refreshTokenHash.String
	}

	return credentials, nil
}

func (r *CredentialsRepository) GetByIdentifier(ctx context.Context, identifier string) (domain.Credentials, error) {
	normalized := strings.ToLower(strings.TrimSpace(identifier))

	var credentials domain.Credentials
	var refreshTokenHash sql.NullString

	err := r.db.QueryRowContext(ctx, `
		SELECT c.user_id, c.email, c.password_hash, c.is_email_verified, c.refresh_token_hash, c.created_at, c.updated_at
		FROM credentials c
		JOIN users u ON u.id = c.user_id
		WHERE LOWER(c.email) = $1 OR LOWER(u.login) = $1
		LIMIT 1
	`, normalized).Scan(
		&credentials.UserID,
		&credentials.Email,
		&credentials.PasswordHash,
		&credentials.IsEmailVerified,
		&refreshTokenHash,
		&credentials.CreatedAt,
		&credentials.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Credentials{}, repository.ErrCredentialsNotFound
		}
		return domain.Credentials{}, err
	}

	if refreshTokenHash.Valid {
		credentials.RefreshTokenHash = &refreshTokenHash.String
	}

	return credentials, nil
}

func (r *CredentialsRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (domain.Credentials, error) {
	var credentials domain.Credentials
	var refreshTokenHash sql.NullString

	err := r.db.QueryRowContext(ctx, `
		SELECT user_id, email, password_hash, is_email_verified, refresh_token_hash, created_at, updated_at
		FROM credentials
		WHERE user_id = $1
	`, userID).Scan(
		&credentials.UserID,
		&credentials.Email,
		&credentials.PasswordHash,
		&credentials.IsEmailVerified,
		&refreshTokenHash,
		&credentials.CreatedAt,
		&credentials.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.Credentials{}, repository.ErrCredentialsNotFound
		}
		return domain.Credentials{}, err
	}

	if refreshTokenHash.Valid {
		credentials.RefreshTokenHash = &refreshTokenHash.String
	}

	return credentials, nil
}

func (r *CredentialsRepository) UpdateRefreshTokenHash(ctx context.Context, userID uuid.UUID, refreshTokenHash *string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE credentials
		SET refresh_token_hash = $1,
		    updated_at = NOW()
		WHERE user_id = $2
	`, refreshTokenHash, userID)

	return err
}
