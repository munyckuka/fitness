package domain

import (
	"time"

	"github.com/google/uuid"
)

type Credentials struct {
	UserID           uuid.UUID
	Email            string
	PasswordHash     string
	IsEmailVerified  bool
	RefreshTokenHash *string
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

type AuthTokens struct {
	AccessToken  string
	RefreshToken string
}
