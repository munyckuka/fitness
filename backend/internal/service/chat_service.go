package service

import (
	"backend/internal/domain"
	"backend/internal/realtime"
	"backend/internal/repository"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
)

var ErrEmptyMessage = errors.New("message text is required")

type chatService struct {
	repo repository.ChatRepository
	hub  *realtime.SSEHub
}

func NewChatService(repo repository.ChatRepository, hub *realtime.SSEHub) ChatService {
	return &chatService{repo: repo, hub: hub}
}

func (s *chatService) ListDialogs(ctx context.Context, userID string) ([]domain.ChatDialog, error) {
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}

	return s.repo.ListDialogs(ctx, parsedUserID)
}

func (s *chatService) EnsureDialog(ctx context.Context, userID string, peerUserID string) (domain.ChatDialog, error) {
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return domain.ChatDialog{}, fmt.Errorf("invalid user id: %w", err)
	}

	parsedPeerID, err := uuid.Parse(peerUserID)
	if err != nil {
		return domain.ChatDialog{}, fmt.Errorf("invalid peer user id: %w", err)
	}

	if parsedUserID == parsedPeerID {
		return domain.ChatDialog{}, errors.New("cannot open dialog with self")
	}

	return s.repo.GetOrCreateDialog(ctx, parsedUserID, parsedPeerID)
}

func (s *chatService) ListMessages(ctx context.Context, userID string, conversationID string, limit int, beforeMessageID string) ([]domain.ChatMessage, error) {
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}

	parsedConversationID, err := uuid.Parse(conversationID)
	if err != nil {
		return nil, fmt.Errorf("invalid conversation id: %w", err)
	}

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var beforeID *uuid.UUID
	if beforeMessageID != "" {
		parsedBeforeID, parseErr := uuid.Parse(beforeMessageID)
		if parseErr != nil {
			return nil, fmt.Errorf("invalid before message id: %w", parseErr)
		}
		beforeID = &parsedBeforeID
	}

	return s.repo.ListMessages(ctx, parsedUserID, parsedConversationID, limit, beforeID)
}

func (s *chatService) SendMessage(ctx context.Context, userID string, conversationID string, text string, kind string, metadata []byte) (domain.ChatMessage, error) {
	trimmedText := strings.TrimSpace(text)
	if kind == "" {
		kind = "text"
	}

	if kind == "text" && trimmedText == "" {
		return domain.ChatMessage{}, ErrEmptyMessage
	}

	if kind != "text" && trimmedText == "" {
		trimmedText = "Сообщение"
	}

	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return domain.ChatMessage{}, fmt.Errorf("invalid user id: %w", err)
	}

	parsedConversationID, err := uuid.Parse(conversationID)
	if err != nil {
		return domain.ChatMessage{}, fmt.Errorf("invalid conversation id: %w", err)
	}

	message, err := s.repo.SaveMessage(ctx, parsedConversationID, parsedUserID, trimmedText, kind, metadata)
	if err != nil {
		return domain.ChatMessage{}, err
	}

	participants, err := s.repo.GetDialogParticipantIDs(ctx, parsedConversationID)
	if err == nil {
		eventPayload, marshalErr := json.Marshal(map[string]any{
			"type":           "message.new",
			"conversationId": message.ConversationID.String(),
			"message": map[string]any{
				"id":             message.ID.String(),
				"conversationId": message.ConversationID.String(),
				"senderId":       message.SenderID.String(),
				"kind":           message.Kind,
				"text":           message.Body,
				"metadata":       message.Metadata,
				"createdAt":      message.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
			},
		})
		if marshalErr == nil {
			for _, participantID := range participants {
				s.hub.Publish(participantID.String(), eventPayload)
			}
		}
	}

	return message, nil
}

func (s *chatService) MarkRead(ctx context.Context, userID string, conversationID string, messageID string) error {
	parsedUserID, err := uuid.Parse(userID)
	if err != nil {
		return fmt.Errorf("invalid user id: %w", err)
	}

	parsedConversationID, err := uuid.Parse(conversationID)
	if err != nil {
		return fmt.Errorf("invalid conversation id: %w", err)
	}

	var targetMessageID uuid.UUID
	if strings.TrimSpace(messageID) == "" {
		targetMessageID, err = s.repo.GetLatestMessageID(ctx, parsedUserID, parsedConversationID)
		if err != nil {
			return err
		}
	} else {
		targetMessageID, err = uuid.Parse(messageID)
		if err != nil {
			return fmt.Errorf("invalid message id: %w", err)
		}
	}

	if err := s.repo.MarkReadUpTo(ctx, parsedUserID, parsedConversationID, targetMessageID); err != nil {
		return err
	}

	participants, err := s.repo.GetDialogParticipantIDs(ctx, parsedConversationID)
	if err == nil {
		eventPayload, marshalErr := json.Marshal(map[string]any{
			"type":           "conversation.read",
			"conversationId": parsedConversationID.String(),
			"readByUserId":   parsedUserID.String(),
			"readMessageId":  targetMessageID.String(),
		})
		if marshalErr == nil {
			for _, participantID := range participants {
				if participantID == parsedUserID {
					continue
				}
				s.hub.Publish(participantID.String(), eventPayload)
			}
		}
	}

	return nil
}
