package dto

type GenerateWorkoutRequest struct {
	UserID string `json:"userId"`
}

type CompleteWorkoutRequest struct {
	UserID     string               `json:"userId"`
	WorkoutID  string               `json:"workoutId" binding:"required"`
	Difficulty int                  `json:"difficulty"`
	Exercises  []ExerciseLogRequest `json:"exercises"`
}

type ExerciseLogRequest struct {
	ExerciseID string        `json:"exercise_id"`
	Sets       []SetLogInput `json:"sets"`
}

type SetLogInput struct {
	Reps   int `json:"reps"`
	Weight int `json:"weight"`
}

type WorkoutResponse struct {
	ID        string               `json:"id"`
	UserID    string               `json:"userId"`
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
