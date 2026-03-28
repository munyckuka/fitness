package handler

import (
	"net/http"

	"backend/internal/dto"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

type ProgressHandler struct {
	service service.ProgressService
}

func NewProgressHandler(s service.ProgressService) *ProgressHandler {
	return &ProgressHandler{service: s}
}

func (h *ProgressHandler) GetProgress(c *gin.Context) {
	userID := c.Param("id")

	progress, err := h.service.GetProgress(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	resp := dto.ProgressResponse{
		UserID:        userID,
		Completed:     progress.WorkoutsCompleted,
		AvgDifficulty: progress.AvgDifficulty,
		WorkoutDates:  progress.WorkoutDates,
	}

	for _, point := range progress.WeightHistory {
		resp.WeightHistory = append(resp.WeightHistory, dto.WeightHistoryPoint{
			Label: point.Label,
			Value: point.Value,
		})
	}

	c.JSON(http.StatusOK, resp)
}
