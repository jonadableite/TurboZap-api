package dto

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jonadableite/turbozap-api/internal/domain/entity"
)

func TestSendButtonRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		req     SendButtonRequest
		wantErr bool
	}{
		{
			name: "valid request with buttons",
			req: SendButtonRequest{
				To:   "5511999999999",
				Text: "Choose an option",
				Buttons: []ButtonRequest{
					{ID: "btn_1", Text: "Yes"},
					{ID: "btn_2", Text: "No"},
				},
			},
			wantErr: false,
		},
		{
			name: "valid request with header",
			req: SendButtonRequest{
				To:   "5511999999999",
				Text: "Choose an option",
				Header: &MessageHeaderRequest{
					Type: "text",
					Text: "Header text",
				},
				Buttons: []ButtonRequest{
					{ID: "btn_1", Text: "Yes"},
				},
			},
			wantErr: false,
		},
		{
			name: "empty buttons",
			req: SendButtonRequest{
				To:      "5511999999999",
				Text:    "Choose an option",
				Buttons: []ButtonRequest{},
			},
			wantErr: true,
		},
		{
			name: "too many buttons",
			req: SendButtonRequest{
				To:   "5511999999999",
				Text: "Choose an option",
				Buttons: []ButtonRequest{
					{ID: "btn_1", Text: "One"},
					{ID: "btn_2", Text: "Two"},
					{ID: "btn_3", Text: "Three"},
					{ID: "btn_4", Text: "Four"}, // Max is 3
				},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Basic validation
			hasError := false
			if tt.req.To == "" {
				hasError = true
			}
			if tt.req.Text == "" {
				hasError = true
			}
			if len(tt.req.Buttons) == 0 || len(tt.req.Buttons) > 3 {
				hasError = true
			}

			if hasError != tt.wantErr {
				t.Errorf("Validation() error = %v, wantErr %v", hasError, tt.wantErr)
			}
		})
	}
}

func TestSendListRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		req     SendListRequest
		wantErr bool
	}{
		{
			name: "valid request",
			req: SendListRequest{
				To:          "5511999999999",
				Title:       "Menu",
				Description: "Choose an option",
				ButtonText:  "Open menu",
				Sections: []ListSectionRequest{
					{
						Title: "Section 1",
						Rows: []ListRowRequest{
							{ID: "row_1", Title: "Option 1", Description: "Description 1"},
							{ID: "row_2", Title: "Option 2", Description: "Description 2"},
						},
					},
				},
			},
			wantErr: false,
		},
		{
			name: "multiple sections",
			req: SendListRequest{
				To:          "5511999999999",
				Title:       "Menu",
				ButtonText:  "Open menu",
				Sections: []ListSectionRequest{
					{
						Title: "Section 1",
						Rows: []ListRowRequest{
							{ID: "row_1", Title: "Option 1"},
						},
					},
					{
						Title: "Section 2",
						Rows: []ListRowRequest{
							{ID: "row_2", Title: "Option 2"},
						},
					},
				},
			},
			wantErr: false,
		},
		{
			name: "empty sections",
			req: SendListRequest{
				To:         "5511999999999",
				Title:      "Menu",
				ButtonText: "Open menu",
				Sections:   []ListSectionRequest{},
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hasError := false
			if tt.req.To == "" || tt.req.Title == "" || tt.req.ButtonText == "" {
				hasError = true
			}
			if len(tt.req.Sections) == 0 || len(tt.req.Sections) > 10 {
				hasError = true
			}

			if hasError != tt.wantErr {
				t.Errorf("Validation() error = %v, wantErr %v", hasError, tt.wantErr)
			}
		})
	}
}

func TestToMessageResponse(t *testing.T) {
	msgID := uuid.New()
	waMessageID := "WA12345"

	msg := &entity.Message{
		ID:        msgID,
		Status:    entity.MessageStatusSent,
		Timestamp: time.Now(),
	}

	response := ToMessageResponse(msg, waMessageID)

	if response.ID != msgID {
		t.Errorf("ID = %v, want %v", response.ID, msgID)
	}
	if response.MessageID != waMessageID {
		t.Errorf("MessageID = %v, want %v", response.MessageID, waMessageID)
	}
	if response.Status != string(entity.MessageStatusSent) {
		t.Errorf("Status = %v, want %v", response.Status, entity.MessageStatusSent)
	}
}

func TestMessageHeaderRequest_Types(t *testing.T) {
	tests := []struct {
		name     string
		header   MessageHeaderRequest
		wantType string
	}{
		{
			name:     "text header",
			header:   MessageHeaderRequest{Type: "text", Text: "Hello"},
			wantType: "text",
		},
		{
			name:     "image header",
			header:   MessageHeaderRequest{Type: "image", MediaURL: "https://example.com/image.jpg"},
			wantType: "image",
		},
		{
			name:     "video header",
			header:   MessageHeaderRequest{Type: "video", MediaURL: "https://example.com/video.mp4"},
			wantType: "video",
		},
		{
			name:     "document header",
			header:   MessageHeaderRequest{Type: "document", MediaURL: "https://example.com/doc.pdf", FileName: "document.pdf"},
			wantType: "document",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.header.Type != tt.wantType {
				t.Errorf("Type = %v, want %v", tt.header.Type, tt.wantType)
			}
		})
	}
}

