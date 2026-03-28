package handler

import (
	"backend/internal/utils"
	"net/http"

	"backend/internal/dto"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type WorkoutHandler struct {
	service service.WorkoutService
}

func NewWorkoutHandler(s service.WorkoutService) *WorkoutHandler {
	return &WorkoutHandler{service: s}
}

func (h *WorkoutHandler) GenerateWorkout(c *gin.Context) {
	var req dto.GenerateWorkoutRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	workout, err := h.service.GenerateWorkout(c.Request.Context(), req.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := utils.MapWorkoutToDTO(workout)

	c.JSON(http.StatusOK, response)
}

func (h *WorkoutHandler) CompleteWorkout(c *gin.Context) {
	var req dto.CompleteWorkoutRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	logs := utils.MapToWorkoutLog(req.UserID, req.WorkoutID, req)

	err := h.service.CompleteWorkout(
		c.Request.Context(),
		req.UserID,
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
