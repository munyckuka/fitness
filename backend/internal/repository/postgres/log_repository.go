package postgres

import (
	"backend/internal/domain"
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type LogRepository struct {
	db *sql.DB
}

func NewLogRepository(db *sql.DB) *LogRepository {
	return &LogRepository{db: db}
}

func (r *LogRepository) Save(
	ctx context.Context,
	log domain.WorkoutLog,
) error {

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO workout_logs (id, workout_id, user_id, created_at)
		VALUES ($1, $2, $3, NOW())
	`, log.ID, log.WorkoutID, log.UserID)

	if err != nil {
		tx.Rollback()
		return err
	}

	for _, ex := range log.Exercises {

		var exerciseLogID int

		err := tx.QueryRowContext(ctx, `
			INSERT INTO exercise_logs (workout_log_id, exercise_id)
			VALUES ($1, $2)
			RETURNING id
		`, log.ID, ex.ExerciseID).Scan(&exerciseLogID)

		if err != nil {
			tx.Rollback()
			return err
		}

		for _, set := range ex.Sets {
			_, err := tx.ExecContext(ctx, `
				INSERT INTO exercise_sets (exercise_log_id, reps, weight)
				VALUES ($1, $2, $3)
			`, exerciseLogID, set.Reps, set.Weight)

			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit()
}

func (r *LogRepository) GetByUser(
	ctx context.Context,
	userID string,
) ([]domain.WorkoutLog, error) {

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.QueryContext(ctx, `
		SELECT id, workout_id, created_at
		FROM workout_logs
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, parsedUserID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []domain.WorkoutLog

	for rows.Next() {
		var log domain.WorkoutLog
		var createdAt time.Time

		err := rows.Scan(&log.ID, &log.WorkoutID, &createdAt)
		if err != nil {
			return nil, err
		}

		log.Timestamp = createdAt.Unix()

		log.UserID = parsedUserID

		// exercise_logs
		exRows, err := r.db.QueryContext(ctx, `
			SELECT id, exercise_id
			FROM exercise_logs
			WHERE workout_log_id = $1
		`, log.ID)

		if err != nil {
			return nil, err
		}

		for exRows.Next() {
			var ex domain.ExerciseLog
			var exLogID int

			err := exRows.Scan(&exLogID, &ex.ExerciseID)
			if err != nil {
				return nil, err
			}

			// sets
			setRows, err := r.db.QueryContext(ctx, `
				SELECT reps, weight
				FROM exercise_sets
				WHERE exercise_log_id = $1
			`, exLogID)

			if err != nil {
				return nil, err
			}

			for setRows.Next() {
				var set domain.SetLog

				err := setRows.Scan(&set.Reps, &set.Weight)
				if err != nil {
					return nil, err
				}

				ex.Sets = append(ex.Sets, set)
			}

			setRows.Close()

			log.Exercises = append(log.Exercises, ex)
		}

		exRows.Close()

		logs = append(logs, log)
	}

	return logs, nil
}
