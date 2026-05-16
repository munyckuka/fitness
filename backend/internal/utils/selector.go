package utils

import (
	"sort"

	"backend/internal/domain"

	"github.com/google/uuid"
)

// SelectTopExercises ranks scored exercises and returns the top `limit`,
// capping any single muscle group at maxPerMuscle. Pre-filter scored by
// split/recovery before calling this.
func SelectTopExercises(scored []ScoredExercise, limit int, maxPerMuscle int) []domain.Exercise {
	if limit <= 0 {
		return nil
	}
	if maxPerMuscle <= 0 {
		maxPerMuscle = 2
	}

	ranked := make([]ScoredExercise, len(scored))
	copy(ranked, scored)
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Score > ranked[j].Score
	})

	used := make(map[string]int)
	result := make([]domain.Exercise, 0, limit)

	for _, ex := range ranked {
		if len(result) >= limit {
			break
		}
		if used[ex.Exercise.MuscleGroup] >= maxPerMuscle {
			continue
		}
		result = append(result, ex.Exercise)
		used[ex.Exercise.MuscleGroup]++
	}

	// If diversity cap left us short, fill remaining slots ignoring the cap.
	if len(result) < limit {
		taken := make(map[uuid.UUID]struct{}, len(result))
		for _, ex := range result {
			taken[ex.ID] = struct{}{}
		}
		for _, ex := range ranked {
			if len(result) >= limit {
				break
			}
			if _, ok := taken[ex.Exercise.ID]; ok {
				continue
			}
			result = append(result, ex.Exercise)
		}
	}

	return result
}
