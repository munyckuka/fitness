package handler

import (
	"backend/internal/dto"
	"backend/internal/middleware"
	"backend/internal/realtime"
	"backend/internal/service"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	service service.ChatService
	hub     *realtime.SSEHub
}

func NewChatHandler(s service.ChatService, hub *realtime.SSEHub) *ChatHandler {
	return &ChatHandler{service: s, hub: hub}
}

func (h *ChatHandler) ListDialogs(c *gin.Context) {
	userID, ok := getAuthorizedUserID(c)
	if !ok {
		return
	}

	dialogs, err := h.service.ListDialogs(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := make([]dto.ChatDialogResponse, 0, len(dialogs))
	for _, dialog := range dialogs {
		var lastMessageAt *string
		if dialog.LastMessageAt != nil {
			value := dialog.LastMessageAt.UTC().Format("2006-01-02T15:04:05Z07:00")
			lastMessageAt = &value
		}

		response = append(response, dto.ChatDialogResponse{
			ConversationID:  dialog.ConversationID.String(),
			PeerUserID:      dialog.PeerUserID.String(),
			PeerName:        dialog.PeerName,
			PeerLogin:       dialog.PeerLogin,
			LastMessageText: dialog.LastMessageText,
			LastMessageAt:   lastMessageAt,
			UnreadCount:     dialog.UnreadCount,
		})
	}

	c.JSON(http.StatusOK, response)
}

func (h *ChatHandler) EnsureDialog(c *gin.Context) {
	userID, ok := getAuthorizedUserID(c)
	if !ok {
		return
	}

	var req dto.EnsureDialogRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dialog, err := h.service.EnsureDialog(c.Request.Context(), userID, req.PeerUserID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var lastMessageAt *string
	if dialog.LastMessageAt != nil {
		value := dialog.LastMessageAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		lastMessageAt = &value
	}

	c.JSON(http.StatusOK, dto.ChatDialogResponse{
		ConversationID:  dialog.ConversationID.String(),
		PeerUserID:      dialog.PeerUserID.String(),
		PeerName:        dialog.PeerName,
		PeerLogin:       dialog.PeerLogin,
		LastMessageText: dialog.LastMessageText,
		LastMessageAt:   lastMessageAt,
		UnreadCount:     dialog.UnreadCount,
	})
}

func (h *ChatHandler) ListMessages(c *gin.Context) {
	userID, ok := getAuthorizedUserID(c)
	if !ok {
		return
	}

	conversationID := c.Param("conversationId")
	beforeMessageID := c.Query("beforeMessageId")
	limit := 50

	if rawLimit := c.Query("limit"); rawLimit != "" {
		parsedLimit, err := strconv.Atoi(rawLimit)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit"})
			return
		}
		limit = parsedLimit
	}

	messages, err := h.service.ListMessages(c.Request.Context(), userID, conversationID, limit, beforeMessageID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	response := make([]dto.ChatMessageResponse, 0, len(messages))
	for _, msg := range messages {
		response = append(response, dto.ChatMessageResponse{
			ID:             msg.ID.String(),
			ConversationID: msg.ConversationID.String(),
			SenderID:       msg.SenderID.String(),
			Kind:           msg.Kind,
			Text:           msg.Body,
			CreatedAt:      msg.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	c.JSON(http.StatusOK, response)
}

func (h *ChatHandler) SendMessage(c *gin.Context) {
	userID, ok := getAuthorizedUserID(c)
	if !ok {
		return
	}

	conversationID := c.Param("conversationId")

	var req dto.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message, err := h.service.SendMessage(c.Request.Context(), userID, conversationID, req.Text)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.ChatMessageResponse{
		ID:             message.ID.String(),
		ConversationID: message.ConversationID.String(),
		SenderID:       message.SenderID.String(),
		Kind:           message.Kind,
		Text:           message.Body,
		CreatedAt:      message.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	})
}

func (h *ChatHandler) MarkRead(c *gin.Context) {
	userID, ok := getAuthorizedUserID(c)
	if !ok {
		return
	}

	conversationID := c.Param("conversationId")

	var req dto.MarkReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.service.MarkRead(c.Request.Context(), userID, conversationID, req.MessageID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func (h *ChatHandler) StreamEvents(c *gin.Context) {
	userID, ok := getAuthorizedUserID(c)
	if !ok {
		return
	}

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "streaming unsupported"})
		return
	}

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")

	messages, unsubscribe := h.hub.Subscribe(userID)
	defer unsubscribe()

	c.Writer.WriteHeader(http.StatusOK)
	_, _ = c.Writer.Write([]byte(": connected\n\n"))
	flusher.Flush()

	ctx := c.Request.Context()
	for {
		select {
		case <-ctx.Done():
			return
		case payload, ok := <-messages:
			if !ok {
				return
			}

			_, _ = c.Writer.Write([]byte("event: chat\n"))
			_, _ = c.Writer.Write([]byte("data: "))
			_, _ = c.Writer.Write(payload)
			_, _ = c.Writer.Write([]byte("\n\n"))
			flusher.Flush()
		}
	}
}

func getAuthorizedUserID(c *gin.Context) (string, bool) {
	rawUserID, exists := c.Get(middleware.ContextUserIDKey)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return "", false
	}

	userID, ok := rawUserID.(string)
	if !ok || userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return "", false
	}

	return userID, true
}
