package mocks

import (
	"context"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
	"github.com/jonadableite/turbozap-api/internal/infrastructure/whatsapp"
)

// MockWhatsAppManager mocks the WhatsApp manager for testing
type MockWhatsAppManager struct {
	CreateClientFunc       func(instance *entity.Instance) (*whatsapp.Client, error)
	GetClientFunc          func(instanceID uuid.UUID) (*whatsapp.Client, bool)
	ConnectFunc            func(ctx context.Context, instanceID uuid.UUID) error
	DisconnectFunc         func(instanceID uuid.UUID) error
	IsConnectedFunc        func(instanceID uuid.UUID) bool
	GetConnectionInfoFunc  func(instanceID uuid.UUID) (phone, name, pic string, err error)
	SendTextFunc           func(ctx context.Context, instanceID uuid.UUID, to, text string, quotedID string, mentions []string) (string, error)
	SendImageFunc          func(ctx context.Context, instanceID uuid.UUID, to string, imageData []byte, mimeType, caption string, quotedID string) (string, error)
	SendVideoFunc          func(ctx context.Context, instanceID uuid.UUID, to string, videoData []byte, mimeType, caption string, quotedID string) (string, error)
	SendAudioFunc          func(ctx context.Context, instanceID uuid.UUID, to string, audioData []byte, mimeType string, ptt bool, quotedID string) (string, error)
	SendDocumentFunc       func(ctx context.Context, instanceID uuid.UUID, to string, docData []byte, mimeType, fileName, caption string, quotedID string) (string, error)
	SendButtonsFunc        func(ctx context.Context, instanceID uuid.UUID, to, text, footer string, buttons []whatsapp.ButtonData, header *whatsapp.HeaderData) (string, error)
	SendListFunc           func(ctx context.Context, instanceID uuid.UUID, to, title, description, buttonText, footer string, sections []whatsapp.ListSectionData) (string, error)
	SendPollFunc           func(ctx context.Context, instanceID uuid.UUID, to, question string, options []string, selectableCount int) (string, error)
}

func (m *MockWhatsAppManager) CreateClient(instance *entity.Instance) (*whatsapp.Client, error) {
	if m.CreateClientFunc != nil {
		return m.CreateClientFunc(instance)
	}
	return nil, nil
}

func (m *MockWhatsAppManager) GetClient(instanceID uuid.UUID) (*whatsapp.Client, bool) {
	if m.GetClientFunc != nil {
		return m.GetClientFunc(instanceID)
	}
	return nil, false
}

func (m *MockWhatsAppManager) Connect(ctx context.Context, instanceID uuid.UUID) error {
	if m.ConnectFunc != nil {
		return m.ConnectFunc(ctx, instanceID)
	}
	return nil
}

func (m *MockWhatsAppManager) Disconnect(instanceID uuid.UUID) error {
	if m.DisconnectFunc != nil {
		return m.DisconnectFunc(instanceID)
	}
	return nil
}

func (m *MockWhatsAppManager) IsConnected(instanceID uuid.UUID) bool {
	if m.IsConnectedFunc != nil {
		return m.IsConnectedFunc(instanceID)
	}
	return true
}

func (m *MockWhatsAppManager) GetConnectionInfo(instanceID uuid.UUID) (phone, name, pic string, err error) {
	if m.GetConnectionInfoFunc != nil {
		return m.GetConnectionInfoFunc(instanceID)
	}
	return "5511999999999", "Test User", "", nil
}

func (m *MockWhatsAppManager) SendText(ctx context.Context, instanceID uuid.UUID, to, text string, quotedID string, mentions []string) (string, error) {
	if m.SendTextFunc != nil {
		return m.SendTextFunc(ctx, instanceID, to, text, quotedID, mentions)
	}
	return "mock-message-id", nil
}

func (m *MockWhatsAppManager) SendImage(ctx context.Context, instanceID uuid.UUID, to string, imageData []byte, mimeType, caption string, quotedID string) (string, error) {
	if m.SendImageFunc != nil {
		return m.SendImageFunc(ctx, instanceID, to, imageData, mimeType, caption, quotedID)
	}
	return "mock-message-id", nil
}

func (m *MockWhatsAppManager) SendVideo(ctx context.Context, instanceID uuid.UUID, to string, videoData []byte, mimeType, caption string, quotedID string) (string, error) {
	if m.SendVideoFunc != nil {
		return m.SendVideoFunc(ctx, instanceID, to, videoData, mimeType, caption, quotedID)
	}
	return "mock-message-id", nil
}

func (m *MockWhatsAppManager) SendAudio(ctx context.Context, instanceID uuid.UUID, to string, audioData []byte, mimeType string, ptt bool, quotedID string) (string, error) {
	if m.SendAudioFunc != nil {
		return m.SendAudioFunc(ctx, instanceID, to, audioData, mimeType, ptt, quotedID)
	}
	return "mock-message-id", nil
}

func (m *MockWhatsAppManager) SendDocument(ctx context.Context, instanceID uuid.UUID, to string, docData []byte, mimeType, fileName, caption string, quotedID string) (string, error) {
	if m.SendDocumentFunc != nil {
		return m.SendDocumentFunc(ctx, instanceID, to, docData, mimeType, fileName, caption, quotedID)
	}
	return "mock-message-id", nil
}

func (m *MockWhatsAppManager) SendButtons(ctx context.Context, instanceID uuid.UUID, to, text, footer string, buttons []whatsapp.ButtonData, header *whatsapp.HeaderData) (string, error) {
	if m.SendButtonsFunc != nil {
		return m.SendButtonsFunc(ctx, instanceID, to, text, footer, buttons, header)
	}
	return "mock-message-id", nil
}

func (m *MockWhatsAppManager) SendList(ctx context.Context, instanceID uuid.UUID, to, title, description, buttonText, footer string, sections []whatsapp.ListSectionData) (string, error) {
	if m.SendListFunc != nil {
		return m.SendListFunc(ctx, instanceID, to, title, description, buttonText, footer, sections)
	}
	return "mock-message-id", nil
}

func (m *MockWhatsAppManager) SendPoll(ctx context.Context, instanceID uuid.UUID, to, question string, options []string, selectableCount int) (string, error) {
	if m.SendPollFunc != nil {
		return m.SendPollFunc(ctx, instanceID, to, question, options, selectableCount)
	}
	return "mock-message-id", nil
}

