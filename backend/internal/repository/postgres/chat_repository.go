package postgres

import (
	"backend/internal/domain"
	"backend/internal/repository"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type ChatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) ListDialogs(ctx context.Context, userID uuid.UUID) ([]domain.ChatDialog, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT
			c.id,
			peer.id,
			COALESCE(peer.name, 'Пользователь') AS peer_name,
			COALESCE(peer.login, '') AS peer_login,
			COALESCE(last_msg.body, '') AS last_message_text,
			last_msg.sender_id,
			last_msg.created_at,
			(
				SELECT COUNT(*)
				FROM messages unread
				LEFT JOIN messages read_msg ON read_msg.id = cp.last_read_message_id
				WHERE unread.conversation_id = c.id
				  AND unread.sender_id <> $1
				  AND (cp.last_read_message_id IS NULL OR unread.created_at > read_msg.created_at)
			) AS unread_count
		FROM conversation_participants cp
		JOIN conversations c ON c.id = cp.conversation_id
		JOIN conversation_participants peer_cp ON peer_cp.conversation_id = c.id AND peer_cp.user_id <> $1
		JOIN users peer ON peer.id = peer_cp.user_id
		LEFT JOIN messages last_msg ON last_msg.id = c.last_message_id
		WHERE cp.user_id = $1
		ORDER BY COALESCE(last_msg.created_at, c.updated_at, c.created_at) DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	dialogs := make([]domain.ChatDialog, 0)
	for rows.Next() {
		var item domain.ChatDialog
		var lastSenderID sql.NullString
		var lastMessageAt sql.NullTime

		if err := rows.Scan(
			&item.ConversationID,
			&item.PeerUserID,
			&item.PeerName,
			&item.PeerLogin,
			&item.LastMessageText,
			&lastSenderID,
			&lastMessageAt,
			&item.UnreadCount,
		); err != nil {
			return nil, err
		}

		if lastSenderID.Valid {
			parsedSenderID, parseErr := uuid.Parse(lastSenderID.String)
			if parseErr == nil {
				item.LastMessageSenderID = &parsedSenderID
			}
		}
		if lastMessageAt.Valid {
			value := lastMessageAt.Time
			item.LastMessageAt = &value
		}

		dialogs = append(dialogs, item)
	}

	return dialogs, rows.Err()
}

