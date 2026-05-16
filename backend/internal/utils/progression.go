package utils

import "backend/internal/domain"

func CalculateVolume(logs []domain.WorkoutLog) float64 {
	var total float64

	for _, log := range logs {
		for _, ex := range log.Exercises {
			for _, set := range ex.Sets {
				total += float64(set.Reps * int(set.Weight))
			}
		}
	}

	return total
}

func UpdateModifierAdvanced(
	current float64,
	difficulty int,
	fatigue float64,
) float64 {

	// difficulty influence
	if difficulty >= 8 {
		current *= 1.03
	} else if difficulty <= 4 {
		current *= 0.97
	}

	// fatigue correction
	if fatigue > 8000 {
		current *= 0.95
	}

	return current
}
