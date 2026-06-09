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
	ID         uuid.UUID
	UserID     uuid.UUID
	DayIndex   int
	SplitPart  string
	PlannedFor time.Time
	Exercises  []WorkoutExercise
	Status     WorkoutStatus
	CreatedAt  time.Time
}

type WorkoutExercise struct {
	ExerciseID  uuid.UUID `json:"exercise_id,omitempty"`
	Name        string    `json:"name,omitempty"`
	MuscleGroup string    `json:"muscle_group,omitempty"`
	PhotoPath   string    `json:"photo_path,omitempty"`
	Description string    `json:"description,omitempty"`
	Sets        int       `json:"sets,omitempty"`
	Reps        int       `json:"reps,omitempty"`
	Rest        int       `json:"rest,omitempty"`
	Weight      float64   `json:"weight,omitempty"`
	Cycle       int       `json:"cycle,omitempty"`
}
