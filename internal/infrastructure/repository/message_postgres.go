package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/domain/repository"
)

// messagePostgresRepository implements MessageRepository using PostgreSQL
type messagePostgresRepository struct {
	pool *pgxpool.Pool
}

// NewMessagePostgresRepository creates a new PostgreSQL-based message repository
func NewMessagePostgresRepository(pool *pgxpool.Pool) repository.MessageRepository {
	return &messagePostgresRepository{pool: pool}
}

// Create creates a new message record
func (r *messagePostgresRepository) Create(ctx context.Context, message *entity.Message) error {
	query := `
		INSERT INTO messages (id, instance_id, message_id, remote_jid, from_me, type, status, content, media_url, media_mime_type, media_caption, quoted_msg_id, timestamp, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
	`
	_, err := r.pool.Exec(ctx, query,
		message.ID,
		message.InstanceID,
		message.MessageID,
		message.RemoteJID,
		message.FromMe,
		string(message.Type),
		string(message.Status),
		message.Content,
		message.MediaURL,
		message.MediaMimeType,
		message.MediaCaption,
		message.QuotedMsgID,
		message.Timestamp,
		message.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create message: %w", err)
	}
	return nil
}

// GetByID retrieves a message by ID
func (r *messagePostgresRepository) GetByID(ctx context.Context, id uuid.UUID) (*entity.Message, error) {
	query := `
		SELECT id, instance_id, message_id, remote_jid, from_me, type, status, content, media_url, media_mime_type, media_caption, quoted_msg_id, timestamp, created_at
		FROM messages WHERE id = $1
	`
	return r.scanMessage(ctx, query, id)
}

// GetByMessageID retrieves a message by WhatsApp message ID
func (r *messagePostgresRepository) GetByMessageID(ctx context.Context, instanceID uuid.UUID, messageID string) (*entity.Message, error) {
	query := `
		SELECT id, instance_id, message_id, remote_jid, from_me, type, status, content, media_url, media_mime_type, media_caption, quoted_msg_id, timestamp, created_at
		FROM messages WHERE instance_id = $1 AND message_id = $2
	`
	return r.scanMessage(ctx, query, instanceID, messageID)
}

// GetByInstance retrieves all messages for an instance
func (r *messagePostgresRepository) GetByInstance(ctx context.Context, instanceID uuid.UUID, limit, offset int) ([]*entity.Message, error) {
	query := `
		SELECT id, instance_id, message_id, remote_jid, from_me, type, status, content, media_url, media_mime_type, media_caption, quoted_msg_id, timestamp, created_at
		FROM messages WHERE instance_id = $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3
	`
	return r.scanMessages(ctx, query, instanceID, limit, offset)
}

// GetByRemoteJID retrieves messages for a specific chat
func (r *messagePostgresRepository) GetByRemoteJID(ctx context.Context, instanceID uuid.UUID, remoteJID string, limit, offset int) ([]*entity.Message, error) {
	query := `
		SELECT id, instance_id, message_id, remote_jid, from_me, type, status, content, media_url, media_mime_type, media_caption, quoted_msg_id, timestamp, created_at
		FROM messages WHERE instance_id = $1 AND remote_jid = $2 ORDER BY timestamp DESC LIMIT $3 OFFSET $4
	`
	return r.scanMessages(ctx, query, instanceID, remoteJID, limit, offset)
}

// GetByDateRange retrieves messages within a date range
func (r *messagePostgresRepository) GetByDateRange(ctx context.Context, instanceID uuid.UUID, start, end time.Time) ([]*entity.Message, error) {
	query := `
		SELECT id, instance_id, message_id, remote_jid, from_me, type, status, content, media_url, media_mime_type, media_caption, quoted_msg_id, timestamp, created_at
		FROM messages WHERE instance_id = $1 AND timestamp BETWEEN $2 AND $3 ORDER BY timestamp DESC
	`
	return r.scanMessages(ctx, query, instanceID, start, end)
}

