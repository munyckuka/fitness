package repository

import (
	"backend/internal/domain"
	"context"
	"errors"

	"github.com/google/uuid"
)

var ErrCredentialsNotFound = errors.New("credentials not found")
var ErrUserNotFound = errors.New("user not found")

type LogRepository interface {
	Save(ctx context.Context, log domain.WorkoutLog) error
	GetByUser(ctx context.Context, userID string) ([]domain.WorkoutLog, error)
}

type ProgressRepository interface {
	GetModifier(ctx context.Context, userID string) (float64, error)
	UpdateModifier(ctx context.Context, userID string, modifier float64) error
	GetByUser(ctx context.Context, userID string) (domain.Progress, error)
	Update(ctx context.Context, p domain.Progress) error
}

type UserRepository interface {
	GetByID(ctx context.Context, id string) (domain.User, error)
	GetByLogin(ctx context.Context, login string) (domain.User, error)
	Create(ctx context.Context, user domain.User) (domain.User, error)
	Update(ctx context.Context, user domain.User) (domain.User, error)
}

type CredentialsRepository interface {
	Create(ctx context.Context, credentials domain.Credentials) error
	GetByEmail(ctx context.Context, email string) (domain.Credentials, error)
	GetByIdentifier(ctx context.Context, identifier string) (domain.Credentials, error)
	GetByUserID(ctx context.Context, userID uuid.UUID) (domain.Credentials, error)
	UpdateRefreshTokenHash(ctx context.Context, userID uuid.UUID, refreshTokenHash *string) error
}

type WorkoutRepository interface {
	Save(ctx context.Context, w domain.Workout) error
	GetByID(ctx context.Context, id uuid.UUID) (domain.Workout, error)
	GetByUser(ctx context.Context, userID string) ([]domain.Workout, error)
	Update(ctx context.Context, w domain.Workout) error
	UpdateStatus(ctx context.Context, id string, status domain.WorkoutStatus) error
}

type ExerciseRepository interface {
	GetAll(ctx context.Context) ([]domain.Exercise, error)
}
