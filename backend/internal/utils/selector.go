package utils

import (
	"sort"

	"backend/internal/domain"

	"github.com/google/uuid"
)

// muscleSelectOrder controls fill priority after minimums are met.
// Large compound muscles are prioritised so they always get their full allocation
// before slots are given to isolation muscles.
var muscleSelectOrder = []string{
	"chest", "back", "legs", "glutes", "shoulder", "core",
	"bicep", "tricep", "calves", "full body",
}

// SelectExercisesByMuscleTargets builds a session using per-muscle volume targets
// grounded in RP/Israetel MEV/MAV recommendations:
//
//   - Phase 1: guarantee ≥1 exercise for every muscle in requiredMuscles (uncovered
//     this week) so fullbody sessions collectively hit every muscle group.
//   - Phase 2: satisfy per-session minimums from the split's muscleTargetsBySplit map
//     (e.g. fullbody requires ≥1 chest, ≥1 back, ≥1 legs each session).
//   - Phase 3: fill remaining slots in muscle priority order, respecting per-muscle maxes.
//   - Phase 4: fill any last slots without restriction (no exercise left behind).
func SelectExercisesByMuscleTargets(
	scored []ScoredExercise,
	splitPart string,
	limit int,
	requiredMuscles []string,
) []domain.Exercise {
	targets := muscleTargetsBySplit[splitPart]
	if len(targets) == 0 {
		return SelectTopExercises(scored, limit, 2)
	}
	if limit <= 0 {
		return nil
	}

	ranked := make([]ScoredExercise, len(scored))
	copy(ranked, scored)
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].Score > ranked[j].Score
	})

	picked := make(map[uuid.UUID]bool)
	used := make(map[string]int)
	var result []domain.Exercise

	pickFrom := func(muscle string, max int) {
		for _, ex := range ranked {
			if len(result) >= limit {
				return
			}
			if picked[ex.Exercise.ID] {
				continue
			}
			if ex.Exercise.MuscleGroup != muscle {
				continue
			}
			if used[muscle] >= max {
				return
			}
			result = append(result, ex.Exercise)
			picked[ex.Exercise.ID] = true
			used[muscle]++
		}
	}

	// Phase 1: weekly coverage — muscles not yet hit this week get priority.
	for _, m := range requiredMuscles {
		if len(result) >= limit {
			break
		}
		if used[m] == 0 {
			pickFrom(m, 1)
		}
	}

	// Phase 2: per-session minimums.
	for m, t := range targets {
		for used[m] < t.min && len(result) < limit {
			before := len(result)
			pickFrom(m, t.min)
			if len(result) == before {
				break // no exercises available for this muscle
			}
		}
	}

	// Phase 3: fill remaining slots in priority order up to per-muscle maxes.
	for _, m := range muscleSelectOrder {
		if len(result) >= limit {
			break
		}
		if t, ok := targets[m]; ok {
			pickFrom(m, t.max)
		}
	}

	// Phase 4: fill any leftover slots without restriction.
	for _, ex := range ranked {
		if len(result) >= limit {
			break
		}
		if !picked[ex.Exercise.ID] {
			result = append(result, ex.Exercise)
			picked[ex.Exercise.ID] = true
		}
	}

	return result
}

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
