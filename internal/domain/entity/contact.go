package entity

import (
	"time"

	"github.com/google/uuid"
)

// Contact represents a WhatsApp contact
type Contact struct {
	ID           uuid.UUID `json:"id"`
	InstanceID   uuid.UUID `json:"instance_id"`
	JID          string    `json:"jid"`
	PhoneNumber  string    `json:"phone_number"`
	Name         string    `json:"name,omitempty"`
	PushName     string    `json:"push_name,omitempty"`
	BusinessName string    `json:"business_name,omitempty"`
	ProfilePic   string    `json:"profile_pic,omitempty"`
	IsBlocked    bool      `json:"is_blocked"`
	IsBusiness   bool      `json:"is_business"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// NewContact creates a new contact entity
func NewContact(instanceID uuid.UUID, jid, phoneNumber string) *Contact {
	now := time.Now()
	return &Contact{
		ID:          uuid.New(),
		InstanceID:  instanceID,
		JID:         jid,
		PhoneNumber: phoneNumber,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// ContactInfo represents contact information response
type ContactInfo struct {
	JID          string `json:"jid"`
	PhoneNumber  string `json:"phone_number"`
	Name         string `json:"name,omitempty"`
	PushName     string `json:"push_name,omitempty"`
	BusinessName string `json:"business_name,omitempty"`
	ProfilePic   string `json:"profile_pic,omitempty"`
	Status       string `json:"status,omitempty"`
	IsBusiness   bool   `json:"is_business"`
	IsEnterprise bool   `json:"is_enterprise"`
	IsVerified   bool   `json:"is_verified"`
}

// CheckNumberRequest represents a request to check if numbers are on WhatsApp
type CheckNumberRequest struct {
	Numbers []string `json:"numbers"`
}

// CheckNumberResponse represents the response of checking numbers
type CheckNumberResponse struct {
	Number      string `json:"number"`
	JID         string `json:"jid,omitempty"`
	Exists      bool   `json:"exists"`
	IsBusiness  bool   `json:"is_business,omitempty"`
}

// ProfilePicRequest represents a request to get profile picture
type ProfilePicRequest struct {
	JID string `json:"jid"`
}

// ProfilePicResponse represents the profile picture response
type ProfilePicResponse struct {
	JID        string `json:"jid"`
	ProfilePic string `json:"profile_pic"`
}

// BlockContactRequest represents a request to block a contact
type BlockContactRequest struct {
	JID string `json:"jid"`
}

