package dto

type ProgressResponse struct {
	UserID        string               `json:"userId"`
	Completed     int                  `json:"completedWorkouts"`
	AvgDifficulty float64              `json:"avgDifficulty"`
	WorkoutDates  []string             `json:"workoutDates"`
	WeightHistory []WeightHistoryPoint `json:"weightHistory"`
}

type WeightHistoryPoint struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}
