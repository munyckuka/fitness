package main

import (
	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/realtime"
	"backend/internal/repository/postgres"
	"backend/internal/service"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Загружает .env если файл существует; в проде переменные задаются на уровне ОС
	_ = godotenv.Load()

	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		host := getenv("DB_HOST", "localhost")
		port := getenv("DB_PORT", "5433")
		user := getenv("DB_USER", "postgres")
		password := getenv("DB_PASSWORD", "123456")
		name := getenv("DB_NAME", "workoutdb")
		connStr = fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable", user, password, host, port, name)
	}

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetMaxIdleConns(5)
	db.SetMaxOpenConns(10)

	if err := db.Ping(); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	userRepo := postgres.NewUserRepository(db)
	credentialsRepo := postgres.NewCredentialsRepository(db)
	exerciseRepo := postgres.NewExerciseRepository(db)
	workoutRepo := postgres.NewWorkoutRepository(db)
	logRepo := postgres.NewLogRepository(db)
	progressRepo := postgres.NewProgressRepository(db)
	chatRepo := postgres.NewChatRepository(db)
	sseHub := realtime.NewSSEHub()
	progressService := service.NewProgressService(progressRepo, logRepo)
	chatService := service.NewChatService(chatRepo, sseHub)
	jwtSecret := os.Getenv("JWT_SECRET")
	authService := service.NewAuthService(userRepo, credentialsRepo, jwtSecret)
	authMiddleware := middleware.NewAuthMiddleware(jwtSecret)

	workoutService := service.NewWorkoutService(
		userRepo,
		exerciseRepo,
		workoutRepo,
		progressRepo,
		logRepo,
		progressService,
	)

	authHandler := handler.NewAuthHandler(authService)
	userHandler := handler.NewUserHandler(service.NewUserService(userRepo))
	workoutHandler := handler.NewWorkoutHandler(workoutService)
	progressHandler := handler.NewProgressHandler(progressService)
	chatHandler := handler.NewChatHandler(chatService, sseHub)

	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	})
	handler.SetupRoutes(r, authMiddleware, authHandler, userHandler, workoutHandler, progressHandler, chatHandler)

	port := getenv("PORT", "8080")
	log.Fatal(r.Run(":" + port))
}

func getenv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}

	return value
}
