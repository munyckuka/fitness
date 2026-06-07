package utils

import (
	"sort"

	"backend/internal/domain"
)

var pplSplit = []string{"push", "pull", "legs"}

var ulSplit = []string{"upper", "lower"}

var splitMuscles = map[string][]string{
	"push":     {"chest", "shoulders", "triceps"},
	"pull":     {"back", "biceps"},
	"legs":     {"legs", "calves", "glutes", "core"},
	"upper":    {"chest", "back", "shoulders", "biceps", "triceps", "core"},
	"lower":    {"legs", "calves", "glutes", "core"},
	"fullbody": {"chest", "back", "legs", "shoulders", "biceps", "triceps", "calves", "glutes", "core", "full body"},
}

// ResolveSplitPart returns the split part (push/pull/legs/upper/lower/fullbody)
// for the user's `rotationIndex`-th training day in their weekly rotation.
// `rotationIndex` is NOT the weekday — it is the position of that day in
// `prefs.DaysOfWeek`. Use ResolveRotationIndex to compute it.
func ResolveSplitPart(split domain.SplitType, rotationIndex int) string {
	switch split {

	case domain.SplitPPL:
		return pplSplit[((rotationIndex%len(pplSplit))+len(pplSplit))%len(pplSplit)]

	case domain.SplitUpperLower:
		return ulSplit[((rotationIndex%len(ulSplit))+len(ulSplit))%len(ulSplit)]

	default:
		return "fullbody"
	}
}

// ResolveRotationIndex maps a calendar weekday (0..6) to the user's rotation
// slot. If dayIndex is one of the user's training days, returns its position
// in the sorted training-day list. Otherwise returns the number of training
// days that precede it in the week (so a "shifted" day still gets a sensible
// split — e.g. training Tue instead of usual Wed keeps you on the second slot).
func ResolveRotationIndex(dayIndex int, daysOfWeek []int) int {
	if len(daysOfWeek) == 0 {
		return 0
	}
	sorted := NormalizeDaysOfWeek(daysOfWeek)
	for i, d := range sorted {
		if d == dayIndex {
			return i
		}
	}
	count := 0
	for _, d := range sorted {
		if d < dayIndex {
			count++
		}
	}
	return count
}

// NormalizeDaysOfWeek returns a sorted slice of unique values in [0,6].
// Useful for both validating user input and producing a stable order
// for rotation logic.
func NormalizeDaysOfWeek(days []int) []int {
	seen := make(map[int]struct{}, len(days))
	out := make([]int, 0, len(days))
	for _, d := range days {
		if d < 0 || d > 6 {
			continue
		}
		if _, dup := seen[d]; dup {
			continue
		}
		seen[d] = struct{}{}
		out = append(out, d)
	}
	sort.Ints(out)
	return out
}

func GetMusclesForSplit(splitPart string) []string {
	return splitMuscles[splitPart]
}

func FilterByMuscles(exercises []domain.Exercise, muscles []string) []domain.Exercise {
	if len(muscles) == 0 {
		return exercises
	}

	allowed := make(map[string]struct{}, len(muscles))
	for _, m := range muscles {
		allowed[m] = struct{}{}
	}

	filtered := make([]domain.Exercise, 0, len(exercises))
	for _, ex := range exercises {
		if _, ok := allowed[ex.MuscleGroup]; ok {
			filtered = append(filtered, ex)
		}
	}
	return filtered
}

func MinRestDaysForSplit(split domain.SplitType, frequency int) int {
	switch split {
	case domain.SplitPPL:
		if frequency >= 5 {
			return 2
		}
		return 3
	case domain.SplitUpperLower:
		return 2
	default:
		return 1
	}
}
