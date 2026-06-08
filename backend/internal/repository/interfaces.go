package repository

import (
	"backend/internal/domain"
	"context"
	"errors"
	"time"

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
	SearchByLogin(ctx context.Context, currentUserID string, loginQuery string, limit int) ([]domain.User, error)
	Create(ctx context.Context, user domain.User) (domain.User, error)
	Update(ctx context.Context, user domain.User) (domain.User, error)
	UpsertPreferences(ctx context.Context, prefs domain.TrainingPreferences) error
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
	GetByUserBetween(ctx context.Context, userID string, from time.Time, to time.Time) ([]domain.Workout, error)
	Update(ctx context.Context, w domain.Workout) error
	UpdateStatus(ctx context.Context, id string, status domain.WorkoutStatus) error
	ReplaceExercise(ctx context.Context, workoutID string, oldExerciseID string, newExerciseID string) error
	Delete(ctx context.Context, workoutID string, userID string) error
	// DeletePendingInRange removes non-completed workouts in [from, to) for a user,
	// leaving completed workouts (and their logs) intact.
	DeletePendingInRange(ctx context.Context, userID string, from time.Time, to time.Time) error
}

type ExerciseRepository interface {
	GetAll(ctx context.Context) ([]domain.Exercise, error)
}

type ChatRepository interface {
	ListDialogs(ctx context.Context, userID uuid.UUID) ([]domain.ChatDialog, error)
	GetOrCreateDialog(ctx context.Context, userID uuid.UUID, peerUserID uuid.UUID) (domain.ChatDialog, error)
	ListMessages(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, limit int, beforeMessageID *uuid.UUID) ([]domain.ChatMessage, error)
	SaveMessage(ctx context.Context, conversationID uuid.UUID, senderID uuid.UUID, text string, kind string, metadata []byte) (domain.ChatMessage, error)
	MarkReadUpTo(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, messageID uuid.UUID) error
	GetLatestMessageID(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (uuid.UUID, error)
	GetDialogParticipantIDs(ctx context.Context, conversationID uuid.UUID) ([]uuid.UUID, error)
}
