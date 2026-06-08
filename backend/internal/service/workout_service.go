package service

import (
	"backend/internal/dto"
	"backend/internal/utils"
	"context"
	"errors"
	"strings"
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

func (s *workoutService) GenerateWorkout(
	ctx context.Context,
	userID string,
	opts GenerateWorkoutOptions,
) (GenerateWorkoutResult, error) {

	user, err := s.UserRepo.GetByID(ctx, userID)
	if err != nil {
		return GenerateWorkoutResult{}, err
	}

	exercises, err := s.ExerciseRepo.GetAll(ctx)
	if err != nil {
		return GenerateWorkoutResult{}, err
	}

	progress, err := s.ProgressRepo.GetByUser(ctx, userID)
	if err != nil {
		return GenerateWorkoutResult{}, err
	}

	logs, err := s.LogRepo.GetByUser(ctx, userID)
	if err != nil {
		return GenerateWorkoutResult{}, err
	}

	prefs := resolvePreferences(user, opts.Preferences)
	dayIndex := resolveDayIndex(opts.DayIndex)
	rotationIndex := utils.ResolveRotationIndex(dayIndex, prefs.DaysOfWeek)

	splitPart := utils.ResolveSplitPart(prefs.Split, rotationIndex)
	muscles := utils.GetMusclesForSplit(splitPart)
	minRest := utils.MinRestDaysForSplit(prefs.Split, user.Frequency)

	exIDToMuscle := make(map[uuid.UUID]string, len(exercises))
	for _, ex := range exercises {
		exIDToMuscle[ex.ID] = ex.MuscleGroup
	}

	byMuscle := utils.FilterByMuscles(exercises, muscles)
	pool := utils.FilterByRecovery(byMuscle, logs, exIDToMuscle, minRest, time.Now())

	overtraining := false
	warning := ""
	if len(pool) == 0 {
		overtraining = true
		warning = WarningOvertraining
		pool = byMuscle
		if len(pool) == 0 {
			pool = exercises
		}
	}

	scored := utils.ScoreExercises(pool, user)
	selected := utils.SelectTopExercises(
		scored,
		utils.MaxExercisesByFreq(user.Frequency),
		2,
	)

	fatigue := utils.CalculateFatigue(progress.TotalVolume, progress.LastWorkout)
	phase := utils.GetPhase(progress.WorkoutsCompleted)
	cycle := int(time.Now().Unix() % 3)

	// Calculate weight adjustments based on RPE patterns from recent logs
	rpeAdjustment := utils.CalculateWeightAdjustment(logs, "", 3) // last 3 workouts

	// Calculate recovery adjustment based on sleep and stress
	recoveryAdjustment := utils.AdjustWeightForRecovery(opts.SleepHours, opts.SleepQuality, opts.StressLevel)

	workoutExercises := make([]domain.WorkoutExercise, 0, len(selected))
	for _, ex := range selected {
		baseSets := utils.SetsByFreq(user.Frequency)
		baseReps := utils.RepsByGoal(string(user.FitnessGoal))
		baseWeight := utils.BaseWeight(string(user.FitnessGoal)) * progress.Modifier

		sets, reps, weight := utils.ApplyPeriodization(phase, baseSets, baseReps, baseWeight)
		weight = utils.AdjustForFatigue(weight, fatigue)
		weight *= rpeAdjustment       // Apply RPE-based adjustment
		weight *= recoveryAdjustment  // Apply recovery-based adjustment

		if overtraining {
			sets = int(float64(sets) * 0.7)
			if sets < 1 {
				sets = 1
			}
			weight *= 0.8
		}

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
		DayIndex:  dayIndex,
		SplitPart: splitPart,
		Exercises: workoutExercises,
		Status:    domain.Created,
		CreatedAt: time.Now(),
	}

	if opts.PlannedFor != nil {
		workout.PlannedFor = *opts.PlannedFor
	}

	if err := s.WorkoutRepo.Save(ctx, workout); err != nil {
		return GenerateWorkoutResult{}, err
	}

	if opts.Preferences != nil && opts.Preferences.Remember {
		persist := *opts.Preferences
		persist.UserID = user.ID
		if err := s.UserRepo.UpsertPreferences(ctx, persist); err != nil {
			return GenerateWorkoutResult{}, err
		}
	}

	return GenerateWorkoutResult{Workout: workout, Warning: warning}, nil
}

// ListExercises returns exercises optionally filtered by name substring (query) and muscle group.
func (s *workoutService) ListExercises(ctx context.Context, query string, muscle string, limit int) ([]domain.Exercise, error) {
	exercises, err := s.ExerciseRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	q := strings.TrimSpace(strings.ToLower(query))
	m := strings.TrimSpace(strings.ToLower(muscle))

	var out []domain.Exercise
	for _, ex := range exercises {
		if q != "" {
			if !strings.Contains(strings.ToLower(ex.Name), q) {
				continue
			}
		}
		if m != "" {
			// muscle groups in DB may be like 'biceps' or 'full body'
			if !strings.Contains(strings.ToLower(ex.MuscleGroup), m) {
				continue
			}
		}
		out = append(out, ex)
		if limit > 0 && len(out) >= limit {
			break
		}
	}

	return out, nil
}

func resolvePreferences(user domain.User, override *domain.TrainingPreferences) domain.TrainingPreferences {
	split := utils.AutoSplitFromFrequency(user.Frequency)
	days := utils.DefaultDaysForFrequency(user.Frequency)

	if override != nil {
		p := *override
		p.UserID = user.ID
		if p.Split == "" {
			p.Split = split
		}
		if len(p.DaysOfWeek) == 0 {
			p.DaysOfWeek = days
		}
		return p
	}
	if user.Preferences != nil {
		p := *user.Preferences
		// Always derive split from frequency; ignore stale stored split.
		p.Split = split
		if len(p.DaysOfWeek) == 0 {
			p.DaysOfWeek = days
		}
		return p
	}
	return domain.TrainingPreferences{
		UserID:     user.ID,
		Split:      split,
		DaysOfWeek: days,
		Remember:   false,
	}
}

func resolveDayIndex(override *int) int {
	if override != nil {
		idx := *override
		if idx < 0 {
			idx = 0
		}
		return idx
	}
	return int(time.Now().Weekday())
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

func (s *workoutService) ImportSharedWorkout(ctx context.Context, userID string, req dto.ImportSharedWorkoutRequest) (domain.Workout, error) {
	if len(req.Exercises) == 0 {
		return domain.Workout{}, errors.New("shared workout has no exercises")
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return domain.Workout{}, err
	}

	exercises := make([]domain.WorkoutExercise, 0, len(req.Exercises))
	for _, item := range req.Exercises {
		exerciseID, parseErr := uuid.Parse(item.ExerciseID)
		if parseErr != nil {
			return domain.Workout{}, parseErr
		}

		exercises = append(exercises, domain.WorkoutExercise{
			ExerciseID: exerciseID,
			Sets:       item.Sets,
			Reps:       item.Reps,
			Rest:       item.Rest,
			Weight:     item.Weight,
		})
	}

	workout := domain.Workout{
		ID:        uuid.New(),
		UserID:    parsedUserID,
		Exercises: exercises,
		Status:    domain.Created,
		CreatedAt: time.Now(),
	}

	if err := s.WorkoutRepo.Save(ctx, workout); err != nil {
		return domain.Workout{}, err
	}

	return workout, nil
}

func (s *workoutService) ReplaceExercise(
	ctx context.Context,
	userID string,
	workoutID string,
	oldExerciseID string,
	newExerciseID string,
) error {

	parsedWorkoutID, err := uuid.Parse(workoutID)
	if err != nil {
		return errors.New("invalid workoutId")
	}
	workout, err := s.WorkoutRepo.GetByID(ctx, parsedWorkoutID)
	if err != nil {
		return err
	}
	if workout.UserID.String() != userID {
		return errors.New("unauthorized")
	}

	exercises, err := s.ExerciseRepo.GetAll(ctx)
	if err != nil {
		return err
	}
	var newMuscle string
	for _, ex := range exercises {
		if ex.ID.String() == newExerciseID {
			newMuscle = ex.MuscleGroup
			break
		}
	}
	if newMuscle == "" {
		return errors.New("new exercise not found")
	}
	muscles := utils.GetMusclesForSplit(workout.SplitPart)
	found := false
	for _, m := range muscles {
		if m == newMuscle {
			found = true
			break
		}
	}
	if !found {
		return errors.New("new exercise does not fit the split part")
	}

	return s.WorkoutRepo.ReplaceExercise(ctx, workoutID, oldExerciseID, newExerciseID)
}

func (s *workoutService) DeleteWorkout(ctx context.Context, userID string, workoutID string) error {
	return s.WorkoutRepo.Delete(ctx, workoutID, userID)
}

func (s *workoutService) GenerateWeekWorkouts(
	ctx context.Context,
	userID string,
	startDate time.Time,
) ([]domain.Workout, error) {

	user, err := s.UserRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Split type and session count are driven entirely by frequency.
	split := utils.AutoSplitFromFrequency(user.Frequency)
	daysOfWeek := utils.DefaultDaysForFrequency(user.Frequency)
	// Honour stored day preferences when the count exactly matches frequency.
	if user.Preferences != nil && len(user.Preferences.DaysOfWeek) == user.Frequency {
		daysOfWeek = user.Preferences.DaysOfWeek
	}

	prefs := &domain.TrainingPreferences{
		UserID:     user.ID,
		Split:      split,
		DaysOfWeek: daysOfWeek,
		Remember:   false,
	}

	endDate := startDate.AddDate(0, 0, 7)

	// Delete pending (non-completed) workouts in the range so we always start fresh.
	// Completed workouts and their logs are intentionally left untouched.
	if err := s.WorkoutRepo.DeletePendingInRange(ctx, userID, startDate, endDate); err != nil {
		return nil, err
	}

	var response []domain.Workout

	for _, dayOffset := range daysOfWeek {
		d := dayOffset
		dt := startDate.AddDate(0, 0, d)

		opts := GenerateWorkoutOptions{
			DayIndex:    &d,
			Preferences: prefs,
			PlannedFor:  &dt,
		}

		result, err := s.GenerateWorkout(ctx, userID, opts)
		if err != nil {
			continue
		}

		response = append(response, result.Workout)
	}

	return response, nil
}
