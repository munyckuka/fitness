package postgres

import (
	"backend/internal/domain"
	"context"
	"database/sql"
)

type ExerciseRepository struct {
	DB *sql.DB
}

func NewExerciseRepository(db *sql.DB) *ExerciseRepository {
	return &ExerciseRepository{DB: db}
}

func (r *ExerciseRepository) GetAll(ctx context.Context) ([]domain.Exercise, error) {
	rows, err := r.DB.QueryContext(ctx, `
		SELECT id, name, muscle_group, required_equipment, difficulty_level,
		       COALESCE(description, ''), COALESCE(photo_path, '')
		FROM exercises
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exercises []domain.Exercise
	for rows.Next() {
		var e domain.Exercise
		var difficultyLevel string
		if err := rows.Scan(
			&e.ID,
			&e.Name,
			&e.MuscleGroup,
			&e.RequiredEquipment,
			&difficultyLevel,
			&e.Description,
			&e.PhotoPath,
		); err != nil {
			return nil, err
		}

		e.DifficultyLevel = difficultyRank(difficultyLevel)
		exercises = append(exercises, e)
	}

	return exercises, nil
}

func difficultyRank(level string) int {
	switch level {
	case "beginner":
		return 1
	case "intermediate":
		return 2
	case "advanced":
		return 3
	default:
		return 1
	}
}
