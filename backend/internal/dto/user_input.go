package dto

import "github.com/google/uuid"

type UserInput struct {
	UserID       uuid.UUID
	FitnessLevel string
	Goal         string
}