// UpdateStatus updates the status of a message
func (r *messagePostgresRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.MessageStatus) error {
	query := `UPDATE messages SET status = $2 WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id, string(status))
	if err != nil {
		return fmt.Errorf("failed to update message status: %w", err)
	}
	return nil
}

// UpdateStatusByMessageID updates the status using WhatsApp message ID
func (r *messagePostgresRepository) UpdateStatusByMessageID(ctx context.Context, instanceID uuid.UUID, messageID string, status entity.MessageStatus) error {
	query := `UPDATE messages SET status = $3 WHERE instance_id = $1 AND message_id = $2`
	_, err := r.pool.Exec(ctx, query, instanceID, messageID, string(status))
	if err != nil {
		return fmt.Errorf("failed to update message status by message_id: %w", err)
	}
	return nil
}

// Delete deletes a message
func (r *messagePostgresRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM messages WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete message: %w", err)
	}
	return nil
}

// DeleteByInstance deletes all messages for an instance
func (r *messagePostgresRepository) DeleteByInstance(ctx context.Context, instanceID uuid.UUID) error {
	query := `DELETE FROM messages WHERE instance_id = $1`
	_, err := r.pool.Exec(ctx, query, instanceID)
	if err != nil {
		return fmt.Errorf("failed to delete messages by instance: %w", err)
	}
	return nil
}

// Helper function to scan a single message
func (r *messagePostgresRepository) scanMessage(ctx context.Context, query string, args ...interface{}) (*entity.Message, error) {
	row := r.pool.QueryRow(ctx, query, args...)

	var message entity.Message
	var msgType, status string
	var content, mediaURL, mediaMimeType, mediaCaption, quotedMsgID, messageID *string

	err := row.Scan(
		&message.ID,
		&message.InstanceID,
		&messageID,
		&message.RemoteJID,
		&message.FromMe,
		&msgType,
		&status,
		&content,
		&mediaURL,
		&mediaMimeType,
		&mediaCaption,
		&quotedMsgID,
		&message.Timestamp,
		&message.CreatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to scan message: %w", err)
	}

	message.Type = entity.MessageType(msgType)
	message.Status = entity.MessageStatus(status)
	if messageID != nil {
		message.MessageID = *messageID
	}
	if content != nil {
		message.Content = *content
	}
	if mediaURL != nil {
		message.MediaURL = *mediaURL
	}
	if mediaMimeType != nil {
		message.MediaMimeType = *mediaMimeType
	}
	if mediaCaption != nil {
		message.MediaCaption = *mediaCaption
	}
	if quotedMsgID != nil {
		message.QuotedMsgID = *quotedMsgID
	}

	return &message, nil
}

// Helper function to scan multiple messages
func (r *messagePostgresRepository) scanMessages(ctx context.Context, query string, args ...interface{}) ([]*entity.Message, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query messages: %w", err)
	}
	defer rows.Close()

	var messages []*entity.Message
	for rows.Next() {
		var message entity.Message
		var msgType, status string
		var content, mediaURL, mediaMimeType, mediaCaption, quotedMsgID, messageID *string

		err := rows.Scan(
			&message.ID,
			&message.InstanceID,
			&messageID,
			&message.RemoteJID,
			&message.FromMe,
			&msgType,
			&status,
			&content,
			&mediaURL,
			&mediaMimeType,
			&mediaCaption,
			&quotedMsgID,
			&message.Timestamp,
			&message.CreatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan message row: %w", err)
		}

		message.Type = entity.MessageType(msgType)
		message.Status = entity.MessageStatus(status)
		if messageID != nil {
			message.MessageID = *messageID
		}
		if content != nil {
			message.Content = *content
		}
		if mediaURL != nil {
			message.MediaURL = *mediaURL
		}
		if mediaMimeType != nil {
			message.MediaMimeType = *mediaMimeType
		}
		if mediaCaption != nil {
			message.MediaCaption = *mediaCaption
		}
		if quotedMsgID != nil {
			message.QuotedMsgID = *quotedMsgID
		}

		messages = append(messages, &message)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating messages: %w", err)
	}

	return messages, nil
}

// CountToday counts messages sent/received today
func (r *messagePostgresRepository) CountToday(ctx context.Context, instanceID *uuid.UUID) (int64, error) {
	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE DATE(created_at) = CURRENT_DATE
	`
	args := []interface{}{}
	
	if instanceID != nil {
		query += ` AND instance_id = $1`
		args = append(args, *instanceID)
	}
	
	var count int64
	err := r.pool.QueryRow(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count messages today: %w", err)
	}
	return count, nil
}

// CountTodayByInstances counts messages sent/received today for multiple instances
func (r *messagePostgresRepository) CountTodayByInstances(ctx context.Context, instanceIDs []uuid.UUID) (int64, error) {
	if len(instanceIDs) == 0 {
		return 0, nil
	}

	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE DATE(created_at) = CURRENT_DATE
		AND instance_id = ANY($1)
	`
	
	var count int64
	err := r.pool.QueryRow(ctx, query, instanceIDs).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count messages today by instances: %w", err)
	}
	return count, nil
}

// CountTotal counts total messages
func (r *messagePostgresRepository) CountTotal(ctx context.Context, instanceID *uuid.UUID) (int64, error) {
	query := `SELECT COUNT(*) FROM messages`
	args := []interface{}{}
	
	if instanceID != nil {
		query += ` WHERE instance_id = $1`
		args = append(args, *instanceID)
	}
	
	var count int64
	err := r.pool.QueryRow(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count total messages: %w", err)
	}
	return count, nil
}

// CountTotalByInstances counts total messages for multiple instances
func (r *messagePostgresRepository) CountTotalByInstances(ctx context.Context, instanceIDs []uuid.UUID) (int64, error) {
	if len(instanceIDs) == 0 {
		return 0, nil
	}

	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE instance_id = ANY($1)
	`
	
	var count int64
	err := r.pool.QueryRow(ctx, query, instanceIDs).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count total messages by instances: %w", err)
	}
	return count, nil
}

// CountByDateRange counts messages within a date range
func (r *messagePostgresRepository) CountByDateRange(ctx context.Context, instanceID *uuid.UUID, start, end time.Time) (int64, error) {
	query := `
		SELECT COUNT(*) 
		FROM messages 
		WHERE timestamp >= $1 AND timestamp <= $2
	`
	args := []interface{}{start, end}
	
	if instanceID != nil {
		query += ` AND instance_id = $3`
		args = append(args, *instanceID)
	}
	
	var count int64
	err := r.pool.QueryRow(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to count messages by date range: %w", err)
	}
	return count, nil
}

