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

	// Use "YYYY-MM" key to avoid year collisions; label is the 3-letter abbreviation.
	type monthEntry struct {
		label     string
		maxWeight float64
	}
	weightByMonth := map[string]*monthEntry{}

	now := time.Now()
	threeMonthsAgo := now.AddDate(0, -3, 0)

	for _, log := range logs {
		loggedAt := time.Unix(log.Timestamp, 0)
		progress.WorkoutDates = append(progress.WorkoutDates, loggedAt.Format("2006-01-02"))

		if loggedAt.Before(threeMonthsAgo) {
			continue
		}

		yearMonthKey := loggedAt.Format("2006-01")
		if _, exists := weightByMonth[yearMonthKey]; !exists {
			weightByMonth[yearMonthKey] = &monthEntry{label: loggedAt.Format("Jan")}
		}

		for _, exercise := range log.Exercises {
			for _, set := range exercise.Sets {
				if w := float64(set.Weight); w > weightByMonth[yearMonthKey].maxWeight {
					weightByMonth[yearMonthKey].maxWeight = w
				}
			}
		}
	}

	// Always return exactly 3 months (oldest → newest), filling 0 for months with no data.
	type targetMonth struct {
		key   string
		label string
	}
	targets := []targetMonth{
		{now.AddDate(0, -2, 0).Format("2006-01"), now.AddDate(0, -2, 0).Format("Jan")},
		{now.AddDate(0, -1, 0).Format("2006-01"), now.AddDate(0, -1, 0).Format("Jan")},
		{now.Format("2006-01"), now.Format("Jan")},
	}

	progress.WeightHistory = make([]domain.WeightHistoryPoint, 0, 3)
	for _, t := range targets {
		value := 0.0
		if e, exists := weightByMonth[t.key]; exists {
			value = e.maxWeight
		}
		progress.WeightHistory = append(progress.WeightHistory, domain.WeightHistoryPoint{
			Label: t.label,
			Value: value,
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

