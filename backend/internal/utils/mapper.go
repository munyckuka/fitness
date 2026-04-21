package utils

import (
	"backend/internal/domain"
	"backend/internal/dto"
	"time"

	"github.com/google/uuid"
)

func MapUserToDTO(u domain.User) dto.UserResponse {
	return dto.UserResponse{
		ID:           u.ID.String(),
		Name:         u.Name,
		Age:          u.Age,
		Height:       u.Height,
		Weight:       u.Weight,
		FitnessLevel: u.FitnessLevel,
		FitnessGoal:  string(u.FitnessGoal),
		Frequency:    u.Frequency,
		Equipment:    u.Equipment,
	}
}

func MapWorkoutToDTO(w domain.Workout) dto.WorkoutResponse {
	var exercises []dto.WorkoutExerciseDTO

	for _, e := range w.Exercises {
		exercises = append(exercises, dto.WorkoutExerciseDTO{
			ExerciseID:  e.ExerciseID.String(),
			Name:        e.Name,
			MuscleGroup: e.MuscleGroup,
			Sets:        e.Sets,
			Reps:        e.Reps,
			Rest:        e.Rest,
			Weight:      e.Weight,
		})
	}

	return dto.WorkoutResponse{
		ID:        w.ID.String(),
		UserID:    w.UserID.String(),
		Exercises: exercises,
	}
}

func MapToWorkoutLog(userID, workoutID string, req dto.CompleteWorkoutRequest) domain.WorkoutLog {
	var exercises []domain.ExerciseLog

	for _, ex := range req.Exercises {
		var sets []domain.SetLog

		for _, s := range ex.Sets {
			sets = append(sets, domain.SetLog{
				Reps:   s.Reps,
				Weight: s.Weight,
			})
		}

		// TODO: добавить хэндлинг ошибок, ниже тоже
		parsedExerciseId, _ := uuid.Parse(ex.ExerciseID)

		exercises = append(exercises, domain.ExerciseLog{
			ExerciseID: parsedExerciseId,
			Sets:       sets,
		})
	}

	parsedWorkoutId, _ := uuid.Parse(workoutID)

	return domain.WorkoutLog{
		ID:        uuid.New(),
		UserID:    userID,
		WorkoutID: parsedWorkoutId,
		Exercises: exercises,
		Timestamp: time.Now().Unix(),
	}
}

func MapUpdateUserDTOToDomain(req dto.UpdateUserRequest) domain.User {
	name := req.Name
	if name == "" {
		name = "Пользователь"
	}

	return domain.User{
		Name:         name,
		Age:          req.Age,
		Height:       req.Height,
		Weight:       req.Weight,
		FitnessLevel: req.FitnessLevel,
		FitnessGoal:  domain.Goal(req.FitnessGoal),
		Frequency:    req.Frequency,
		Equipment:    req.Equipment,
	}
}

func MapUpdateRequestToUser(req dto.UpdateUserRequest, existing domain.User) domain.User {
	if req.Name != "" {
		existing.Name = req.Name
	} else if existing.Name == "" {
		existing.Name = "Пользователь"
	}
	existing.Age = req.Age
	existing.Height = req.Height
	existing.Weight = req.Weight
	existing.FitnessLevel = req.FitnessLevel
	existing.Frequency = req.Frequency
	existing.Equipment = req.Equipment

	switch req.FitnessGoal {
	case string(domain.GoalStrength):
		existing.FitnessGoal = domain.GoalStrength
	case string(domain.GoalMass):
		existing.FitnessGoal = domain.GoalMass
	case string(domain.GoalWeightLoss):
		existing.FitnessGoal = domain.GoalWeightLoss
	default:
		existing.FitnessGoal = domain.GoalStrength
	}

	return existing
}
