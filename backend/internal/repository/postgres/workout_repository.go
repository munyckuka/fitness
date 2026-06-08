package postgres

import (
	"backend/internal/domain"
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
)

type WorkoutRepository struct {
	db *sql.DB
}

func NewWorkoutRepository(db *sql.DB) *WorkoutRepository {
	return &WorkoutRepository{db: db}
}

func (r *WorkoutRepository) Save(ctx context.Context, w domain.Workout) error {

	splitPart := w.SplitPart
	if splitPart == "" {
		splitPart = "fullbody"
	}

	plannedFor := w.PlannedFor
	if plannedFor.IsZero() {
		plannedFor = w.CreatedAt
	}

	query := `
	INSERT INTO workouts (id, user_id, status, created_at, day_index, split_part, planned_for)
	VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	_, err := r.db.ExecContext(ctx, query,
		w.ID,
		w.UserID,
		w.Status,
		w.CreatedAt,
		w.DayIndex,
		splitPart,
		plannedFor,
	)

	if err != nil {
		return err
	}

	for _, ex := range w.Exercises {
		_, err := r.db.ExecContext(ctx, `
		INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, rest, cycle)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, w.ID, ex.ExerciseID, ex.Sets, ex.Reps, ex.Weight, ex.Rest, ex.Cycle)

		if err != nil {
			return err
		}
	}

	return nil
}

func (r *WorkoutRepository) GetByID(ctx context.Context, id uuid.UUID) (domain.Workout, error) {
	workouts, err := r.getWorkouts(ctx, `WHERE w.id = $1`, id)
	if err != nil {
		return domain.Workout{}, err
	}
	if len(workouts) == 0 {
		return domain.Workout{}, sql.ErrNoRows
	}

	return workouts[0], nil
}

func (r *WorkoutRepository) Update(ctx context.Context, w domain.Workout) error {
	_, err := r.db.ExecContext(ctx, `UPDATE workouts SET status=$1, created_at=$2 WHERE id=$3`, w.Status, w.CreatedAt, w.ID)
	return err
}

func (r *WorkoutRepository) GetByUser(ctx context.Context, userID string) ([]domain.Workout, error) {
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	return r.getWorkouts(ctx, `WHERE w.user_id = $1`, parsedID)
}

func (r *WorkoutRepository) GetByUserBetween(
	ctx context.Context,
	userID string,
	from time.Time,
	to time.Time,
) ([]domain.Workout, error) {
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return nil, err
	}

	return r.getWorkouts(ctx,
		`WHERE w.user_id = $1 AND w.planned_for >= $2 AND w.planned_for < $3`,
		parsedID, from, to,
	)
}

func (r *WorkoutRepository) UpdateStatus(
	ctx context.Context,
	workoutID string,
	status domain.WorkoutStatus,
) error {

	_, err := r.db.ExecContext(ctx,
		`UPDATE workouts SET status=$1 WHERE id=$2`,
		status,
		workoutID,
	)

	return err
}

func (r *WorkoutRepository) Delete(ctx context.Context, workoutID string, userID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if _, err = tx.ExecContext(ctx, `DELETE FROM workout_exercises WHERE workout_id = $1`, workoutID); err != nil {
		tx.Rollback()
		return err
	}

	result, err := tx.ExecContext(ctx, `DELETE FROM workouts WHERE id = $1 AND user_id = $2`, workoutID, userID)
	if err != nil {
		tx.Rollback()
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		tx.Rollback()
		return err
	}
	if rows == 0 {
		tx.Rollback()
		return sql.ErrNoRows
	}

	return tx.Commit()
}

func (r *WorkoutRepository) DeletePendingInRange(ctx context.Context, userID string, from time.Time, to time.Time) error {
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	const target = `SELECT id FROM workouts WHERE user_id = $1 AND planned_for >= $2 AND planned_for < $3`

	if _, err = tx.ExecContext(ctx, `DELETE FROM workout_exercises WHERE workout_id IN (`+target+`)`, parsedID, from, to); err != nil {
		tx.Rollback()
		return err
	}

	if _, err = tx.ExecContext(ctx, `DELETE FROM workouts WHERE id IN (`+target+`)`, parsedID, from, to); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

func (r *WorkoutRepository) ReplaceExercise(
	ctx context.Context,
	workoutID string,
	oldExerciseID string,
	newExerciseID string,
) error {

	_, err := r.db.ExecContext(ctx, `
		UPDATE workout_exercises SET exercise_id=$1 WHERE workout_id=$2 AND exercise_id=$3
	`, newExerciseID, workoutID, oldExerciseID)

	return err
}

func (r *WorkoutRepository) getWorkouts(ctx context.Context, whereClause string, args ...any) ([]domain.Workout, error) {
	query := `
		SELECT w.id,
		       w.user_id,
		       w.status,
		       w.created_at,
		       w.day_index,
		       w.split_part,
		       w.planned_for,
		       we.exercise_id,
		       e.name,
		       e.muscle_group,
		       we.sets,
		       we.reps,
		       we.rest,
		       we.weight,
		       we.cycle
		FROM workouts w
		LEFT JOIN workout_exercises we ON we.workout_id = w.id
		LEFT JOIN exercises e ON e.id = we.exercise_id
	` + whereClause + `
		ORDER BY w.created_at DESC, e.name ASC
	`

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	workoutMap := make(map[uuid.UUID]*domain.Workout)
	order := make([]uuid.UUID, 0)

	for rows.Next() {
		var (
			workoutID   uuid.UUID
			userID      uuid.UUID
			status      string
			createdAt   time.Time
			dayIndex    int
			splitPart   string
			plannedFor  time.Time
			exerciseID  sql.NullString
			name        sql.NullString
			muscleGroup sql.NullString
			sets        sql.NullInt32
			reps        sql.NullInt32
			rest        sql.NullInt32
			weight      sql.NullFloat64
			cycle       sql.NullInt32
		)

		if err := rows.Scan(&workoutID, &userID, &status, &createdAt, &dayIndex, &splitPart, &plannedFor,
			&exerciseID, &name, &muscleGroup, &sets, &reps, &rest, &weight, &cycle); err != nil {
			return nil, err
		}

		workout := workoutMap[workoutID]
		if workout == nil {
			workout = &domain.Workout{
				ID:         workoutID,
				UserID:     userID,
				Status:     domain.WorkoutStatus(status),
				CreatedAt:  createdAt,
				DayIndex:   dayIndex,
				SplitPart:  splitPart,
				PlannedFor: plannedFor,
				Exercises:  []domain.WorkoutExercise{},
			}
			workoutMap[workoutID] = workout
			order = append(order, workoutID)
		}

		if exerciseID.Valid {
			parsedExerciseID, err := uuid.Parse(exerciseID.String)
			if err != nil {
				return nil, err
			}

			workout.Exercises = append(workout.Exercises, domain.WorkoutExercise{
				ExerciseID:  parsedExerciseID,
				Name:        name.String,
				MuscleGroup: muscleGroup.String,
				Sets:        int(sets.Int32),
				Reps:        int(reps.Int32),
				Rest:        int(rest.Int32),
				Weight:      weight.Float64,
				Cycle:       int(cycle.Int32),
			})
		}
	}

	workouts := make([]domain.Workout, 0, len(order))
	for _, workoutID := range order {
		workouts = append(workouts, *workoutMap[workoutID])
	}

	return workouts, rows.Err()
}
