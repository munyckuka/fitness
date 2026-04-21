package dto

type RegisterRequest struct {
	Name         string   `json:"name"`
	Login        string   `json:"login" binding:"required,min=3"`
	Email        string   `json:"email" binding:"required,email"`
	Password     string   `json:"password" binding:"required,min=8"`
	Age          int      `json:"age"`
	Height       float64  `json:"height"`
	Weight       float64  `json:"weight"`
	FitnessLevel string   `json:"fitnessLevel"`
	FitnessGoal  string   `json:"fitnessGoal"`
	Frequency    int      `json:"frequency"`
	Equipment    []string `json:"equipment"`
}

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

type AuthResponse struct {
	AccessToken  string       `json:"accessToken"`
	RefreshToken string       `json:"refreshToken"`
	User         UserResponse `json:"user"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}

type LogoutRequest struct {
	RefreshToken string `json:"refreshToken" binding:"required"`
}
