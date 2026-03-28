package utils

import (
	"backend/internal/domain"
	"sort"
)

func SelectExercises(
	scored []ScoredExercise,
	split SplitType,
	limit int,
) []domain.Exercise {

	var filtered []ScoredExercise
	for _, ex := range scored {
		if MatchSplit(split, ex.Exercise.MuscleGroup) {
			filtered = append(filtered, ex)
		}
	}

	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].Score > filtered[j].Score
	})

	// Diversity (no duplicate muscle spam)
	usedMuscles := make(map[string]bool)
	var result []domain.Exercise

	for _, ex := range filtered {
		if len(result) >= limit {
			break
		}

		if !usedMuscles[ex.Exercise.MuscleGroup] {
			result = append(result, ex.Exercise)
			usedMuscles[ex.Exercise.MuscleGroup] = true
		}
	}

	return result
}
