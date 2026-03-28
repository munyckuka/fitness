package dto

type UpdateUserRequest struct {
	Age          int      `json:"age"`
	Height       float64  `json:"height"`
	Weight       float64  `json:"weight"`
	FitnessLevel string   `json:"fitnessLevel"`
	FitnessGoal  string   `json:"fitnessGoal"`
	Frequency    int      `json:"frequency"`
	Equipment    []string `json:"equipment"`
}

type UserResponse struct {
	ID           string   `json:"id"`
	Age          int      `json:"age"`
	Height       float64  `json:"height"`
	Weight       float64  `json:"weight"`
	FitnessLevel string   `json:"fitnessLevel"`
	FitnessGoal  string   `json:"fitnessGoal"`
	Frequency    int      `json:"frequency"`
	Equipment    []string `json:"equipment"`
}
