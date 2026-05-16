package handler

import (
	"backend/internal/middleware"
	"backend/internal/utils"
	"net/http"
	"time"

	"backend/internal/dto"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

const dayIndexMax = 6

type WorkoutHandler struct {
	service service.WorkoutService
}

func NewWorkoutHandler(s service.WorkoutService) *WorkoutHandler {
	return &WorkoutHandler{service: s}
}

func (h *WorkoutHandler) GenerateWorkout(c *gin.Context) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := rawUserID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.GenerateWorkoutRequest
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	opts := service.GenerateWorkoutOptions{}
	if req.DayIndex != nil {
		idx := *req.DayIndex
		if idx < 0 || idx > dayIndexMax {
			c.JSON(http.StatusBadRequest, gin.H{"error": "dayIndex must be in [0,6]"})
			return
		}
		opts.DayIndex = req.DayIndex
	}
	if req.Preferences != nil {
		prefs := utils.MapPreferencesDTOToDomain(*req.Preferences)
		opts.Preferences = &prefs
	}
	// Add recovery metrics
	opts.SleepHours = req.SleepHours
	opts.SleepQuality = req.SleepQuality
	opts.StressLevel = req.StressLevel

	result, err := h.service.GenerateWorkout(c.Request.Context(), userID, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Generate recovery hint based on sleep/stress metrics
	recoveryHint := ""
	if opts.SleepHours < 5 {
		recoveryHint = "⚠️ Плохой сон! Снижаем интенсивность на 20%"
	} else if opts.SleepHours < 7 {
		recoveryHint = "😴 Недостаточно сна. Не переусложняй тренировку"
	}
	if opts.StressLevel > 8 {
		recoveryHint = "😰 Высокий стресс. Отдохни перед тренировкой"
	}

	c.JSON(http.StatusOK, dto.GenerateWorkoutResponse{
		Workout:      utils.MapWorkoutToDTO(result.Workout),
		Warning:      result.Warning,
		RecoveryHint: recoveryHint,
	})
}

func (h *WorkoutHandler) CompleteWorkout(c *gin.Context) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := rawUserID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.CompleteWorkoutRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logs := utils.MapToWorkoutLog(userID, req.WorkoutID, req)

	err := h.service.CompleteWorkout(
		c.Request.Context(),
		userID,
		req.WorkoutID,
		req.Difficulty,
		logs,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "completed"})
}

func (h *WorkoutHandler) GetUserWorkouts(c *gin.Context) {
	userID := c.Param("id")

	workouts, err := h.service.GetUserWorkouts(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var response []dto.WorkoutResponse
	for _, w := range workouts {
		response = append(response, utils.MapWorkoutToDTO(w))
	}

	c.JSON(http.StatusOK, response)
}

func (h *WorkoutHandler) ImportSharedWorkout(c *gin.Context) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := rawUserID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.ImportSharedWorkoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workout, err := h.service.ImportSharedWorkout(c.Request.Context(), userID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.MapWorkoutToDTO(workout))
}

func (h *WorkoutHandler) ReplaceExercise(c *gin.Context) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := rawUserID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	workoutID := c.Param("workoutId")
	oldExerciseID := c.Param("exerciseId")
	if workoutID == "" || oldExerciseID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "workoutId and exerciseId required"})
		return
	}

	var req dto.ReplaceExerciseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.service.ReplaceExercise(c.Request.Context(), userID, workoutID, oldExerciseID, req.NewExerciseID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "replaced"})
}

func (h *WorkoutHandler) GenerateWeekWorkouts(c *gin.Context) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := rawUserID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.GenerateWeekWorkoutsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid startDate format, use YYYY-MM-DD"})
		return
	}

	workouts, err := h.service.GenerateWeekWorkouts(c.Request.Context(), userID, startDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var response []dto.WorkoutResponse
	for _, w := range workouts {
		response = append(response, utils.MapWorkoutToDTO(w))
	}

	c.JSON(http.StatusOK, response)
}
