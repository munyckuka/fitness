package service

import (
	"backend/internal/utils"
	"context"
	"time"

	"backend/internal/domain"
	"backend/internal/repository"
)

type progressService struct {
	repo    repository.ProgressRepository
	logRepo repository.LogRepository
}

func NewProgressService(r repository.ProgressRepository, logRepo repository.LogRepository) ProgressService {
	return &progressService{repo: r, logRepo: logRepo}
}

func (s *progressService) GetProgress(
	ctx context.Context,
	userID string,
) (domain.Progress, error) {
	progress, err := s.repo.GetByUser(ctx, userID)
	if err != nil {
		return domain.Progress{}, err
	}

	logs, err := s.logRepo.GetByUser(ctx, userID)
	if err != nil {
		return domain.Progress{}, err
	}

	progress.WorkoutDates = make([]string, 0, len(logs))
	weightByMonth := map[string]float64{}
	monthOrder := make([]string, 0)

	for _, log := range logs {
		loggedAt := time.Unix(log.Timestamp, 0)
		progress.WorkoutDates = append(progress.WorkoutDates, loggedAt.Format("2006-01-02"))

		monthKey := loggedAt.Format("Jan")
		if _, exists := weightByMonth[monthKey]; !exists {
			monthOrder = append(monthOrder, monthKey)
		}

		for _, exercise := range log.Exercises {
			for _, set := range exercise.Sets {
				if float64(set.Weight) > weightByMonth[monthKey] {
					weightByMonth[monthKey] = float64(set.Weight)
				}
			}
		}
	}

	if len(monthOrder) == 0 {
		progress.WeightHistory = defaultWeightHistory()
		return progress, nil
	}

	start := 0
	if len(monthOrder) > 3 {
		start = len(monthOrder) - 3
	}

	progress.WeightHistory = make([]domain.WeightHistoryPoint, 0, len(monthOrder)-start)
	for _, monthKey := range monthOrder[start:] {
		progress.WeightHistory = append(progress.WeightHistory, domain.WeightHistoryPoint{
			Label: monthKey,
			Value: weightByMonth[monthKey],
		})
	}

	return progress, nil
}

func (s *progressService) UpdateAfterWorkout(
	ctx context.Context,
	userID string,
	difficulty int,
	log domain.WorkoutLog,
) error {

	progress, err := s.repo.GetByUser(ctx, userID)
	if err != nil {
		return err
	}

	// volume
	volume := utils.CalculateVolume([]domain.WorkoutLog{log})

	// fatigue
	fatigue := utils.CalculateFatigue(volume, progress.LastWorkout)

	// modifier update
	newModifier := utils.UpdateModifierAdvanced(
		progress.Modifier,
		difficulty,
		fatigue,
	)

	// update fields
	progress.TotalVolume += volume
	progress.WorkoutsCompleted++
	progress.AvgDifficulty = ((progress.AvgDifficulty * float64(progress.WorkoutsCompleted-1)) + float64(difficulty)) / float64(progress.WorkoutsCompleted)
	progress.FatigueScore = fatigue
	progress.Modifier = newModifier
	progress.LastWorkout = time.Now().Unix()

	return s.repo.Update(ctx, progress)
}

func defaultWeightHistory() []domain.WeightHistoryPoint {
	now := time.Now()
	return []domain.WeightHistoryPoint{
		{Label: now.AddDate(0, -2, 0).Format("Jan"), Value: 0},
		{Label: now.AddDate(0, -1, 0).Format("Jan"), Value: 0},
		{Label: now.Format("Jan"), Value: 0},
	}
}
