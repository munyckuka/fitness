package utils

type Phase int

const (
	Volume Phase = iota
	Intensity
	Peak
	Deload
)

func GetPhase(workoutsCompleted int) Phase {
	switch workoutsCompleted % 4 {
	case 0:
		return Volume
	case 1:
		return Intensity
	case 2:
		return Peak
	default:
		return Deload
	}
}

func ApplyPeriodization(
	phase Phase,
	sets int,
	reps int,
	weight float64,
) (int, int, float64) {

	switch phase {

	case Volume:
		return sets, reps + 2, weight * 0.9

	case Intensity:
		return sets, reps, weight * 1.05

	case Peak:
		return sets - 1, reps - 2, weight * 1.1

	case Deload:
		return sets - 1, reps - 3, weight * 0.7

	default:
		return sets, reps, weight
	}
}
