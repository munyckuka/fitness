package domain

import "github.com/google/uuid"

type ExerciseLog struct {
	ExerciseID uuid.UUID
	Sets       []SetLog
	Difficulty int
	Cycle      int
}

type SetLog struct {
	Reps   int `json:"reps"`
	Weight int `json:"weight"`
}

type WorkoutLog struct {
	ID        uuid.UUID
	WorkoutID uuid.UUID
	UserID    string
	Exercises []ExerciseLog
	Timestamp int64
}
