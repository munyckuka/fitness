package postgres

import (
	"backend/internal/domain"
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user domain.User) (domain.User, error) {
	if user.ID == uuid.Nil {
		user.ID = uuid.New()
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.User{}, err
	}

	_, err = tx.ExecContext(ctx, `
		INSERT INTO users (id, age, height, weight, goal, level, frequency)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, user.ID, user.Age, user.Height, user.Weight, string(user.FitnessGoal), user.FitnessLevel, user.Frequency)
	if err != nil {
		tx.Rollback()
		return domain.User{}, err
	}

	if err := upsertUserEquipment(ctx, tx, user.ID, user.Equipment); err != nil {
		tx.Rollback()
		return domain.User{}, err
	}

	if err := tx.Commit(); err != nil {
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) Update(ctx context.Context, user domain.User) (domain.User, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.User{}, err
	}

	result, err := tx.ExecContext(ctx, `
		UPDATE users
		SET age = $1,
		    height = $2,
		    weight = $3,
		    goal = $4,
		    level = $5,
		    frequency = $6
		WHERE id = $7
	`, user.Age, user.Height, user.Weight, string(user.FitnessGoal), user.FitnessLevel, user.Frequency, user.ID)
	if err != nil {
		tx.Rollback()
		return domain.User{}, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		tx.Rollback()
		return domain.User{}, err
	}
	if rowsAffected == 0 {
		tx.Rollback()
		return domain.User{}, fmt.Errorf("user not found")
	}

	if err := upsertUserEquipment(ctx, tx, user.ID, user.Equipment); err != nil {
		tx.Rollback()
		return domain.User{}, err
	}

	if err := tx.Commit(); err != nil {
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (domain.User, error) {
	query := `
    SELECT id, age, height, weight, goal, level, frequency
    FROM users
    WHERE id = $1
    `

	parsedUuid, err := uuid.Parse(id)
	if err != nil {
		return domain.User{}, fmt.Errorf("invalid UUID: %w", err)
	}

	var user domain.User
	var goalStr string

	err = r.db.QueryRowContext(ctx, query, parsedUuid.String()).
		Scan(&user.ID, &user.Age, &user.Height, &user.Weight, &goalStr, &user.FitnessLevel, &user.Frequency)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, fmt.Errorf("user not found")
		}
		return domain.User{}, err
	}

	user.FitnessGoal = domain.Goal(goalStr)
	user.Equipment, err = r.getUserEquipment(ctx, parsedUuid)
	if err != nil {
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) getUserEquipment(ctx context.Context, userID uuid.UUID) ([]string, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT e.name
		FROM user_equipment ue
		JOIN equipment e ON e.id = ue.equipment_id
		WHERE ue.user_id = $1
		ORDER BY e.name ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	equipment := make([]string, 0)
	for rows.Next() {
		var name sql.NullString
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		if name.Valid && name.String != "" {
			equipment = append(equipment, name.String)
		}
	}

	return equipment, rows.Err()
}

func upsertUserEquipment(ctx context.Context, tx *sql.Tx, userID uuid.UUID, equipment []string) error {
	if _, err := tx.ExecContext(ctx, `DELETE FROM user_equipment WHERE user_id = $1`, userID); err != nil {
		return err
	}

	for _, item := range equipment {
		if item == "" {
			continue
		}

		result, err := tx.ExecContext(ctx, `
			INSERT INTO user_equipment (user_id, equipment_id)
			SELECT $1, id
			FROM equipment
			WHERE name = $2
		`, userID, item)
		if err != nil {
			return err
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if rowsAffected == 0 {
			return fmt.Errorf("equipment not found: %s", item)
		}
	}

	return nil
}
