package service

import (
	"backend/internal/domain"
	"backend/internal/dto"
	"context"
	"time"
)

type WorkoutService interface {
	GenerateWorkout(ctx context.Context, userID string, opts GenerateWorkoutOptions) (GenerateWorkoutResult, error)
	CompleteWorkout(ctx context.Context, userID string, workoutID string, difficulty int, log domain.WorkoutLog) error
	GetUserWorkouts(ctx context.Context, userID string) ([]domain.Workout, error)
	ImportSharedWorkout(ctx context.Context, userID string, req dto.ImportSharedWorkoutRequest) (domain.Workout, error)
	ReplaceExercise(ctx context.Context, userID string, workoutID string, oldExerciseID string, newExerciseID string) error
	// ListExercises returns exercises optionally filtered by name query and muscle group.
	ListExercises(ctx context.Context, query string, muscle string, limit int) ([]domain.Exercise, error)
	GenerateWeekWorkouts(ctx context.Context, userID string, startDate time.Time) ([]domain.Workout, error)
}

type GenerateWorkoutOptions struct {
	DayIndex      *int
	Preferences   *domain.TrainingPreferences
	PlannedFor    *time.Time
	SleepHours    int // 0-24, optional
	SleepQuality  int // 1-10, optional
	StressLevel   int // 1-10, optional
}

const WarningOvertraining = "overtraining_detected"

type GenerateWorkoutResult struct {
	Workout domain.Workout
	Warning string
}

type UserService interface {
	Create(ctx context.Context, req dto.UpdateUserRequest) (domain.User, error)
	Update(ctx context.Context, id string, req dto.UpdateUserRequest) (domain.User, error)
	GetByID(ctx context.Context, id string) (domain.User, error)
	SearchByLogin(ctx context.Context, currentUserID string, loginQuery string, limit int) ([]domain.User, error)
}

type AuthService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (dto.AuthResponse, error)
	Login(ctx context.Context, req dto.LoginRequest) (dto.AuthResponse, error)
	Refresh(ctx context.Context, refreshToken string) (dto.AuthResponse, error)
	Logout(ctx context.Context, refreshToken string) error
}

type ProgressService interface {
	GetProgress(ctx context.Context, userID string) (domain.Progress, error)
	UpdateAfterWorkout(ctx context.Context, userID string, difficulty int, log domain.WorkoutLog) error
}

type ChatService interface {
	ListDialogs(ctx context.Context, userID string) ([]domain.ChatDialog, error)
	EnsureDialog(ctx context.Context, userID string, peerUserID string) (domain.ChatDialog, error)
	ListMessages(ctx context.Context, userID string, conversationID string, limit int, beforeMessageID string) ([]domain.ChatMessage, error)
	SendMessage(ctx context.Context, userID string, conversationID string, text string, kind string, metadata []byte) (domain.ChatMessage, error)
	MarkRead(ctx context.Context, userID string, conversationID string, messageID string) error
}