func (r *ChatRepository) GetOrCreateDialog(ctx context.Context, userID uuid.UUID, peerUserID uuid.UUID) (domain.ChatDialog, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.ChatDialog{}, err
	}
	defer tx.Rollback()

	var conversationID uuid.UUID
	err = tx.QueryRowContext(ctx, `
		SELECT cp1.conversation_id
		FROM conversation_participants cp1
		JOIN conversation_participants cp2 ON cp2.conversation_id = cp1.conversation_id
		WHERE cp1.user_id = $1 AND cp2.user_id = $2
		LIMIT 1
	`, userID, peerUserID).Scan(&conversationID)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return domain.ChatDialog{}, err
		}

		conversationID = uuid.New()
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO conversations (id, created_at, updated_at)
			VALUES ($1, NOW(), NOW())
		`, conversationID); err != nil {
			return domain.ChatDialog{}, err
		}

		if _, err := tx.ExecContext(ctx, `
			INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
			VALUES ($1, $2, NOW()), ($1, $3, NOW())
		`, conversationID, userID, peerUserID); err != nil {
			return domain.ChatDialog{}, err
		}
	}

	var peerName sql.NullString
	var peerLogin sql.NullString
	if err := tx.QueryRowContext(ctx, `
		SELECT name, login
		FROM users
		WHERE id = $1
	`, peerUserID).Scan(&peerName, &peerLogin); err != nil {
		return domain.ChatDialog{}, err
	}

	if err := tx.Commit(); err != nil {
		return domain.ChatDialog{}, err
	}

	name := "Пользователь"
	if peerName.Valid && peerName.String != "" {
		name = peerName.String
	}

	login := ""
	if peerLogin.Valid {
		login = peerLogin.String
	}

	return domain.ChatDialog{
		ConversationID: conversationID,
		PeerUserID:     peerUserID,
		PeerName:       name,
		PeerLogin:      login,
	}, nil
}

func (r *ChatRepository) ListMessages(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, limit int, beforeMessageID *uuid.UUID) ([]domain.ChatMessage, error) {
	if err := r.ensureParticipant(ctx, userID, conversationID); err != nil {
		return nil, err
	}

	var beforeAt *time.Time
	if beforeMessageID != nil {
		var value time.Time
		err := r.db.QueryRowContext(ctx, `
			SELECT created_at
			FROM messages
			WHERE id = $1 AND conversation_id = $2
		`, *beforeMessageID, conversationID).Scan(&value)
		if err != nil && !errors.Is(err, sql.ErrNoRows) {
			return nil, err
		}
		if err == nil {
			beforeAt = &value
		}
	}

	query := `
		SELECT id, conversation_id, sender_id, kind, body, COALESCE(metadata, '{}'::jsonb), created_at
		FROM messages
		WHERE conversation_id = $1
	`
	args := []any{conversationID}

	if beforeAt != nil {
		query += ` AND created_at < $2`
		args = append(args, *beforeAt)
	}

	query += ` ORDER BY created_at DESC LIMIT ` + fmt.Sprintf("%d", limit)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := make([]domain.ChatMessage, 0)
	for rows.Next() {
		var msg domain.ChatMessage
		var metadataBytes []byte

		if err := rows.Scan(&msg.ID, &msg.ConversationID, &msg.SenderID, &msg.Kind, &msg.Body, &metadataBytes, &msg.CreatedAt); err != nil {
			return nil, err
		}

		if len(metadataBytes) > 0 {
			msg.Metadata = json.RawMessage(metadataBytes)
		}

		messages = append(messages, msg)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (r *ChatRepository) SaveMessage(ctx context.Context, conversationID uuid.UUID, senderID uuid.UUID, text string) (domain.ChatMessage, error) {
	if err := r.ensureParticipant(ctx, senderID, conversationID); err != nil {
		return domain.ChatMessage{}, err
	}

	message := domain.ChatMessage{
		ID:             uuid.New(),
		ConversationID: conversationID,
		SenderID:       senderID,
		Kind:           "text",
		Body:           text,
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return domain.ChatMessage{}, err
	}
	defer tx.Rollback()

	if err := tx.QueryRowContext(ctx, `
		INSERT INTO messages (id, conversation_id, sender_id, kind, body, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, '{}'::jsonb, NOW())
		RETURNING created_at
	`, message.ID, message.ConversationID, message.SenderID, message.Kind, message.Body).Scan(&message.CreatedAt); err != nil {
		return domain.ChatMessage{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE conversations
		SET last_message_id = $1,
		    updated_at = NOW()
		WHERE id = $2
	`, message.ID, conversationID); err != nil {
		return domain.ChatMessage{}, err
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE conversation_participants
		SET updated_at = NOW()
		WHERE conversation_id = $1
	`, conversationID); err != nil {
		return domain.ChatMessage{}, err
	}

	if err := tx.Commit(); err != nil {
		return domain.ChatMessage{}, err
	}

	return message, nil
}

func (r *ChatRepository) MarkReadUpTo(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID, messageID uuid.UUID) error {
	if err := r.ensureParticipant(ctx, userID, conversationID); err != nil {
		return err
	}

	var exists bool
	if err := r.db.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM messages
			WHERE id = $1 AND conversation_id = $2
		)
	`, messageID, conversationID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return errors.New("message not found")
	}

	_, err := r.db.ExecContext(ctx, `
		UPDATE conversation_participants
		SET last_read_message_id = $1,
		    last_read_at = NOW(),
		    updated_at = NOW()
		WHERE user_id = $2 AND conversation_id = $3
	`, messageID, userID, conversationID)
	return err
}

func (r *ChatRepository) GetLatestMessageID(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) (uuid.UUID, error) {
	if err := r.ensureParticipant(ctx, userID, conversationID); err != nil {
		return uuid.Nil, err
	}

	var messageID uuid.UUID
	var rawMessageID sql.NullString
	if err := r.db.QueryRowContext(ctx, `
		SELECT last_message_id::text
		FROM conversations
		WHERE id = $1
	`, conversationID).Scan(&rawMessageID); err != nil {
		return uuid.Nil, err
	}

	if !rawMessageID.Valid || rawMessageID.String == "" {
		return uuid.Nil, errors.New("dialog has no messages")
	}

	parsedID, err := uuid.Parse(rawMessageID.String)
	if err != nil {
		return uuid.Nil, err
	}
	messageID = parsedID

	return messageID, nil
}

func (r *ChatRepository) GetDialogParticipantIDs(ctx context.Context, conversationID uuid.UUID) ([]uuid.UUID, error) {
	rows, err := r.db.QueryContext(ctx, `
		SELECT user_id
		FROM conversation_participants
		WHERE conversation_id = $1
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ids := make([]uuid.UUID, 0, 2)
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}

	return ids, rows.Err()
}

func (r *ChatRepository) ensureParticipant(ctx context.Context, userID uuid.UUID, conversationID uuid.UUID) error {
	var exists bool
	err := r.db.QueryRowContext(ctx, `
		SELECT EXISTS(
			SELECT 1
			FROM conversation_participants
			WHERE user_id = $1 AND conversation_id = $2
		)
	`, userID, conversationID).Scan(&exists)
	if err != nil {
		return err
	}
	if !exists {
		return repository.ErrUserNotFound
	}

	return nil
}
