package service

import (
	"backend/internal/dto"
	"backend/internal/utils"
	"context"
	"strings"

	"backend/internal/domain"
	"backend/internal/repository"

	"github.com/google/uuid"
)

type userService struct {
	repo repository.UserRepository
}

func NewUserService(r repository.UserRepository) UserService {
	return &userService{repo: r}
}

func (s *userService) Create(ctx context.Context, req dto.UpdateUserRequest) (domain.User, error) {
	user := domain.User{
		ID: uuid.New(),
	}

	user = utils.MapUpdateRequestToUser(req, user)

	return s.repo.Create(ctx, user)
}

func (s *userService) Update(ctx context.Context, id string, req dto.UpdateUserRequest) (domain.User, error) {
	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return domain.User{}, err
	}

	updated := utils.MapUpdateRequestToUser(req, existing)

	return s.repo.Update(ctx, updated)
}

func (s *userService) GetByID(ctx context.Context, id string) (domain.User, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *userService) SearchByLogin(ctx context.Context, currentUserID string, loginQuery string, limit int) ([]domain.User, error) {
	trimmedQuery := strings.TrimSpace(loginQuery)
	if trimmedQuery == "" {
		return []domain.User{}, nil
	}

	if limit <= 0 || limit > 20 {
		limit = 10
	}

	return s.repo.SearchByLogin(ctx, currentUserID, trimmedQuery, limit)
}
