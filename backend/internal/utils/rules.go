package utils

func SetsByLevel(level int) int {
	if level == 1 {
		return 3
	}
	return 4
}

func RepsByGoal(goal string) int {
	switch goal {
	case "strength":
		return 5
	case "mass", "hypertrophy":
		return 10
	case "weight_loss", "endurance":
		return 15
	default:
		return 10
	}
}

func RestByGoal(goal string) int {
	if goal == "strength" {
		return 120
	}
	return 90
}

func MaxExercisesByFreq(freq int) int {
	switch {
	case freq <= 1:
		return 8 // single fullbody session — needs to hit as many muscle groups as possible
	case freq == 2:
		return 7 // two fullbody sessions — distribute coverage across the pair
	case freq == 3:
		return 6 // PPL — focused sessions (push/pull/legs cover 3-4 muscles each)
	default:
		return 6 // upper/lower — balanced 5-6 muscles per session
	}
}

func SetsByFreq(freq int) int {
	if freq == 2 {
		return 3
	}
	return 4
}

func BaseWeight(goal string) float64 {
	switch goal {
	case "strength":
		return 40
	case "mass", "hypertrophy":
		return 20
	case "weight_loss", "endurance":
		return 10
	default:
		return 20
	}
}
