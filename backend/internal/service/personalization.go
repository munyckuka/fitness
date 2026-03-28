package service

import "backend/internal/domain"
import "backend/internal/utils"

var PushMuscles = []string{"chest", "shoulder", "tricep"}
var PullMuscles = []string{"back", "bicep"}
var LegMuscles = []string{"quadriceps", "hamstrings", "calves", "glutes"}

type ScoredExercise struct {
	Exercise domain.Exercise
	Score    float64
}

func ScoreExercises(user domain.User, exercises []domain.Exercise) []ScoredExercise {
	var result []ScoredExercise

	levelRank := map[string]int{
		"beginner":     1,
		"intermediate": 2,
		"advanced":     3,
	}

	for _, e := range exercises {
		if !utils.Contains(user.Equipment, e.RequiredEquipment) {
			continue
		}
		if !utils.LevelAllowed(user.FitnessLevel, e.DifficultyLevel) {
			continue
		}

		score := 0.0
		if user.FitnessGoal == "strength" && e.DifficultyLevel != 1 {
			score += 2
		}
		if levelRank[user.FitnessLevel] == e.DifficultyLevel {
			score += 1.5
		}
		score += 0.5

		result = append(result, ScoredExercise{Exercise: e, Score: score})
	}

	return result
}

func ConfigureExercises(user domain.User, scored []ScoredExercise) []domain.WorkoutExercise {
	var result []domain.WorkoutExercise
	limit := utils.MaxExercisesByFreq(user.Frequency)

	for i, ex := range scored {
		if i >= limit {
			break
		}

		cycle := -1 // full body по умолчанию
		if user.Frequency == 3 {
			switch ex.Exercise.MuscleGroup {
			case "chest", "shoulder", "tricep":
				cycle = 0
			case "back", "bicep":
				cycle = 1
			case "quadriceps", "hamstrings", "calves", "glutes":
				cycle = 2
			default:
				cycle = -1
			}
		}

		result = append(result, domain.WorkoutExercise{
			ExerciseID: ex.Exercise.ID,
			Name:       ex.Exercise.Name,
			Sets:       utils.SetsByFreq(user.Frequency),
			Reps:       utils.RepsByGoal(string(user.FitnessGoal)),
			Weight:     utils.BaseWeight(string(user.FitnessGoal)),
			Rest:       utils.RestByGoal(string(user.FitnessGoal)),
			Cycle:      cycle,
		})
	}

	return result
}

func FilterByCycle(exercises []domain.WorkoutExercise, cycle int) []domain.WorkoutExercise {
	if cycle == -1 {
		return exercises
	}
	var filtered []domain.WorkoutExercise
	for _, ex := range exercises {
		if ex.Cycle == cycle {
			filtered = append(filtered, ex)
		}
	}
	return filtered
}
