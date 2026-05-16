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
	switch freq {
	case 2:
		return 6
	case 3:
		return 9
	default:
		return 6
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
