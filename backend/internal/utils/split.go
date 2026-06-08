package utils

import (
	"sort"

	"backend/internal/domain"
)

var pplSplit = []string{"push", "pull", "legs"}

var ulSplit = []string{"upper", "lower"}

var splitMuscles = map[string][]string{
	"push":     {"chest", "shoulder", "tricep"},
	"pull":     {"back", "bicep"},
	"legs":     {"legs", "calves", "glutes", "core"},
	"upper":    {"chest", "back", "shoulder", "bicep", "tricep", "core"},
	"lower":    {"legs", "calves", "glutes", "core"},
	"fullbody": {"chest", "back", "legs", "shoulder", "bicep", "tricep", "calves", "glutes", "core", "full body"},
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

// AutoSplitFromFrequency returns the optimal split type for a given weekly
// training frequency: 1-2→fullbody, 3→PPL, 4+→upper/lower.
func AutoSplitFromFrequency(freq int) domain.SplitType {
	switch {
	case freq == 3:
		return domain.SplitPPL
	case freq >= 4:
		return domain.SplitUpperLower
	default:
		return domain.SplitFullBody
	}
}

// DefaultDaysForFrequency returns day offsets from startDate that evenly
// space freq training sessions across a 7-day window.
func DefaultDaysForFrequency(freq int) []int {
	switch freq {
	case 1:
		return []int{1}
	case 2:
		return []int{1, 4}
	case 3:
		return []int{1, 3, 5}
	case 4:
		return []int{1, 2, 4, 5}
	case 5:
		return []int{1, 2, 3, 5, 6}
	default:
		return []int{1, 3, 5}
	}
}

func GetMusclesForSplit(splitPart string) []string {
	return splitMuscles[splitPart]
}

// muscleTarget defines how many exercises of a given muscle group belong in
// a single workout session for a particular split type.
// Values are grounded in Renaissance Periodization (Israetel) MEV/MAV data:
//   - Large muscles (chest, back, legs):  MEV ~10-20 sets/week → 2 exercises/session
//   - Medium muscles (shoulder, glutes):  MEV ~8-16 sets/week  → 1-2 exercises/session
//   - Small muscles (bicep, tricep, calves): MEV ~6-14 sets/week → 1 exercise/session
type muscleTarget struct{ min, max int }

var muscleTargetsBySplit = map[string]map[string]muscleTarget{
	"fullbody": {
		"chest":     {1, 2},
		"back":      {1, 2},
		"legs":      {1, 2},
		"glutes":    {0, 1},
		"shoulder":  {0, 1},
		"core":      {0, 1},
		"bicep":     {0, 1},
		"tricep":    {0, 1},
		"calves":    {0, 1},
		"full body": {0, 1},
	},
	"upper": {
		"chest":    {1, 2},
		"back":     {1, 2},
		"shoulder": {1, 2},
		"bicep":    {1, 1},
		"tricep":   {1, 1},
		"core":     {0, 1},
	},
	"lower": {
		"legs":   {2, 3},
		"glutes": {1, 2},
		"calves": {1, 1},
		"core":   {0, 1},
	},
	"push": {
		"chest":    {2, 3},
		"shoulder": {1, 2},
		"tricep":   {1, 2},
	},
	"pull": {
		"back":  {2, 3},
		"bicep": {1, 2},
	},
	"legs": {
		"legs":   {2, 3},
		"glutes": {1, 2},
		"calves": {1, 1},
		"core":   {0, 1},
	},
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
