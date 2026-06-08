package utils

import (
	"backend/internal/domain"
	"backend/internal/dto"
	"time"

	"github.com/google/uuid"
)

func MapUserToDTO(u domain.User) dto.UserResponse {
	resp := dto.UserResponse{
		ID:           u.ID.String(),
		Name:         u.Name,
		Login:        u.Login,
		Age:          u.Age,
		Height:       u.Height,
		Weight:       u.Weight,
		FitnessLevel: u.FitnessLevel,
		FitnessGoal:  string(u.FitnessGoal),
		Frequency:    u.Frequency,
		Equipment:    u.Equipment,
	}
	if u.Preferences != nil {
		resp.Preferences = &dto.TrainingPreferencesDTO{
			DaysOfWeek: u.Preferences.DaysOfWeek,
			Split:      string(u.Preferences.Split),
			Remember:   u.Preferences.Remember,
		}
	}
	return resp
}

func MapPreferencesDTOToDomain(d dto.TrainingPreferencesDTO) domain.TrainingPreferences {
	split := domain.SplitType(d.Split)
	switch split {
	case domain.SplitPPL, domain.SplitUpperLower, domain.SplitFullBody:
		// ok
	default:
		split = domain.SplitFullBody
	}
	return domain.TrainingPreferences{
		DaysOfWeek: NormalizeDaysOfWeek(d.DaysOfWeek),
		Split:      split,
		Remember:   d.Remember,
	}
}

func MapWorkoutToDTO(w domain.Workout) dto.WorkoutResponse {
	exercises := make([]dto.WorkoutExerciseDTO, 0, len(w.Exercises))

	for _, e := range w.Exercises {
		exercises = append(exercises, dto.WorkoutExerciseDTO{
			ExerciseID:  e.ExerciseID.String(),
			Name:        e.Name,
			MuscleGroup: e.MuscleGroup,
			Sets:        e.Sets,
			Reps:        e.Reps,
			Rest:        e.Rest,
			Weight:      e.Weight,
			Cycle:       e.Cycle,
		})
	}

	return dto.WorkoutResponse{
		ID:        w.ID.String(),
		UserID:    w.UserID.String(),
		DayIndex:  w.DayIndex,
		SplitPart: w.SplitPart,
		Status:    string(w.Status),
		Exercises: exercises,
	}
}

func MapToWorkoutLog(userID string, workoutID string, req dto.CompleteWorkoutRequest) domain.WorkoutLog {
	var exercises []domain.ExerciseLog

	for _, ex := range req.Exercises {
		var sets []domain.SetLog

		for _, s := range ex.Sets {
			sets = append(sets, domain.SetLog{
				Reps:   s.Reps,
				Weight: s.Weight,
				RPE:    s.RPE, // Include RPE
			})
		}

		// TODO: добавить хэндлинг ошибок, ниже тоже
		parsedExerciseId, _ := uuid.Parse(ex.ExerciseID)

		exercises = append(exercises, domain.ExerciseLog{
			ExerciseID:  parsedExerciseId,
			Sets:        sets,
			RPE:         ex.RPE,
			FormQuality: ex.FormQuality,
			Cycle:       ex.Cycle,
		})
	}

	parsedWorkoutId, _ := uuid.Parse(workoutID)
	parsedUserId, _ := uuid.Parse(userID)

	return domain.WorkoutLog{
		ID:           uuid.New(),
		UserID:       parsedUserId,
		WorkoutID:    parsedWorkoutId,
		Exercises:    exercises,
		Timestamp:    time.Now().Unix(),
		SleepHours:   req.SleepHours,
		SleepQuality: req.SleepQuality,
		StressLevel:  req.StressLevel,
	}
}

func MapUpdateRequestToUser(req dto.UpdateUserRequest, existing domain.User) domain.User {
	if req.Name != "" {
		existing.Name = req.Name
	} else if existing.Name == "" {
		existing.Name = "Пользователь"
	}
	if req.Login != "" {
		existing.Login = req.Login
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
	case string(domain.GoalEndurance):
		existing.FitnessGoal = domain.GoalEndurance
	default:
		existing.FitnessGoal = domain.GoalStrength
	}

	if req.Preferences != nil {
		prefs := MapPreferencesDTOToDomain(*req.Preferences)
		existing.Preferences = &prefs
	}

	return existing
}
