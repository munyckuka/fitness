package domain

import "github.com/google/uuid"

type Exercise struct {
	ID                uuid.UUID
	Name              string
	Description       string
	PhotoPath         string
	MuscleGroup       string
	RequiredEquipment string
	DifficultyLevel   int
}
