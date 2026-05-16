package dto

type UpdateUserRequest struct {
	Name         string                  `json:"name"`
	Login        string                  `json:"login"`
	Age          int                     `json:"age"`
	Height       float64                 `json:"height"`
	Weight       float64                 `json:"weight"`
	FitnessLevel string                  `json:"fitnessLevel"`
	FitnessGoal  string                  `json:"fitnessGoal"`
	Frequency    int                     `json:"frequency"`
	Equipment    []string                `json:"equipment"`
	Preferences  *TrainingPreferencesDTO `json:"preferences,omitempty"`
}

type UserResponse struct {
	ID           string                  `json:"id"`
	Name         string                  `json:"name"`
	Login        string                  `json:"login"`
	Age          int                     `json:"age"`
	Height       float64                 `json:"height"`
	Weight       float64                 `json:"weight"`
	FitnessLevel string                  `json:"fitnessLevel"`
	FitnessGoal  string                  `json:"fitnessGoal"`
	Frequency    int                     `json:"frequency"`
	Equipment    []string                `json:"equipment"`
	Preferences  *TrainingPreferencesDTO `json:"preferences,omitempty"`
}

type TrainingPreferencesDTO struct {
	DaysOfWeek []int  `json:"daysOfWeek"`
	Split      string `json:"split"`
	Remember   bool   `json:"remember"`
}
