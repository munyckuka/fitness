package service

import (
	"backend/internal/domain"
	"backend/internal/dto"
	"context"
)

type WorkoutService interface {
	GenerateWorkout(ctx context.Context, userID string) (domain.Workout, error)
	CompleteWorkout(ctx context.Context, userID string, workoutID string, difficulty int, log domain.WorkoutLog) error
	GetUserWorkouts(ctx context.Context, userID string) ([]domain.Workout, error)
}

type UserService interface {
	Create(ctx context.Context, req dto.UpdateUserRequest) (domain.User, error)
	Update(ctx context.Context, id string, req dto.UpdateUserRequest) (domain.User, error)
	GetByID(ctx context.Context, id string) (domain.User, error)
}

type ProgressService interface {
	GetProgress(ctx context.Context, userID string) (domain.Progress, error)
	UpdateAfterWorkout(ctx context.Context, userID string, difficulty int, log domain.WorkoutLog) error
}
