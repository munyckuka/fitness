package domain

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type ChatDialog struct {
	ConversationID      uuid.UUID
	PeerUserID          uuid.UUID
	PeerName            string
	PeerLogin           string
	LastMessageText     string
	LastMessageSenderID *uuid.UUID
	LastMessageAt       *time.Time
	UnreadCount         int64
}

type ChatMessage struct {
	ID             uuid.UUID
	ConversationID uuid.UUID
	SenderID       uuid.UUID
	Kind           string
	Body           string
	Metadata       json.RawMessage
	CreatedAt      time.Time
}
