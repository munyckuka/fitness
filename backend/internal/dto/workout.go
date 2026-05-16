package dto

type GenerateWorkoutRequest struct {
	UserID       string                  `json:"userId"`
	DayIndex     *int                    `json:"dayIndex,omitempty"`
	Preferences  *TrainingPreferencesDTO `json:"preferences,omitempty"`
	SleepHours   int                     `json:"sleepHours,omitempty"`
	SleepQuality int                     `json:"sleepQuality,omitempty"`
	StressLevel  int                     `json:"stressLevel,omitempty"`
}

type GenerateWorkoutResponse struct {
	Workout      WorkoutResponse `json:"workout"`
	Warning      string          `json:"warning,omitempty"`
	RecoveryHint string          `json:"recoveryHint,omitempty"`
}

type GenerateWeekWorkoutsRequest struct {
	StartDate string `json:"startDate" binding:"required"`
}

// ...existing code...

type ExerciseLogRequest struct {
	ExerciseID  string        `json:"exercise_id"`
	Sets        []SetLogInput `json:"sets"`
	RPE         int           `json:"rpe,omitempty"`
	FormQuality int           `json:"formQuality,omitempty"`
}

type SetLogInput struct {
	Reps   int `json:"reps"`
	Weight int `json:"weight"`
	RPE    int `json:"rpe,omitempty"` // Rate of Perceived Exertion (1-10)
}

type CompleteWorkoutRequest struct {
	UserID       string               `json:"userId"`
	WorkoutID    string               `json:"workoutId" binding:"required"`
	Difficulty   int                  `json:"difficulty"`
	Exercises    []ExerciseLogRequest `json:"exercises"`
	SleepHours   int                  `json:"sleepHours,omitempty"`
	SleepQuality int                  `json:"sleepQuality,omitempty"`
	StressLevel  int                  `json:"stressLevel,omitempty"`
}

type WorkoutResponse struct {
	ID        string               `json:"id"`
	UserID    string               `json:"userId"`
	DayIndex  int                  `json:"dayIndex"`
	SplitPart string               `json:"splitPart"`
	Status    string               `json:"status"`
	Exercises []WorkoutExerciseDTO `json:"exercises"`
}

type WorkoutExerciseDTO struct {
	ExerciseID  string  `json:"exerciseId"`
	Name        string  `json:"name"`
	MuscleGroup string  `json:"muscleGroup"`
	Sets        int     `json:"sets"`
	Reps        int     `json:"reps"`
	Rest        int     `json:"rest"`
	Weight      float64 `json:"weight"`
}

type ImportSharedWorkoutRequest struct {
	Exercises []ImportSharedWorkoutExerciseRequest `json:"exercises" binding:"required"`
}

type ImportSharedWorkoutExerciseRequest struct {
	ExerciseID string  `json:"exerciseId" binding:"required"`
	Sets       int     `json:"sets"`
	Reps       int     `json:"reps"`
	Rest       int     `json:"rest"`
	Weight     float64 `json:"weight"`
}

type ReplaceExerciseRequest struct {
	NewExerciseID string `json:"newExerciseId" binding:"required"`
}
