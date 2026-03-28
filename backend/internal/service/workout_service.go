package service

import (
	"backend/internal/utils"
	"context"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type workoutService struct {
	UserRepo        repository.UserRepository
	ExerciseRepo    repository.ExerciseRepository
	WorkoutRepo     repository.WorkoutRepository
	ProgressRepo    repository.ProgressRepository
	LogRepo         repository.LogRepository
	ProgressService ProgressService
}

func NewWorkoutService(
	u repository.UserRepository,
	e repository.ExerciseRepository,
	w repository.WorkoutRepository,
	p repository.ProgressRepository,
	l repository.LogRepository,
	ps ProgressService,
) WorkoutService {
	return &workoutService{
		UserRepo:        u,
		ExerciseRepo:    e,
		WorkoutRepo:     w,
		ProgressRepo:    p,
		LogRepo:         l,
		ProgressService: ps,
	}
}

func (s *workoutService) GenerateWorkout(ctx context.Context, userID string) (domain.Workout, error) {

	user, err := s.UserRepo.GetByID(ctx, userID)
	if err != nil {
		return domain.Workout{}, err
	}

	exercises, err := s.ExerciseRepo.GetAll(ctx)
	if err != nil {
		return domain.Workout{}, err
	}

	progress, err := s.ProgressRepo.GetByUser(ctx, userID)
	if err != nil {
		return domain.Workout{}, err
	}

	scored := utils.ScoreExercises(exercises, user)

	cycle := int(time.Now().Unix() % 3)
	split := utils.GetSplit(user.Frequency, cycle)

	selected := utils.SelectExercises(
		scored,
		split,
		utils.MaxExercisesByFreq(user.Frequency),
	)

	fatigue := utils.CalculateFatigue(
		progress.TotalVolume,
		progress.LastWorkout,
	)

	phase := utils.GetPhase(progress.WorkoutsCompleted)

	var workoutExercises []domain.WorkoutExercise

	for _, ex := range selected {

		baseSets := utils.SetsByFreq(user.Frequency)
		baseReps := utils.RepsByGoal(string(user.FitnessGoal))
		baseWeight := utils.BaseWeight(string(user.FitnessGoal)) * progress.Modifier

		// periodization
		sets, reps, weight := utils.ApplyPeriodization(
			phase,
			baseSets,
			baseReps,
			baseWeight,
		)

		// fatigue adjustment
		weight = utils.AdjustForFatigue(weight, fatigue)

		workoutExercises = append(workoutExercises, domain.WorkoutExercise{
			ExerciseID:  ex.ID,
			Name:        ex.Name,
			MuscleGroup: ex.MuscleGroup,
			Sets:        sets,
			Reps:        reps,
			Rest:        utils.RestByGoal(string(user.FitnessGoal)),
			Weight:      weight,
			Cycle:       cycle,
		})
	}

	workout := domain.Workout{
		ID:        uuid.New(),
		UserID:    user.ID,
		Exercises: workoutExercises,
		Status:    domain.Created,
		CreatedAt: time.Now(),
	}

	if err := s.WorkoutRepo.Save(ctx, workout); err != nil {
		return domain.Workout{}, err
	}

	return workout, nil
}

func (s *workoutService) CompleteWorkout(
	ctx context.Context,
	userID string,
	workoutID string,
	difficulty int,
	log domain.WorkoutLog,
) error {

	if err := s.LogRepo.Save(ctx, log); err != nil {
		return err
	}

	if err := s.WorkoutRepo.UpdateStatus(ctx, workoutID, domain.Completed); err != nil {
		return err
	}

	if err := s.ProgressService.UpdateAfterWorkout(
		ctx,
		userID,
		difficulty,
		log,
	); err != nil {
		return err
	}

	return nil
}

func (s *workoutService) GetUserWorkouts(ctx context.Context, userID string) ([]domain.Workout, error) {
	return s.WorkoutRepo.GetByUser(ctx, userID)
}
