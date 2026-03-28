package postgres

import (
	"backend/internal/domain"
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/google/uuid"
)

type ProgressRepository struct {
	db *sql.DB
}

func NewProgressRepository(db *sql.DB) *ProgressRepository {
	return &ProgressRepository{db: db}
}

func (r *ProgressRepository) GetByUser(ctx context.Context, userID string) (domain.Progress, error) {
	var progress domain.Progress
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return progress, err
	}

	err = r.db.QueryRowContext(ctx,
		`SELECT user_id, total_volume, workouts_completed, avg_difficulty, modifier FROM progress WHERE user_id = $1`,
		parsedID,
	).Scan(&progress.UserID, &progress.TotalVolume, &progress.WorkoutsCompleted, &progress.AvgDifficulty, &progress.Modifier)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			progress.UserID = parsedID
			progress.Modifier = 1
			progress.WorkoutDates = []string{}
			progress.WeightHistory = defaultWeightHistory()
			progress.LastWorkout = time.Time{}.Unix()
			return progress, nil
		}
		return progress, err
	}

	if progress.Modifier == 0 {
		progress.Modifier = 1
	}

	return progress, nil
}

func (r *ProgressRepository) GetModifier(
	ctx context.Context,
	userID string,
) (float64, error) {

	var modifier float64

	err := r.db.QueryRowContext(ctx,
		`SELECT modifier FROM progress WHERE user_id=$1`,
		userID,
	).Scan(&modifier)

	if err != nil {
		return 1.0, nil // default
	}

	return modifier, nil
}

func (r *ProgressRepository) UpdateModifier(
	ctx context.Context,
	userID string,
	modifier float64,
) error {

	_, err := r.db.ExecContext(ctx, `
	INSERT INTO progress (user_id, modifier)
	VALUES ($1, $2)
	ON CONFLICT (user_id)
	DO UPDATE SET modifier = $2
	`, userID, modifier)

	return err
}

func (r *ProgressRepository) Update(ctx context.Context, p domain.Progress) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO progress (user_id, total_volume, workouts_completed, avg_difficulty, modifier)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id)
		DO UPDATE SET total_volume = EXCLUDED.total_volume,
		              workouts_completed = EXCLUDED.workouts_completed,
		              avg_difficulty = EXCLUDED.avg_difficulty,
		              modifier = EXCLUDED.modifier
	`, p.UserID, p.TotalVolume, p.WorkoutsCompleted, p.AvgDifficulty, p.Modifier)
	return err
}

func defaultWeightHistory() []domain.WeightHistoryPoint {
	now := time.Now()
	return []domain.WeightHistoryPoint{
		{Label: now.AddDate(0, -2, 0).Format("Jan"), Value: 0},
		{Label: now.AddDate(0, -1, 0).Format("Jan"), Value: 0},
		{Label: now.Format("Jan"), Value: 0},
	}
}
