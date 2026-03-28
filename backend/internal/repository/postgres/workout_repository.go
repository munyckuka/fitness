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

	query := `
	INSERT INTO workouts (id, user_id, status, created_at)
	VALUES ($1, $2, $3, $4)
	`

	_, err := r.db.ExecContext(ctx, query,
		w.ID,
		w.UserID,
		w.Status,
		w.CreatedAt,
	)

	if err != nil {
		return err
	}

	for _, ex := range w.Exercises {
		_, err := r.db.ExecContext(ctx, `
		INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, weight, rest)
		VALUES ($1, $2, $3, $4, $5, $6)
		`, w.ID, ex.ExerciseID, ex.Sets, ex.Reps, ex.Weight, ex.Rest)

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

func (r *WorkoutRepository) getWorkouts(ctx context.Context, whereClause string, args ...any) ([]domain.Workout, error) {
	query := `
		SELECT w.id,
		       w.user_id,
		       w.status,
		       w.created_at,
		       we.exercise_id,
		       e.name,
		       e.muscle_group,
		       we.sets,
		       we.reps,
		       we.rest,
		       we.weight
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
			exerciseID  sql.NullString
			name        sql.NullString
			muscleGroup sql.NullString
			sets        sql.NullInt32
			reps        sql.NullInt32
			rest        sql.NullInt32
			weight      sql.NullFloat64
		)

		if err := rows.Scan(&workoutID, &userID, &status, &createdAt, &exerciseID, &name, &muscleGroup, &sets, &reps, &rest, &weight); err != nil {
			return nil, err
		}

		workout := workoutMap[workoutID]
		if workout == nil {
			workout = &domain.Workout{
				ID:        workoutID,
				UserID:    userID,
				Status:    domain.WorkoutStatus(status),
				CreatedAt: createdAt,
				Exercises: []domain.WorkoutExercise{},
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
			})
		}
	}

	workouts := make([]domain.Workout, 0, len(order))
	for _, workoutID := range order {
		workouts = append(workouts, *workoutMap[workoutID])
	}

	return workouts, rows.Err()
}
