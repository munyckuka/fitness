package domain

import "github.com/google/uuid"

type ExerciseLog struct {
	ExerciseID  uuid.UUID
	Sets        []SetLog
	Difficulty  int
	Cycle       int
	RPE         int `json:"rpe"` // Rate of Perceived Exertion (1-10)
	FormQuality int `json:"formQuality"` // 1-5 scale
}

type SetLog struct {
	Reps   int `json:"reps"`
	Weight int `json:"weight"`
	RPE    int `json:"rpe"` // RPE for this specific set (1-10)
}

type WorkoutLog struct {
	ID           uuid.UUID
	WorkoutID    uuid.UUID
	UserID       uuid.UUID
	Exercises    []ExerciseLog
	Timestamp    int64
	SleepHours   int `json:"sleepHours"` // Hours slept before workout
	SleepQuality int `json:"sleepQuality"` // 1-10 scale
	StressLevel  int `json:"stressLevel"` // 1-10 scale
}

// RecoveryMetrics tracked daily
type RecoveryMetrics struct {
	UserID       uuid.UUID
	Date         int64 // Unix timestamp of the day
	SleepHours   int
	SleepQuality int // 1-10
	StressLevel  int // 1-10
	Soreness     int // 1-10 DOMS rating
}


