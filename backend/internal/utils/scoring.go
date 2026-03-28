package utils

import "backend/internal/domain"

type ScoredExercise struct {
	Exercise domain.Exercise
	Score    float64
}

func ScoreExercises(
	exercises []domain.Exercise,
	user domain.User,
) []ScoredExercise {

	var result []ScoredExercise

	for _, ex := range exercises {
		score := 0.0

		if Contains(user.Equipment, ex.RequiredEquipment) {
			score += 3
		}

		if LevelAllowed(user.FitnessLevel, ex.DifficultyLevel) {
			score += 2
		}

		score += goalScore(user.FitnessGoal, ex.MuscleGroup)

		result = append(result, ScoredExercise{
			Exercise: ex,
			Score:    score,
		})
	}

	return result
}

func goalScore(goal domain.Goal, muscle string) float64 {
	switch goal {
	case domain.GoalStrength:
		if muscle == "legs" || muscle == "back" {
			return 2
		}
	case domain.GoalMass:
		return 1.5
	case domain.GoalWeightLoss:
		return 1
	}
	return 0
}
