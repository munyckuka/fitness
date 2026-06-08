package postgres

import (
	"backend/internal/domain"
	"backend/internal/repository"
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/lib/pq"
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
		INSERT INTO users (id, name, login, age, height, weight, goal, level, frequency)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`, user.ID, user.Name, user.Login, user.Age, user.Height, user.Weight, string(user.FitnessGoal), user.FitnessLevel, user.Frequency)
	if err != nil {
		tx.Rollback()
		return domain.User{}, err
	}

	if err := upsertUserEquipment(ctx, tx, user.ID, user.Equipment); err != nil {
		tx.Rollback()
		return domain.User{}, err
	}

	if user.Preferences != nil {
		prefs := *user.Preferences
		prefs.UserID = user.ID
		if err := upsertUserPreferences(ctx, tx, prefs); err != nil {
			tx.Rollback()
			return domain.User{}, err
		}
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
		SET name = $1,
		    login = $2,
		    age = $3,
		    height = $4,
		    weight = $5,
		    goal = $6,
		    level = $7,
		    frequency = $8
		WHERE id = $9
	`, user.Name, user.Login, user.Age, user.Height, user.Weight, string(user.FitnessGoal), user.FitnessLevel, user.Frequency, user.ID)
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
		return domain.User{}, repository.ErrUserNotFound
	}

	if err := upsertUserEquipment(ctx, tx, user.ID, user.Equipment); err != nil {
		tx.Rollback()
		return domain.User{}, err
	}

	if user.Preferences != nil {
		prefs := *user.Preferences
		prefs.UserID = user.ID
		if err := upsertUserPreferences(ctx, tx, prefs); err != nil {
			tx.Rollback()
			return domain.User{}, err
		}
	}

	if err := tx.Commit(); err != nil {
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id string) (domain.User, error) {
	query := `
	SELECT id, name, login, age, height, weight, goal, level, frequency
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
		Scan(&user.ID, &user.Name, &user.Login, &user.Age, &user.Height, &user.Weight, &goalStr, &user.FitnessLevel, &user.Frequency)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, repository.ErrUserNotFound
		}
		return domain.User{}, err
	}

	user.FitnessGoal = domain.Goal(goalStr)
	user.Equipment, err = r.getUserEquipment(ctx, parsedUuid)
	if err != nil {
		return domain.User{}, err
	}

	user.Preferences, err = r.getUserPreferences(ctx, parsedUuid)
	if err != nil {
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) GetByLogin(ctx context.Context, login string) (domain.User, error) {
	query := `
	SELECT id, name, login, age, height, weight, goal, level, frequency
	FROM users
	WHERE LOWER(login) = LOWER($1)
	`

	var user domain.User
	var goalStr string

	err := r.db.QueryRowContext(ctx, query, login).
		Scan(&user.ID, &user.Name, &user.Login, &user.Age, &user.Height, &user.Weight, &goalStr, &user.FitnessLevel, &user.Frequency)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return domain.User{}, repository.ErrUserNotFound
		}
		return domain.User{}, err
	}

	user.FitnessGoal = domain.Goal(goalStr)
	user.Equipment, err = r.getUserEquipment(ctx, user.ID)
	if err != nil {
		return domain.User{}, err
	}

	user.Preferences, err = r.getUserPreferences(ctx, user.ID)
	if err != nil {
		return domain.User{}, err
	}

	return user, nil
}

func (r *UserRepository) SearchByLogin(ctx context.Context, currentUserID string, loginQuery string, limit int) ([]domain.User, error) {
	if limit <= 0 {
		limit = 10
	}

	query := `
	SELECT id, name, login, age, height, weight, goal, level, frequency
	FROM users
	WHERE id::text <> $1
	  AND login ILIKE $2
	ORDER BY login ASC
	LIMIT $3
	`

	rows, err := r.db.QueryContext(ctx, query, currentUserID, loginQuery+"%", limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	users := make([]domain.User, 0)
	for rows.Next() {
		var user domain.User
		var goalStr string

		if err := rows.Scan(&user.ID, &user.Name, &user.Login, &user.Age, &user.Height, &user.Weight, &goalStr, &user.FitnessLevel, &user.Frequency); err != nil {
			return nil, err
		}

		user.FitnessGoal = domain.Goal(goalStr)
		user.Equipment, err = r.getUserEquipment(ctx, user.ID)
		if err != nil {
			return nil, err
		}

		users = append(users, user)
	}

	return users, rows.Err()
}

func (r *UserRepository) UpsertPreferences(ctx context.Context, prefs domain.TrainingPreferences) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := upsertUserPreferences(ctx, tx, prefs); err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit()
}

func (r *UserRepository) getUserPreferences(ctx context.Context, userID uuid.UUID) (*domain.TrainingPreferences, error) {
	var (
		days     pq.Int64Array
		split    string
		remember bool
	)

	err := r.db.QueryRowContext(ctx, `
		SELECT days_of_week, split, remember
		FROM training_preferences
		WHERE user_id = $1
	`, userID).Scan(&days, &split, &remember)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}

	out := domain.TrainingPreferences{
		UserID:     userID,
		Split:      domain.SplitType(split),
		Remember:   remember,
		DaysOfWeek: make([]int, 0, len(days)),
	}
	for _, d := range days {
		out.DaysOfWeek = append(out.DaysOfWeek, int(d))
	}
	return &out, nil
}

func upsertUserPreferences(ctx context.Context, tx *sql.Tx, prefs domain.TrainingPreferences) error {
	days := make(pq.Int64Array, 0, len(prefs.DaysOfWeek))
	for _, d := range prefs.DaysOfWeek {
		days = append(days, int64(d))
	}
	split := string(prefs.Split)
	if split == "" {
		split = string(domain.SplitFullBody)
	}

	_, err := tx.ExecContext(ctx, `
		INSERT INTO training_preferences (user_id, days_of_week, split, remember, updated_at)
		VALUES ($1, $2, $3, $4, now())
		ON CONFLICT (user_id)
		DO UPDATE SET days_of_week = EXCLUDED.days_of_week,
		              split        = EXCLUDED.split,
		              remember     = EXCLUDED.remember,
		              updated_at   = now()
	`, prefs.UserID, days, split, prefs.Remember)
	return err
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
			// Unknown equipment type — not in the equipment reference table.
			// Skip silently so unrecognised values don't break registration or profile updates.
			continue
		}
	}

	return nil
}
