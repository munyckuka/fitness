package service

import (
	"backend/internal/domain"
	"backend/internal/dto"
	"backend/internal/repository"
	"backend/internal/utils"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var ErrInvalidCredentials = errors.New("invalid credentials")
var ErrInvalidRefreshToken = errors.New("invalid refresh token")

type authService struct {
	userRepo        repository.UserRepository
	credentialsRepo repository.CredentialsRepository
	jwtSecret       []byte
	accessTTL       time.Duration
	refreshTTL      time.Duration
}

type authClaims struct {
	UserID    string `json:"userId"`
	TokenType string `json:"tokenType"`
	jwt.RegisteredClaims
}

func NewAuthService(userRepo repository.UserRepository, credentialsRepo repository.CredentialsRepository, jwtSecret string) AuthService {
	secret := strings.TrimSpace(jwtSecret)
	if secret == "" {
		secret = "change-me-in-production"
	}

	return &authService{
		userRepo:        userRepo,
		credentialsRepo: credentialsRepo,
		jwtSecret:       []byte(secret),
		accessTTL:       15 * time.Minute,
		refreshTTL:      7 * 24 * time.Hour,
	}
}

func (s *authService) Register(ctx context.Context, req dto.RegisterRequest) (dto.AuthResponse, error) {
	email := normalizeEmail(req.Email)
	if email == "" {
		return dto.AuthResponse{}, fmt.Errorf("email is required")
	}

	if err := validatePasswordComplexity(req.Password); err != nil {
		return dto.AuthResponse{}, err
	}

	if _, err := s.credentialsRepo.GetByEmail(ctx, email); err == nil {
		return dto.AuthResponse{}, fmt.Errorf("email already in use")
	} else if !errors.Is(err, repository.ErrCredentialsNotFound) {
		return dto.AuthResponse{}, err
	}

	passwordHash, err := hashValue(req.Password)
	if err != nil {
		return dto.AuthResponse{}, err
	}

	user := domain.User{ID: uuid.New()}
	user = utils.MapUpdateRequestToUser(dto.UpdateUserRequest{
		Name:         req.Name,
		Age:          req.Age,
		Height:       req.Height,
		Weight:       req.Weight,
		FitnessLevel: req.FitnessLevel,
		FitnessGoal:  req.FitnessGoal,
		Frequency:    req.Frequency,
		Equipment:    req.Equipment,
	}, user)

	createdUser, err := s.userRepo.Create(ctx, user)
	if err != nil {
		return dto.AuthResponse{}, err
	}

	err = s.credentialsRepo.Create(ctx, domain.Credentials{
		UserID:          createdUser.ID,
		Email:           email,
		PasswordHash:    passwordHash,
		IsEmailVerified: false,
	})
	if err != nil {
		return dto.AuthResponse{}, err
	}

	return s.issueTokensAndPersistRefresh(ctx, createdUser)
}

func (s *authService) Login(ctx context.Context, req dto.LoginRequest) (dto.AuthResponse, error) {
	credentials, err := s.credentialsRepo.GetByEmail(ctx, normalizeEmail(req.Email))
	if err != nil {
		if errors.Is(err, repository.ErrCredentialsNotFound) {
			return dto.AuthResponse{}, ErrInvalidCredentials
		}
		return dto.AuthResponse{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(credentials.PasswordHash), []byte(req.Password)); err != nil {
		return dto.AuthResponse{}, ErrInvalidCredentials
	}

	user, err := s.userRepo.GetByID(ctx, credentials.UserID.String())
	if err != nil {
		return dto.AuthResponse{}, err
	}

	return s.issueTokensAndPersistRefresh(ctx, user)
}

func (s *authService) Refresh(ctx context.Context, refreshToken string) (dto.AuthResponse, error) {
	claims, err := s.parseToken(refreshToken, "refresh")
	if err != nil {
		return dto.AuthResponse{}, ErrInvalidRefreshToken
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return dto.AuthResponse{}, ErrInvalidRefreshToken
	}

	credentials, err := s.credentialsRepo.GetByUserID(ctx, userID)
	if err != nil {
		return dto.AuthResponse{}, ErrInvalidRefreshToken
	}

	if credentials.RefreshTokenHash == nil {
		return dto.AuthResponse{}, ErrInvalidRefreshToken
	}

	if *credentials.RefreshTokenHash != hashRefreshToken(refreshToken) {
		return dto.AuthResponse{}, ErrInvalidRefreshToken
	}

	user, err := s.userRepo.GetByID(ctx, userID.String())
	if err != nil {
		return dto.AuthResponse{}, err
	}

	return s.issueTokensAndPersistRefresh(ctx, user)
}

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	claims, err := s.parseToken(refreshToken, "refresh")
	if err != nil {
		return ErrInvalidRefreshToken
	}

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return ErrInvalidRefreshToken
	}

	return s.credentialsRepo.UpdateRefreshTokenHash(ctx, userID, nil)
}

func (s *authService) issueTokensAndPersistRefresh(ctx context.Context, user domain.User) (dto.AuthResponse, error) {
	accessToken, err := s.generateToken(user.ID.String(), "access", s.accessTTL)
	if err != nil {
		return dto.AuthResponse{}, err
	}

	refreshToken, err := s.generateToken(user.ID.String(), "refresh", s.refreshTTL)
	if err != nil {
		return dto.AuthResponse{}, err
	}

	refreshHash := hashRefreshToken(refreshToken)

	if err := s.credentialsRepo.UpdateRefreshTokenHash(ctx, user.ID, &refreshHash); err != nil {
		return dto.AuthResponse{}, err
	}

	return dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         utils.MapUserToDTO(user),
	}, nil
}

func (s *authService) generateToken(userID string, tokenType string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := authClaims{
		UserID:    userID,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *authService) parseToken(tokenString string, expectedType string) (*authClaims, error) {
	claims := &authClaims{}
	parsed, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}

	if !parsed.Valid || claims.TokenType != expectedType || claims.UserID == "" {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}

func validatePasswordComplexity(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}

	var hasUpper bool
	var hasLower bool
	var hasDigit bool

	for _, char := range password {
		switch {
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsDigit(char):
			hasDigit = true
		}
	}

	if !hasUpper || !hasLower || !hasDigit {
		return fmt.Errorf("password must include uppercase, lowercase, and digit")
	}

	return nil
}

func hashValue(raw string) (string, error) {
	hashed, err := bcrypt.GenerateFromPassword([]byte(raw), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	return string(hashed), nil
}

func hashRefreshToken(refreshToken string) string {
	digest := sha256.Sum256([]byte(refreshToken))
	return hex.EncodeToString(digest[:])
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}
