package domain

import "github.com/google/uuid"

type Progress struct {
	UserID            uuid.UUID
	TotalVolume       float64
	WorkoutsCompleted int
	AvgDifficulty     float64
	Modifier          float64
	WorkoutDates      []string
	WeightHistory     []WeightHistoryPoint

	FatigueScore float64
	LastWorkout  int64
}

type WeightHistoryPoint struct {
	Label string
	Value float64
}
