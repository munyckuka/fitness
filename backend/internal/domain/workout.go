package domain

import (
	"time"

	"github.com/google/uuid"
)

type WorkoutStatus string

const (
	Created    WorkoutStatus = "created"
	InProgress WorkoutStatus = "in_progress"
	Completed  WorkoutStatus = "completed"
	Partial    WorkoutStatus = "partial"
)

type Workout struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	Exercises []WorkoutExercise
	Status    WorkoutStatus
	CreatedAt time.Time
}

type WorkoutExercise struct {
	ExerciseID  uuid.UUID
	Name        string
	MuscleGroup string
	Sets        int
	Reps        int
	Rest        int
	Weight      float64
	Cycle       int
}
