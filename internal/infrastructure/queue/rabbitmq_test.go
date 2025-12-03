package queue

import (
	"context"
	"encoding/json"
	"testing"
	"time"
)

func TestMessage_JSON(t *testing.T) {
	msg := Message{
		ID:            "test-id",
		CorrelationID: "corr-123",
		InstanceID:    "instance-1",
		Type:          "send_text",
		To:            "5511999999999@s.whatsapp.net",
		Payload: map[string]interface{}{
			"text": "Hello, World!",
		},
		Priority:  1,
		Retries:   0,
		CreatedAt: time.Now(),
	}

	// Test JSON marshaling
	data, err := json.Marshal(msg)
	if err != nil {
		t.Fatalf("Failed to marshal message: %v", err)
	}

	// Test JSON unmarshaling
	var decoded Message
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal message: %v", err)
	}

	if decoded.ID != msg.ID {
		t.Errorf("ID = %v, want %v", decoded.ID, msg.ID)
	}
	if decoded.Type != msg.Type {
		t.Errorf("Type = %v, want %v", decoded.Type, msg.Type)
	}
	if decoded.To != msg.To {
		t.Errorf("To = %v, want %v", decoded.To, msg.To)
	}
}

func TestStatusMessage_JSON(t *testing.T) {
	status := StatusMessage{
		MessageID:     "msg-123",
		CorrelationID: "corr-123",
		InstanceID:    "instance-1",
		Status:        "sent",
		Timestamp:     time.Now(),
	}

	data, err := json.Marshal(status)
	if err != nil {
		t.Fatalf("Failed to marshal status: %v", err)
	}

	var decoded StatusMessage
	if err := json.Unmarshal(data, &decoded); err != nil {
		t.Fatalf("Failed to unmarshal status: %v", err)
	}

	if decoded.MessageID != status.MessageID {
		t.Errorf("MessageID = %v, want %v", decoded.MessageID, status.MessageID)
	}
	if decoded.Status != status.Status {
		t.Errorf("Status = %v, want %v", decoded.Status, status.Status)
	}
}

func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()

	if cfg.Exchange != "whatsapp.events" {
		t.Errorf("Exchange = %v, want whatsapp.events", cfg.Exchange)
	}
	if cfg.ExchangeType != "topic" {
		t.Errorf("ExchangeType = %v, want topic", cfg.ExchangeType)
	}
	if cfg.MaxRetries != 3 {
		t.Errorf("MaxRetries = %v, want 3", cfg.MaxRetries)
	}
	if cfg.PrefetchCount != 10 {
		t.Errorf("PrefetchCount = %v, want 10", cfg.PrefetchCount)
	}
}

func TestQueueStats(t *testing.T) {
	stats := QueueStats{
		Name:      "test-queue",
		Messages:  100,
		Consumers: 2,
		Ready:     80,
		Unacked:   20,
	}

	if stats.Name != "test-queue" {
		t.Errorf("Name = %v, want test-queue", stats.Name)
	}
	if stats.Messages != 100 {
		t.Errorf("Messages = %v, want 100", stats.Messages)
	}
}

// MockPublisher for testing
type MockPublisher struct {
	PublishedMessages []Message
	PublishedStatuses []StatusMessage
}

func NewMockPublisher() *MockPublisher {
	return &MockPublisher{
		PublishedMessages: make([]Message, 0),
		PublishedStatuses: make([]StatusMessage, 0),
	}
}

func (m *MockPublisher) Publish(ctx context.Context, routingKey string, msg Message) error {
	m.PublishedMessages = append(m.PublishedMessages, msg)
	return nil
}

func (m *MockPublisher) PublishStatus(ctx context.Context, msg StatusMessage) error {
	m.PublishedStatuses = append(m.PublishedStatuses, msg)
	return nil
}

func TestMockPublisher_Publish(t *testing.T) {
	pub := NewMockPublisher()
	ctx := context.Background()

	msg := Message{
		ID:   "test-1",
		Type: "send_text",
		To:   "5511999999999",
	}

	if err := pub.Publish(ctx, "messages.send.text", msg); err != nil {
		t.Fatalf("Publish failed: %v", err)
	}

	if len(pub.PublishedMessages) != 1 {
		t.Errorf("Expected 1 published message, got %d", len(pub.PublishedMessages))
	}

	if pub.PublishedMessages[0].ID != msg.ID {
		t.Errorf("Published message ID = %v, want %v", pub.PublishedMessages[0].ID, msg.ID)
	}
}

