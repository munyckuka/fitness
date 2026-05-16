package utils

import (
	"time"

	"backend/internal/domain"

	"github.com/google/uuid"
)

// FilterByRecovery removes exercises whose muscle group was trained within
// the last minRestDays. Pure function — no DB calls.
func FilterByRecovery(
	exercises []domain.Exercise,
	logs []domain.WorkoutLog,
	exIDToMuscle map[uuid.UUID]string,
	minRestDays int,
	now time.Time,
) []domain.Exercise {

	if minRestDays <= 0 || len(logs) == 0 {
		return exercises
	}

	minRestSec := int64(minRestDays) * 24 * 3600
	nowUnix := now.Unix()

	lastByMuscle := make(map[string]int64)
	for _, log := range logs {
		for _, ex := range log.Exercises {
			muscle, ok := exIDToMuscle[ex.ExerciseID]
			if !ok || muscle == "" {
				continue
			}
			if log.Timestamp > lastByMuscle[muscle] {
				lastByMuscle[muscle] = log.Timestamp
			}
		}
	}

	filtered := make([]domain.Exercise, 0, len(exercises))
	for _, ex := range exercises {
		last, seen := lastByMuscle[ex.MuscleGroup]
		if !seen {
			filtered = append(filtered, ex)
			continue
		}
		if nowUnix-last >= minRestSec {
			filtered = append(filtered, ex)
		}
	}
	return filtered
}
