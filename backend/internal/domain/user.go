package domain

import "github.com/google/uuid"

type Goal string

const (
	GoalStrength   Goal = "strength"
	GoalMass       Goal = "mass"
	GoalWeightLoss Goal = "weight_loss"
)

type User struct {
	ID           uuid.UUID
	Age          int
	Height       float64
	Weight       float64
	FitnessGoal  Goal
	FitnessLevel string
	Frequency    int
	Equipment    []string
}
