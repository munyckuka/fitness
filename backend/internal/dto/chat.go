package dto

import "encoding/json"

type EnsureDialogRequest struct {
	PeerUserID string `json:"peerUserId" binding:"required"`
}

type SendMessageRequest struct {
	Text     string          `json:"text"`
	Kind     string          `json:"kind"`
	Metadata json.RawMessage `json:"metadata"`
}

type MarkReadRequest struct {
	MessageID string `json:"messageId"`
}

type ChatDialogResponse struct {
	ConversationID  string  `json:"conversationId"`
	PeerUserID      string  `json:"peerUserId"`
	PeerName        string  `json:"peerName"`
	PeerLogin       string  `json:"peerLogin"`
	LastMessageText string  `json:"lastMessageText"`
	LastMessageAt   *string `json:"lastMessageAt,omitempty"`
	UnreadCount     int64   `json:"unreadCount"`
}

type ChatMessageResponse struct {
	ID             string          `json:"id"`
	ConversationID string          `json:"conversationId"`
	SenderID       string          `json:"senderId"`
	Kind           string          `json:"kind"`
	Text           string          `json:"text"`
	Metadata       json.RawMessage `json:"metadata,omitempty"`
	CreatedAt      string          `json:"createdAt"`
}

type ChatEventResponse struct {
	Type           string               `json:"type"`
	ConversationID string               `json:"conversationId,omitempty"`
	Message        *ChatMessageResponse `json:"message,omitempty"`
	ReadByUserID   string               `json:"readByUserId,omitempty"`
	ReadMessageID  string               `json:"readMessageId,omitempty"`
}
