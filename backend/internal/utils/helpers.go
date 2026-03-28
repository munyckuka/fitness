package utils

func Contains(list []string, value string) bool {
	for _, v := range list {
		if v == value {
			return true
		}
	}
	return false
}

func LevelAllowed(userLevel string, exerciseLevel int) bool {
	levelRank := map[string]int{
		"beginner":     1,
		"intermediate": 2,
		"advanced":     3,
	}
	return exerciseLevel <= levelRank[userLevel]
}
